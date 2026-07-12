// The Repo: the mutable, DOM-free model of a git repository — working tree,
// staging index, object store, refs and HEAD — plus the high-level actions that
// mutate it. Every mutation EMITS an atomic delta (via the `emit` passed in by
// the engine), so the same code that computes the final state also produces the
// animation trace. `_put` is the single chokepoint that decides created vs
// REUSED — the content-addressed dedup, the signature moment.
//
// Objects are born only when you STAGE or COMMIT, never when you merely write a
// file — exactly like real git (`git add` writes the blob). That asymmetry is
// itself a lesson.

import { makeBlob, serializeTree, serializeCommit, MODE_FILE, MODE_TREE } from './objects.js';

export const HEAD_BRANCH = 'refs/heads/main';

// A recoverable, localizable action failure (code + args resolved by i18n).
export function actionError(code, args = []) {
  return { __action: true, code, args };
}

export class Repo {
  constructor() {
    this.objects = new Map();          // sha -> { sha, type, size, ...typed }
    this.index = new Map();            // path -> blobSha (the staging area)
    this.work = new Map();             // path -> content string (working tree)
    this.refs = new Map();             // 'refs/heads/x' -> commitSha
    this.HEAD = { type: 'branch', ref: HEAD_BRANCH }; // unborn until first commit
    this._reused = new Set();          // shas that ever fired 'object-reused'
  }

  resolveHead() {
    if (this.HEAD.type === 'branch') return this.refs.get(this.HEAD.ref) ?? null;
    return this.HEAD.sha ?? null;
  }

  // ---- the dedup gate --------------------------------------------------
  _put(obj, emit) {
    if (this.objects.has(obj.sha)) {
      this._reused.add(obj.sha);
      emit({ type: 'object-reused', objType: obj.type, sha: obj.sha });
      return false;
    }
    this.objects.set(obj.sha, obj);
    emit({ type: 'object-created', objType: obj.type, sha: obj.sha, size: obj.size,
      summary: this._summary(obj) });
    return true;
  }

  _summary(obj) {
    if (obj.type === 'blob') {
      const s = (obj.content ?? '').replace(/\n/g, '⏎');
      return s.length > 24 ? `${s.slice(0, 24)}…` : s;
    }
    if (obj.type === 'tree') return `${obj.entries.length} entr${obj.entries.length === 1 ? 'y' : 'ies'}`;
    return obj.message ?? '';
  }

  // ---- working tree ----------------------------------------------------
  writeFile(path, content, emit) {
    const isEdit = this.work.has(path);
    this.work.set(path, content);
    emit({ type: 'worktree-changed', path, op: isEdit ? 'edit' : 'write',
      sha: makeBlob(content).sha });
  }

  editFile(path, content, emit) {
    if (!this.work.has(path)) throw actionError('errUnknownFile', [path]);
    this.writeFile(path, content, emit);
  }

  deleteFile(path, emit) {
    if (!this.work.has(path)) throw actionError('errUnknownFile', [path]);
    this.work.delete(path);
    if (this.index.has(path)) {
      this.index.delete(path);
      emit({ type: 'index-updated', path, op: 'remove' });
    }
    emit({ type: 'worktree-changed', path, op: 'delete' });
  }

  // ---- staging ---------------------------------------------------------
  stage(paths, emit) {
    for (const path of paths) {
      if (!this.work.has(path)) throw actionError('errUnknownFile', [path]);
      const content = this.work.get(path);
      const blob = makeBlob(content);
      emit({ type: 'content-hashed', objType: 'blob', sha: blob.sha, size: blob.size, path });
      this._put({ sha: blob.sha, type: 'blob', size: blob.size, content }, emit);
      this.index.set(path, blob.sha);
      emit({ type: 'index-updated', path, sha: blob.sha, op: 'add' });
    }
  }

  // ---- commit ----------------------------------------------------------
  commit(message, emit) {
    const treeSha = this._buildTreeFromIndex(emit);
    const parent = this.resolveHead();
    const parents = parent ? [parent] : [];
    return this._makeCommit(treeSha, parents, message, emit);
  }

  _makeCommit(treeSha, parents, message, emit) {
    const c = serializeCommit({ tree: treeSha, parents, message });
    emit({ type: 'content-hashed', objType: 'commit', sha: c.sha, size: c.size });
    const created = this._put({ sha: c.sha, type: 'commit', size: c.size,
      tree: treeSha, parents: [...parents], message }, emit);
    if (created) {
      emit({ type: 'edge-added', from: c.sha, to: treeSha, kind: 'commit-tree' });
      for (const p of parents) emit({ type: 'edge-added', from: c.sha, to: p, kind: 'commit-parent' });
    }
    this._moveHeadCommit(c.sha, emit);
    return c.sha;
  }

