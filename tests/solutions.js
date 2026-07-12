// A reference solution (a correct ACTION LOG) for every level. Shared by the
// level tests: if a level becomes unsolvable, or its cases reject the intended
// answer, the tests fail. Content is referenced by TOKEN, never literal bytes —
// the same discipline the levels enforce.

const w = (path, token) => ({ op: 'write', path, content: { token } });
const e = (path, token) => ({ op: 'edit', path, content: { token } });
const add = (...paths) => ({ op: 'stage', paths });
const commit = () => ({ op: 'commit', message: 'c' });
const branch = (name) => ({ op: 'branch', name });
const checkout = (name) => ({ op: 'checkout', target: name });
const merge = (name) => ({ op: 'merge', name });
const delBranch = (name) => ({ op: 'delete-branch', name });
const gc = () => ({ op: 'gc' });

export const SOLUTIONS = {
  'one-blob': [w('README', 'A'), add('README'), commit()],

  // Both files written from the SAME token → one shared blob (structural dedup).
  dedup: [w('a.txt', 'A'), w('b.txt', 'A'), add('a.txt', 'b.txt'), commit()],

  tree: [w('a.txt', 'A'), w('b.txt', 'B'), w('c.txt', 'C'), add('a.txt', 'b.txt', 'c.txt'), commit()],

  'nested-tree': [w('README', 'A'), w('src/main.js', 'B'), add('README', 'src/main.js'), commit()],

  'first-commit': [w('app.js', 'A'), w('style.css', 'B'), add('app.js', 'style.css'), commit()],

  'share-unchanged': [
    w('a.txt', 'A'), w('b.txt', 'B1'), add('a.txt', 'b.txt'), commit(),
    e('b.txt', 'B2'), add('b.txt'), commit(),
  ],

  'refs-head': [
    w('notes.txt', 'A1'), add('notes.txt'), commit(),
    e('notes.txt', 'A2'), add('notes.txt'), commit(),
  ],

  branch: [w('main.py', 'A'), add('main.py'), commit(), branch('feature')],

  merge: [
    w('base.txt', 'A'), add('base.txt'), commit(),
    branch('feature'), checkout('feature'),
    w('feature.txt', 'B'), add('feature.txt'), commit(),
    checkout('main'), merge('feature'),
  ],

  // Write both, stage/commit only a.txt; b.txt stays in the working tree.
  'index-tree': [w('a.txt', 'A'), w('b.txt', 'B'), add('a.txt'), commit()],

  'unreachable-gc': [
    w('keep.txt', 'A'), add('keep.txt'), commit(),
    branch('experiment'), checkout('experiment'),
    w('scratch.txt', 'B'), add('scratch.txt'), commit(),
    checkout('main'), delBranch('experiment'), gc(),
  ],

  merkle: [
    w('README', 'R'), w('src/app.js', 'A1'), add('README', 'src/app.js'), commit(),
    e('src/app.js', 'A2'), add('src/app.js'), commit(),
  ],

  'packfile-delta': [
    w('README', 'R'), w('docs/a.md', 'DA'), w('docs/b.md', 'DB1'), w('docs/c.md', 'DC'),
    add('README', 'docs/a.md', 'docs/b.md', 'docs/c.md'), commit(),
    e('docs/b.md', 'DB2'), add('docs/b.md'), commit(),
  ],

  capstone: [
    w('base.txt', 'A1'), add('base.txt'), commit(),
    branch('feature'), checkout('feature'),
    w('feature.txt', 'B'), add('feature.txt'), commit(),
    checkout('main'), e('base.txt', 'A2'), add('base.txt'), commit(),
    merge('feature'),
  ],
};

// A "cheat": a log hardwired to the visible environment. In level 2 the visible
// env binds A === B, so writing the two files from DIFFERENT tokens still yields
// one blob there — but a hidden env with A !== B produces two blobs and fails.
export const CHEATS = {
  dedup: [w('a.txt', 'A'), w('b.txt', 'B'), add('a.txt', 'b.txt'), commit()],
};
