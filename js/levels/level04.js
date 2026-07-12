import { mkEnvs } from './generators.js';
import { all, blobCount, treeCount, commitCount, hasFile } from './util.js';

// Level 4 — nested trees (subfolders).
export default {
  id: 'nested-tree',
  title: { en: 'Nested trees (subfolders)', it: 'Tree annidati (sottocartelle)' },
  text: {
    en: `<p>A tree entry can point to another <strong>tree</strong> instead of a blob — that is
how a subfolder is represented. The directory hierarchy on disk becomes a hierarchy of tree
objects: the root tree points to the <code>src</code> tree, which points to a blob.</p>
<p>Put a file inside a folder. Two trees appear, linked by a <em>tree → tree</em> edge.</p>`,
    it: `<p>Una voce di un tree può puntare a un altro <strong>tree</strong> invece che a un blob
— è così che si rappresenta una sottocartella. La gerarchia di cartelle su disco diventa una
gerarchia di oggetti tree: il tree radice punta al tree <code>src</code>, che punta a un blob.</p>
<p>Metti un file dentro una cartella. Appaiono due tree, collegati da un arco <em>tree → tree</em>.</p>`,
  },
  goal: {
    en: 'Commit <code>README</code> and <code>src/main.js</code> — a root tree and a nested <code>src</code> tree.',
    it: 'Committa <code>README</code> e <code>src/main.js</code> — un tree radice e un tree <code>src</code> annidato.',
  },
  hints: [
    { en: 'Use a path with a slash: <code>src/main.js</code>.', it: 'Usa un percorso con lo slash: <code>src/main.js</code>.' },
    { en: 'Two files in two directories → two trees (root + <code>src</code>).',
      it: 'Due file in due cartelle → due tree (radice + <code>src</code>).' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['README', 'src/main.js'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: '# project\n', B: 'console.log(1)\n' }],
    [{ A: 'readme\n', B: 'code\n' }, { A: 'x\n', B: 'y\n' }],
    all(treeCount(2), blobCount(2), commitCount(1),
      hasFile('README'), hasFile('src/main.js')),
  ),
};
