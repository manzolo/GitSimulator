import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, buildRun } from '../js/core/engine.js';
import { runToCompletion } from '../js/core/sim.js';

const env = { content: { A: 'hi\n', B: 'bye\n', C: 'x\n' } };
const run = (actions, e = env) => {
  const r = runHeadless({ actions, env: e });
  if (r.errors) throw new Error(`unexpected errors: ${JSON.stringify(r.errors)}`);
  return r.state;
};

test('staging writes one blob; equal content dedups', () => {
  const s = run([
    { op: 'write', path: 'a', content: { token: 'A' } },
    { op: 'write', path: 'b', content: { token: 'A' } },
    { op: 'stage', paths: ['a', 'b'] },
    { op: 'commit' },
  ]);
  assert.equal(s.repo.counts.blob, 1, 'one shared blob');
  assert.ok([...s.repo.reused].length > 0, 'a reuse fired');
});

test('writing a file creates no object until staged', () => {
  const s = run([{ op: 'write', path: 'a', content: { token: 'A' } }]);
  assert.equal(s.repo.counts.total, 0, 'no objects from a bare write');
  assert.ok('a' in s.repo.work, 'file is in the working tree');
});

test('second commit shares the unchanged blob', () => {
  const s = run([
    { op: 'write', path: 'a', content: { token: 'A' } },
    { op: 'write', path: 'b', content: { token: 'B' } },
    { op: 'stage', paths: ['a', 'b'] }, { op: 'commit' },
    { op: 'edit', path: 'b', content: { token: 'C' } },
    { op: 'stage', paths: ['b'] }, { op: 'commit' },
  ]);
  assert.equal(s.repo.counts.commit, 2);
  assert.equal(s.repo.counts.blob, 3, 'a, b-v1, b-v2');
});

test('merge produces a two-parent commit', () => {
  const s = run([
    { op: 'write', path: 'a', content: { token: 'A' } }, { op: 'stage', paths: ['a'] }, { op: 'commit' },
    { op: 'branch', name: 'feat' }, { op: 'checkout', target: 'feat' },
    { op: 'write', path: 'f', content: { token: 'B' } }, { op: 'stage', paths: ['f'] }, { op: 'commit' },
    { op: 'checkout', target: 'main' }, { op: 'merge', name: 'feat' },
  ]);
  assert.equal(s.repo.objects[s.repo.head].parents.length, 2);
  assert.equal(s.repo.counts.commit, 3);
});

test('branch adds a second ref on the same commit', () => {
  const s = run([
    { op: 'write', path: 'a', content: { token: 'A' } }, { op: 'stage', paths: ['a'] }, { op: 'commit' },
    { op: 'branch', name: 'feature' },
  ]);
  assert.equal(Object.keys(s.repo.branches).length, 2);
  assert.equal(s.repo.branches.main, s.repo.branches.feature);
});

test('delete-branch orphans a commit; gc collects it', () => {
  const base = [
    { op: 'write', path: 'k', content: { token: 'A' } }, { op: 'stage', paths: ['k'] }, { op: 'commit' },
    { op: 'branch', name: 'tmp' }, { op: 'checkout', target: 'tmp' },
    { op: 'write', path: 'z', content: { token: 'B' } }, { op: 'stage', paths: ['z'] }, { op: 'commit' },
    { op: 'checkout', target: 'main' }, { op: 'delete-branch', name: 'tmp' },
  ];
  const before = run(base);
  assert.ok(before.repo.unreachable.length >= 3, 'orphaned commit, tree and blob are unreachable');
  const after = run([...base, { op: 'gc' }]);
  assert.equal(after.repo.unreachable.length, 0);
  assert.equal(after.repo.counts.commit, 1, 'only main\'s commit survives');
});

test('Merkle: one changed byte cascades to the root tree and commit', () => {
  const s = run([
    { op: 'write', path: 'README', content: { token: 'A' } },
    { op: 'write', path: 'src/app.js', content: { token: 'B' } },
    { op: 'stage', paths: ['README', 'src/app.js'] }, { op: 'commit' },
    { op: 'edit', path: 'src/app.js', content: { token: 'C' } },
    { op: 'stage', paths: ['src/app.js'] }, { op: 'commit' },
  ]);
  const [c2, c1] = (() => {
    const objs = s.repo.objects; const out = []; let h = s.repo.head;
    while (h && objs[h]?.type === 'commit') { out.push(h); h = objs[h].parents[0]; }
    return out;
  })();
  assert.notEqual(s.repo.objects[c1].tree, s.repo.objects[c2].tree, 'root tree changed');
});

test('illegal op is rejected at build time', () => {
  const r = buildRun({ actions: [{ op: 'commit' }], allowedOps: ['write'], env });
  assert.ok(r.errors, 'op not allowed → build error');
  assert.equal(r.errors[0].code, 'errOpNotAllowed');
});

test('literal content refused when the level forbids it', () => {
  const r = buildRun({ actions: [{ op: 'write', path: 'a', content: 'raw bytes' }],
    allowLiteral: false, env });
  assert.ok(r.errors);
  assert.equal(r.errors[0].code, 'errLiteralContent');
});

test('stepping the sim replays the whole trace to the same final state', () => {
  const actions = [
    { op: 'write', path: 'a', content: { token: 'A' } }, { op: 'stage', paths: ['a'] }, { op: 'commit' },
  ];
  const built = buildRun({ actions, env });
  const total = built.trace.length;
  let steps = 0;
  while (!built.sim.halted) { if (built.sim.stepOnce() === null) break; steps += 1; }
  assert.equal(steps, total, 'one step per delta');
  assert.equal(built.sim.finalState().repo.counts.total, 3);
});
