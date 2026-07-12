// Engine facade: the single entry point the UI (buildRun) and the level verifier
// (runHeadless) use, so neither touches the Repo directly. It runs the action
// log eagerly against a fresh Repo, collecting a timestamped delta trace, then
// wraps the (already final) repo + trace in a GitSim. Illegal action logs return
// { errors } at build time — the analog of a regex parse error.

import { runActions, OPS } from './actions.js';
import { GitSim } from './sim.js';

// Legality gate (the capabilities() analog): every action's op must be allowed,
// and literal content is refused when the level forbids it.
export function checkActions(actions, { allowedOps = OPS, allowLiteral = true } = {}) {
  const allow = new Set(allowedOps.map((o) => (o === 'add' ? 'stage' : o)));
  const errors = [];
  actions.forEach((a, i) => {
    const op = a.op === 'add' ? 'stage' : a.op;
    if (!OPS.includes(op)) errors.push({ code: 'errUnknownOp', args: [a.op], at: i });
    else if (!allow.has(op)) errors.push({ code: 'errOpNotAllowed', args: [op], at: i });
    if (!allowLiteral && (op === 'write' || op === 'edit')) {
      const c = a.content;
      if (typeof c === 'string' || (c && 'bytes' in c)) {
        errors.push({ code: 'errLiteralContent', args: [], at: i });
      }
    }
  });
  return errors;
}

export function buildRun({ actions = [], env = { content: {} },
  allowedOps = OPS, allowLiteral = true } = {}) {
  const gateErrors = checkActions(actions, { allowedOps, allowLiteral });
  if (gateErrors.length) return { errors: gateErrors };

  const trace = [];
  let seq = 0;
  const emit = (e) => {
    e.seq = seq;
    e.time = seq + 1;         // one delta per tick → finest step granularity
    seq += 1;
    trace.push(e);
    return e;
  };

  const { repo, error } = runActions(actions, env, emit, { allowLiteral });
  if (error) return { errors: [error] };

  const sim = new GitSim(trace, { repo });
  return { sim, repo, trace };
}

// One-shot headless run for level verification and tests. The repo is already
// final after buildRun, so finalState() needs no stepping.
export function runHeadless(opts) {
  const built = buildRun(opts);
  if (built.errors) return { errors: built.errors };
  return { state: built.sim.finalState() };
}