  // Build the directory hierarchy from the flat index and serialize it
  // bottom-up, storing every tree (dedup-aware) and drawing its edges.
  _buildTreeFromIndex(emit) {
    const root = { files: new Map(), dirs: new Map() };
    for (const [path, sha] of this.index) {
      const parts = path.split('/');
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        const d = parts[i];
        if (!node.dirs.has(d)) node.dirs.set(d, { files: new Map(), dirs: new Map() });
        node = node.dirs.get(d);
      }
      node.files.set(parts[parts.length - 1], sha);
    }
    return this._serializeDir(root, emit);
  }

  _serializeDir(node, emit) {
    const entries = [];
    for (const [name, child] of node.dirs) {
      const subSha = this._serializeDir(child, emit);
      entries.push({ mode: MODE_TREE, name, sha: subSha, type: 'tree' });
    }
    for (const [name, sha] of node.files) {
      entries.push({ mode: MODE_FILE, name, sha, type: 'blob' });
    }
    const tree = serializeTree(entries);
    emit({ type: 'content-hashed', objType: 'tree', sha: tree.sha, size: tree.size });
    const created = this._put({ sha: tree.sha, type: 'tree', size: tree.size, entries: tree.entries }, emit);
    if (created) {
      for (const e of tree.entries) {
        emit({ type: 'edge-added', from: tree.sha, to: e.sha,
          kind: e.type === 'tree' ? 'tree-tree' : 'tree-blob', name: e.name, mode: e.mode });
      }
    }
    return tree.sha;
  }

  _moveHeadCommit(sha, emit) {
    const prev = this.resolveHead();
    if (this.HEAD.type === 'branch') {
      const from = this.refs.get(this.HEAD.ref) ?? null;
      this.refs.set(this.HEAD.ref, sha);
      emit({ type: 'ref-moved', ref: this.HEAD.ref, from, to: sha });
      emit({ type: 'head-moved', from: prev, to: sha, mode: 'branch', ref: this.HEAD.ref });
    } else {
      this.HEAD.sha = sha;
      emit({ type: 'head-moved', from: prev, to: sha, mode: 'detached' });
    }
  }

  // ---- refs / HEAD -----------------------------------------------------
  branch(name, emit) {
    const target = this.resolveHead();
    if (target == null) throw actionError('errNoCommit', []);
    const ref = `refs/heads/${name}`;
    if (this.refs.has(ref)) throw actionError('errBranchExists', [name]);
    this.refs.set(ref, target);
    emit({ type: 'ref-moved', ref, from: null, to: target });
  }

  deleteBranch(name, emit) {
    const ref = `refs/heads/${name}`;
    if (!this.refs.has(ref)) throw actionError('errUnknownRef', [name]);
    if (this.HEAD.type === 'branch' && this.HEAD.ref === ref) throw actionError('errDeleteCurrent', [name]);
    const from = this.refs.get(ref);
    this.refs.delete(ref);
    emit({ type: 'ref-deleted', ref, from });
  }

  checkout(target, emit) {
    const ref = `refs/heads/${target}`;
    const prev = this.resolveHead();
    if (this.refs.has(ref)) {
      this.HEAD = { type: 'branch', ref };
      const to = this.refs.get(ref);
      this._loadTreeIntoWork(to);
      emit({ type: 'head-moved', from: prev, to, mode: 'branch', ref });
    } else if (this.objects.has(target) && this.objects.get(target).type === 'commit') {
      this.HEAD = { type: 'detached', sha: target };
      this._loadTreeIntoWork(target);
      emit({ type: 'head-moved', from: prev, to: target, mode: 'detached' });
    } else {
      throw actionError('errUnknownRef', [target]);
    }
  }

  _loadTreeIntoWork(commitSha) {
    this.work = new Map();
    this.index = new Map();
    const commit = this.objects.get(commitSha);
    if (!commit) return;
    const walk = (treeSha, prefix) => {
      const tree = this.objects.get(treeSha);
      if (!tree) return;
      for (const e of tree.entries) {
        const p = prefix ? `${prefix}/${e.name}` : e.name;
        if (e.type === 'tree') walk(e.sha, p);
        else {
          const blob = this.objects.get(e.sha);
          this.work.set(p, blob?.content ?? '');
          this.index.set(p, e.sha);
        }
      }
    };
    walk(commit.tree, '');
  }

  // ---- merge (two parents) --------------------------------------------
  merge(name, emit) {
    const ref = `refs/heads/${name}`;
    if (!this.refs.has(ref)) throw actionError('errUnknownRef', [name]);
    const other = this.refs.get(ref);
    const cur = this.resolveHead();
    if (cur == null) throw actionError('errNoCommit', []);
    const base = this._mergeBase(cur, other);
    if (base) emit({ type: 'merge-base', sha: base });
    const treeSha = this._buildTreeFromIndex(emit);
    return this._makeCommit(treeSha, [cur, other], `merge ${name}`, emit);
  }

  _ancestors(sha) {
    const seen = new Set();
    const stack = [sha];
    while (stack.length) {
      const s = stack.pop();
      if (seen.has(s) || !this.objects.has(s)) continue;
      seen.add(s);
      for (const p of this.objects.get(s).parents ?? []) stack.push(p);
    }
    return seen;
  }

  _mergeBase(a, b) {
    const anc = this._ancestors(a);
    const stack = [b];
    const seen = new Set();
    while (stack.length) {
      const s = stack.pop();
      if (seen.has(s) || !this.objects.has(s)) continue;
      seen.add(s);
      if (anc.has(s)) return s;
      for (const p of this.objects.get(s).parents ?? []) stack.push(p);
    }
    return null;
  }

  // ---- garbage collection ---------------------------------------------
  gc(emit) {
    const roots = [...this.refs.values(), this.resolveHead()].filter(Boolean);
    const keep = this._closure(roots);
    const dangling = [...this.objects.keys()].filter((sha) => !keep.has(sha));
    for (const sha of dangling) {
      emit({ type: 'object-unreachable', objType: this.objects.get(sha).type, sha });
    }
    for (const sha of dangling) {
      this.objects.delete(sha);
      emit({ type: 'object-collected', sha });
    }
  }

  _closure(roots) {
    const seen = new Set();
    const stack = [...roots];
    while (stack.length) {
      const sha = stack.pop();
      if (seen.has(sha) || !this.objects.has(sha)) continue;
      seen.add(sha);
      const o = this.objects.get(sha);
      if (o.type === 'commit') { stack.push(o.tree); for (const p of o.parents) stack.push(p); }
      else if (o.type === 'tree') { for (const e of o.entries) stack.push(e.sha); }
    }
    return seen;
  }

  // ---- snapshot for verification & final render -----------------------
  snapshot() {
    const objects = {};
    for (const [sha, o] of this.objects) {
      objects[sha] = o.type === 'blob'
        ? { sha, type: 'blob', size: o.size, content: o.content }
        : o.type === 'tree'
          ? { sha, type: 'tree', size: o.size, entries: o.entries.map((e) => ({ ...e })) }
          : { sha, type: 'commit', size: o.size, tree: o.tree, parents: [...o.parents], message: o.message };
    }
    const byType = { blob: [], tree: [], commit: [] };
    for (const sha in objects) byType[objects[sha].type].push(sha);
    const counts = { blob: byType.blob.length, tree: byType.tree.length,
      commit: byType.commit.length, total: Object.keys(objects).length };

    const refs = {};
    const branches = {};
    for (const [ref, sha] of this.refs) {
      refs[ref] = sha;
      if (ref.startsWith('refs/heads/')) branches[ref.slice('refs/heads/'.length)] = sha;
    }
    const head = this.resolveHead();
    const HEAD = this.HEAD.type === 'branch'
      ? { type: 'branch', ref: this.HEAD.ref, sha: head }
      : { type: 'detached', sha: head };

    const index = {};
    for (const [p, s] of this.index) index[p] = s;
    const work = {};
    for (const [p, c] of this.work) work[p] = makeBlob(c).sha;

    const edges = [];
    for (const sha in objects) {
      const o = objects[sha];
      if (o.type === 'tree') {
        for (const e of o.entries) {
          edges.push({ from: sha, to: e.sha, kind: e.type === 'tree' ? 'tree-tree' : 'tree-blob',
            name: e.name, mode: e.mode });
        }
      } else if (o.type === 'commit') {
        edges.push({ from: sha, to: o.tree, kind: 'commit-tree' });
        for (const p of o.parents) edges.push({ from: sha, to: p, kind: 'commit-parent' });
      }
    }

    const refRoots = [...this.refs.values(), head].filter(Boolean);
    const fromRefs = this._closure(refRoots);
    const fromHead = this._closure([head].filter(Boolean));
    const unreachable = Object.keys(objects).filter((sha) => !fromRefs.has(sha));

    return { objects, byType, counts, refs, branches, HEAD, head, index, work, edges,
      reachable: { fromHead, fromRefs }, unreachable, reused: new Set(this._reused) };
  }
}
