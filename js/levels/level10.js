import { mkEnvs } from './generators.js';
import { all, blobCount, commitCount, hasFile, treeOfHead } from './util.js';

// Level 10 — the staging area / index as the intermediate tree.
export default {
  id: 'index-tree',
  title: { en: 'The index: staging as a tree', it: 'L\'index: lo staging come tree' },
  text: {
    en: `<p>A commit does <em>not</em> snapshot your working directory — it snapshots the
<strong>index</strong> (the staging area). When you <code>stage</code> a file, its blob is
recorded in the index; <code>commit</code> then turns the index into a tree. A file you wrote
but never staged is invisible to the commit.</p>
<p>Write <code>a.txt</code> and <code>b.txt</code>, but stage and commit <strong>only</strong>
<code>a.txt</code>. The tree contains one blob; <code>b.txt</code> stays in the working tree,
outside history.</p>`,
    it: `<p>Un commit <em>non</em> fotografa la tua cartella di lavoro — fotografa l'<strong>index</strong>
(l'area di staging). Quando fai <code>stage</code> di un file, il suo blob viene registrato
nell'index; il <code>commit</code> trasforma poi l'index in un tree. Un file scritto ma mai
messo in stage è invisibile al commit.</p>
<p>Scrivi <code>a.txt</code> e <code>b.txt</code>, ma fai stage e commit <strong>solo</strong>
di <code>a.txt</code>. Il tree contiene un blob; <code>b.txt</code> resta nel working tree,
fuori dalla storia.</p>`,
  },
  goal: {
    en: 'Both files exist in the working tree, but only <code>a.txt</code> is committed.',
    it: 'Entrambi i file esistono nel working tree, ma solo <code>a.txt</code> è committato.',
  },
  hints: [
    { en: 'Write both files, but stage only <code>a.txt</code>.', it: 'Scrivi entrambi i file, ma fai stage solo di <code>a.txt</code>.' },
    { en: '<code>b.txt</code> must exist unstaged — the commit ignores it.', it: '<code>b.txt</code> deve esistere non-stageato — il commit lo ignora.' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['a.txt', 'b.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'committed\n', B: 'left behind\n' }],
    [{ A: 'in\n', B: 'out\n' }, { A: 'p\n', B: 'q\n' }],
    all(
      commitCount(1), blobCount(1), hasFile('a.txt'),
      (s) => !('b.txt' in treeOfHead(s)),
      (s) => 'b.txt' in s.repo.work,
    ),
  ),
};
