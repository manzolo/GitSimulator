// The action layer: the "program" is a log of high-level actions (recorded by
// the GUI). runActions applies a whole log to a fresh Repo against a content
// ENVIRONMENT — the token→bytes binding a level supplies. Referencing content
// by token (never literal bytes) is what powers the anti-cheat: a hidden case
// rebinds the tokens, so only a structurally-correct log survives.
//
// Action shapes (op + fields):
//   write/edit  { op, path, content:{token|bytes} }
//   delete      { op, path }
//   stage/add   { op, paths:[...] }        (single `path` also accepted)
//   commit      { op, message:{token|bytes}|string }
//   branch      { op, name }
//   checkout    { op, target }
//   merge       { op, name }
//   gc          { op }

import { Repo, actionError } from './repo.js';

// Canonical op set (aliases mapped). Used by checkActions and the UI.
export const OPS = ['write', 'edit', 'delete', 'stage', 'commit', 'branch', 'delete-branch',
  'checkout', 'merge', 'gc'];

function canonOp(op) {
  if (op === 'add') return 'stage';
  if (op === 'branch-d' || op === 'rm-branch') return 'delete-branch';
  return op;
}

export function resolveContent(spec, env, allowLiteral) {
  if (spec == null) return '';
  if (typeof spec === 'string') {
    if (!allowLiteral) throw actionError('errLiteralContent', []);
    return spec;
  }
  if ('token' in spec) {
    const v = env?.content?.[spec.token];
    if (v == null) throw actionError('errUnknownToken', [spec.token]);
    return v;
  }
  if ('bytes' in spec) {
    if (!allowLiteral) throw actionError('errLiteralContent', []);
    return spec.bytes;
  }
  return '';
}

function argsSummary(a) {
  const op = canonOp(a.op);
  if (op === 'write' || op === 'edit' || op === 'delete') return { path: a.path };
  if (op === 'stage') return { paths: a.paths ?? (a.path ? [a.path] : []) };
  if (op === 'branch' || op === 'delete-branch' || op === 'checkout' || op === 'merge') {
    return { name: a.name ?? a.target };
  }
  return {};
}

function applyAction(repo, a, env, emit, allowLiteral) {
  const op = canonOp(a.op);
  switch (op) {
    case 'write':
      repo.writeFile(a.path, resolveContent(a.content, env, allowLiteral), emit);
      break;
    case 'edit':
      repo.editFile(a.path, resolveContent(a.content, env, allowLiteral), emit);
      break;
    case 'delete':
      repo.deleteFile(a.path, emit);
      break;
    case 'stage':
      repo.stage(a.paths ?? (a.path ? [a.path] : []), emit);
      break;
    case 'commit':
      repo.commit(resolveContent(a.message ?? 'commit', env, true), emit);
      break;
    case 'branch':
      repo.branch(a.name, emit);
      break;
    case 'delete-branch':
      repo.deleteBranch(a.name ?? a.target, emit);
      break;
    case 'checkout':
      repo.checkout(a.target ?? a.name, emit);
      break;
    case 'merge':
      repo.merge(a.name ?? a.target, emit);
      break;
    case 'gc':
      repo.gc(emit);
      break;
    default:
      throw actionError('errUnknownOp', [a.op]);
  }
}

// Apply the whole log. Returns { repo, error } — error is a build-time failure
// (illegal action) carrying { code, args, at:index }, never a mid-step throw.
export function runActions(actions, env, emit, { allowLiteral = false } = {}) {
  const repo = new Repo();
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const emitA = (e) => emit({ ...e, action: i });
    emitA({ type: 'action-begin', op: canonOp(a.op), args: argsSummary(a) });
    try {
      applyAction(repo, a, env, emitA, allowLiteral);
    } catch (err) {
      if (err && err.__action) return { repo, error: { code: err.code, args: err.args, at: i } };
      throw err;
    }
  }
  return { repo, error: null };
}
