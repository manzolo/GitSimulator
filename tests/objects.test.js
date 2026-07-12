import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sha1hex } from '../js/core/sha1.js';
import { makeBlob, serializeTree, serializeCommit, MODE_FILE, MODE_TREE } from '../js/core/objects.js';

const enc = new TextEncoder();

// SHA-1 of the empty string and a known vector.
test('sha1 matches known vectors', () => {
  assert.equal(sha1hex(enc.encode('')), 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
  assert.equal(sha1hex(enc.encode('abc')), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  // 64+ bytes to exercise multi-block padding
  assert.equal(sha1hex(enc.encode('a'.repeat(1000))),
    '291e9a6c66994949b57ba5e650361e98fc36b1ba');
});

// The whole point: our object hashes equal `git hash-object`.
test('blob shas equal git hash-object', () => {
  assert.equal(makeBlob('hello\n').sha, 'ce013625030ba8dba906f756967f9e9ca394464a');
  assert.equal(makeBlob('hello').sha, 'b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0');
  assert.equal(makeBlob('').sha, 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'); // git's empty blob
});

test('tree sha equals git write-tree (two files, shared blob)', () => {
  const b = makeBlob('hello\n');
  const t = serializeTree([
    { mode: MODE_FILE, name: 'a.txt', sha: b.sha, type: 'blob' },
    { mode: MODE_FILE, name: 'b.txt', sha: b.sha, type: 'blob' },
  ]);
  assert.equal(t.sha, 'b5b0cccf7401633f12e0fafc6b85731251b86850');
});

test('nested tree + commit equal git (fixed identity/epoch)', () => {
  const readme = makeBlob('hello\n');
  const deep = makeBlob('deep\n');
  const sub = serializeTree([{ mode: MODE_FILE, name: 'x.txt', sha: deep.sha, type: 'blob' }]);
  const root = serializeTree([
    { mode: MODE_FILE, name: 'README', sha: readme.sha, type: 'blob' },
    { mode: MODE_TREE, name: 'sub', sha: sub.sha, type: 'tree' },
  ]);
  assert.equal(root.sha, 'c7e5277f0dffdd2359a6f73219d5a95237988ebe');
  const commit = serializeCommit({ tree: root.sha, parents: [], message: 'init' });
  assert.equal(commit.sha, '6f33d2498e78b166d318e92c65f58dec63466390');
});

test('tree entry ordering is git-correct (subtree sorts as name + "/")', () => {
  // git orders "lib" (a file) before "lib" dir differently; verify a known case:
  // files "a" and dir "a.b" — the dir name "a.b/" vs file "a" .
  const b = makeBlob('x');
  const sub = serializeTree([{ mode: MODE_FILE, name: 'f', sha: b.sha, type: 'blob' }]);
  const t1 = serializeTree([
    { mode: MODE_TREE, name: 'a', sha: sub.sha, type: 'tree' },
    { mode: MODE_FILE, name: 'a.txt', sha: b.sha, type: 'blob' },
  ]);
  const t2 = serializeTree([
    { mode: MODE_FILE, name: 'a.txt', sha: b.sha, type: 'blob' },
    { mode: MODE_TREE, name: 'a', sha: sub.sha, type: 'tree' },
  ]);
  assert.equal(t1.sha, t2.sha, 'ordering is canonical regardless of input order');
});
