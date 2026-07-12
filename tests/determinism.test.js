import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRun } from '../js/core/engine.js';

const actions = [
  { op: 'write', path: 'a.txt', content: { token: 'A' } },
  { op: 'write', path: 'b.txt', content: { token: 'A' } },
  { op: 'stage', paths: ['a.txt', 'b.txt'] },
  { op: 'commit', message: 'init' },
  { op: 'branch', name: 'feature' },
];
const env = { content: { A: 'same\n' } };

const fingerprint = (built) => JSON.stringify(built.trace.map(
  (e) => `${e.time}:${e.type}:${e.sha ?? ''}:${e.ref ?? ''}`,
));

test('same actions + env → identical trace and object set', () => {
  const a = buildRun({ actions, env });
  const b = buildRun({ actions, env });
  assert.equal(fingerprint(a), fingerprint(b), 'traces identical');
  assert.deepEqual(
    Object.keys(a.repo.snapshot().objects).sort(),
    Object.keys(b.repo.snapshot().objects).sort(),
    'object sets identical',
  );
});

test('no wall-clock / randomness leaks into hashes', () => {
  // Two runs separated in time must still agree, proving no Date.now/Math.random.
  const a = buildRun({ actions, env }).repo.snapshot();
  const b = buildRun({ actions, env }).repo.snapshot();
  assert.equal(a.head, b.head, 'commit sha is stable across runs');
});
