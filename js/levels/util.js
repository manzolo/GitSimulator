// Check helpers shared by level cases. `s` is a finalState(): { repo:{...} }.
// Every predicate asserts STRUCTURE or relative equality of shas — never a
// literal sha or literal bytes — so a level passes on any content environment.

// Resolve the {path: blobSha} snapshot of a commit's tree (recursively).
export function treeAt(s, commitSha) {
  const objs = s.repo.objects;
  const c = objs[commitSha];
  const out = {};
  if (!c || c.type !== 'commit') return out;
  const walk = (treeSha, prefix) => {
    const t = objs[treeSha];
    if (!t) return;
    for (const e of t.entries) {
      const p = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.type === 'tree') walk(e.sha, p);
      else out[p] = e.sha;
    }
  };
  walk(c.tree, '');
  return out;
}

export const treeOfHead = (s) => (s.repo.head ? treeAt(s, s.repo.head) : {});

// Commits from HEAD backwards along the FIRST parent (newest → oldest).
export function headHistory(s) {
  const objs = s.repo.objects;
  const out = [];
  let sha = s.repo.head;
  while (sha && objs[sha] && objs[sha].type === 'commit') {
    out.push(sha);
    sha = objs[sha].parents[0];
  }
  return out;
}

// The tree object sha of a commit (the root tree).
export const rootTreeOf = (s, commitSha) => s.repo.objects[commitSha]?.tree ?? null;

// ---- count predicates ----
export const blobCount = (n) => (s) => s.repo.counts.blob === n;
export const treeCount = (n) => (s) => s.repo.counts.tree === n;
export const commitCount = (n) => (s) => s.repo.counts.commit === n;
export const totalCount = (n) => (s) => s.repo.counts.total === n;

// ---- structural predicates on HEAD's tree ----
export const hasFile = (p) => (s) => p in treeOfHead(s);
export const sameBlob = (a, b) => (s) => { const t = treeOfHead(s); return !!t[a] && t[a] === t[b]; };
export const differentBlob = (a, b) => (s) => { const t = treeOfHead(s); return !!t[a] && !!t[b] && t[a] !== t[b]; };

// A file's blob is shared between two commits (same sha at the same path).
export const blobShared = (cA, cB, p) => (s) => {
  const a = treeAt(s, cA)[p];
  const b = treeAt(s, cB)[p];
  return !!a && a === b;
};

// ---- refs / HEAD / reachability ----
export const branchCount = (n) => (s) => Object.keys(s.repo.branches).length === n;
export const headOn = (branch) => (s) => s.repo.HEAD.type === 'branch'
  && s.repo.HEAD.ref === `refs/heads/${branch}`;
export const branchesSameCommit = (a, b) => (s) => {
  const x = s.repo.branches[a];
  const y = s.repo.branches[b];
  return !!x && x === y;
};
export const reused = (getSha) => (s) => s.repo.reused.has(getSha(s));
export const reachableFromHead = (getSha) => (s) => s.repo.reachable.fromHead.has(getSha(s));
export const unreachable = (getSha) => (s) => s.repo.unreachable.includes(getSha(s));
export const noUnreachable = (s) => s.repo.unreachable.length === 0;

// The HEAD commit has exactly `n` parents (merge → 2).
export const headParents = (n) => (s) => (s.repo.objects[s.repo.head]?.parents.length ?? -1) === n;

// ---- combinator ----
export const all = (...fs) => (s) => fs.every((f) => f(s));
export const and = all;
