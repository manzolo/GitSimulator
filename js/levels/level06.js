import { mkEnvs } from './generators.js';
import {
  all, blobCount, commitCount, blobShared, headHistory, treeAt,
} from './util.js';

// Level 6 — the second commit shares the unchanged blob/tree.
export default {
  id: 'share-unchanged',
  title: { en: 'The second commit shares', it: 'Il secondo commit condivide' },
  text: {
    en: `<p>A commit is a <em>full snapshot</em>, not a diff — yet history doesn't explode.
Why? Because unchanged files keep the <strong>same content</strong>, so they keep the
<strong>same blob</strong>. The second commit's tree simply points at the old blob again.</p>
<p>Commit <code>a.txt</code> and <code>b.txt</code>. Then change <em>only</em> <code>b.txt</code>
and commit again. The new commit <strong>reuses</strong> <code>a.txt</code>'s blob — three
blobs total, not four.</p>`,
    it: `<p>Un commit è uno <em>snapshot completo</em>, non un diff — eppure la storia non
esplode. Perché? I file non modificati mantengono lo <strong>stesso contenuto</strong>, quindi
lo <strong>stesso blob</strong>. Il tree del secondo commit punta di nuovo al vecchio blob.</p>
<p>Committa <code>a.txt</code> e <code>b.txt</code>. Poi cambia <em>solo</em> <code>b.txt</code>
e committa di nuovo. Il nuovo commit <strong>riutilizza</strong> il blob di <code>a.txt</code>
— tre blob in totale, non quattro.</p>`,
  },
  goal: {
    en: 'Two commits. The second changes only <code>b.txt</code>; <code>a.txt</code>\'s blob is reused.',
    it: 'Due commit. Il secondo cambia solo <code>b.txt</code>; il blob di <code>a.txt</code> è riutilizzato.',
  },
  hints: [
    { en: 'Do not touch <code>a.txt</code> for the second commit.', it: 'Non toccare <code>a.txt</code> per il secondo commit.' },
    { en: 'Give <code>b.txt</code> its second content (<code>B2</code>) and re-stage only it.',
      it: 'Dai a <code>b.txt</code> il suo secondo contenuto (<code>B2</code>) e ri-stagia solo quello.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B1', 'B2'],
  paths: ['a.txt', 'b.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'keep me\n', B1: 'version one\n', B2: 'version two\n' }],
    [{ A: 'stable\n', B1: 'x\n', B2: 'y\n' }, { A: 'q\n', B1: 'a\n', B2: 'b\n' }],
    all(
      commitCount(2),
      blobCount(3),
      (s) => { const [c2, c1] = headHistory(s); return blobShared(c1, c2, 'a.txt')(s); },
      (s) => { const [c2, c1] = headHistory(s); return treeAt(s, c1)['b.txt'] !== treeAt(s, c2)['b.txt']; },
    ),
  ),
};
