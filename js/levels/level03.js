import { mkEnvs } from './generators.js';
import { all, blobCount, treeCount, commitCount, hasFile } from './util.js';

// Level 3 — the tree as a directory snapshot.
export default {
  id: 'tree',
  title: { en: 'The tree: a directory snapshot', it: 'Il tree: lo snapshot di una cartella' },
  text: {
    en: `<p>Blobs hold content but no names. So how does Git remember that a blob is called
<code>a.txt</code>? With a <strong>tree</strong> object — the snapshot of a directory. A tree
is a little table: for each entry, a <em>mode</em>, a <em>name</em>, and the <em>hash</em> of
the blob (or subtree) it points to.</p>
<p>Commit three <em>different</em> files. One tree appears, pointing to three blobs — that
tree is what "a directory, at this instant" means to Git.</p>`,
    it: `<p>I blob contengono i byte ma nessun nome. Come fa allora Git a ricordare che un blob
si chiama <code>a.txt</code>? Con un oggetto <strong>tree</strong> — lo snapshot di una
cartella. Un tree è una piccola tabella: per ogni voce un <em>mode</em>, un <em>nome</em> e
l'<em>hash</em> del blob (o sottoalbero) a cui punta.</p>
<p>Committa tre file <em>diversi</em>. Appare un tree che punta a tre blob — quel tree è ciò
che per Git significa "una cartella, in questo istante".</p>`,
  },
  goal: {
    en: 'Commit three files with distinct content: <code>a.txt</code>, <code>b.txt</code>, <code>c.txt</code>.',
    it: 'Committa tre file con contenuti distinti: <code>a.txt</code>, <code>b.txt</code>, <code>c.txt</code>.',
  },
  hints: [
    { en: 'Stage all three before committing — the tree is built from the index.',
      it: 'Fai staging di tutti e tre prima del commit — il tree è costruito dall\'index.' },
    { en: 'Distinct content means three blobs; the single tree points to all of them.',
      it: 'Contenuti distinti significano tre blob; l\'unico tree punta a tutti.' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B', 'C'],
  paths: ['a.txt', 'b.txt', 'c.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'alpha\n', B: 'beta\n', C: 'gamma\n' }],
    [{ A: '1\n', B: '2\n', C: '3\n' }, { A: 'red\n', B: 'green\n', C: 'blue\n' }],
    all(treeCount(1), blobCount(3), commitCount(1),
      hasFile('a.txt'), hasFile('b.txt'), hasFile('c.txt')),
  ),
};
