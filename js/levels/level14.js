import { mkEnvs } from './generators.js';
import {
  all, commitCount, branchCount, headOn, headParents, reachableFromHead,
} from './util.js';

// Level 14 — capstone: rebuild by hand the object state of a small history with
// a branch and a merge.
export default {
  id: 'capstone',
  title: { en: 'Capstone: branch & merge', it: 'Capstone: branch e merge' },
  text: {
    en: `<p>Put it all together. Build this exact history from scratch, watching every object
appear and every ref move:</p>
<ol>
<li>Commit <code>base.txt</code> on <code>main</code> (this is <code>C1</code>).</li>
<li>Branch <code>feature</code>, switch to it, and commit <code>feature.txt</code> (<code>C2</code>).</li>
<li>Switch back to <code>main</code> and commit a change to <code>base.txt</code> (<code>C3</code>) — now the branches have diverged.</li>
<li>Merge <code>feature</code> into <code>main</code> (<code>C4</code>, two parents).</li>
</ol>
<p>Four commits, two branches, one merge — reachable, immutable, content-addressed.</p>`,
    it: `<p>Metti tutto insieme. Costruisci da zero questa storia esatta, guardando ogni oggetto
apparire e ogni ref muoversi:</p>
<ol>
<li>Committa <code>base.txt</code> su <code>main</code> (è <code>C1</code>).</li>
<li>Crea il branch <code>feature</code>, passaci sopra e committa <code>feature.txt</code> (<code>C2</code>).</li>
<li>Torna su <code>main</code> e committa una modifica a <code>base.txt</code> (<code>C3</code>) — ora i branch sono divergenti.</li>
<li>Fai il merge di <code>feature</code> in <code>main</code> (<code>C4</code>, due parent).</li>
</ol>
<p>Quattro commit, due branch, un merge — raggiungibili, immutabili, indirizzati dal contenuto.</p>`,
  },
  goal: {
    en: 'Four commits, branches <code>main</code> & <code>feature</code>, a merge commit at HEAD with two parents.',
    it: 'Quattro commit, branch <code>main</code> e <code>feature</code>, un commit di merge su HEAD con due parent.',
  },
  hints: [
    { en: 'Diverge first: commit on feature AND on main before merging.',
      it: 'Prima diverge: committa su feature E su main prima del merge.' },
    { en: 'End on main; merging feature there gives the two-parent commit.',
      it: 'Finisci su main; il merge di feature lì dà il commit a due parent.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit', 'branch', 'checkout', 'merge'],
  noLiteralContent: true,
  tokens: ['A1', 'A2', 'B'],
  paths: ['base.txt', 'feature.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A1: 'base v1\n', A2: 'base v2\n', B: 'the feature\n' }],
    [{ A1: 'x\n', A2: 'xx\n', B: 'f\n' }, { A1: 'one\n', A2: 'two\n', B: 'feat\n' }],
    all(
      commitCount(4), headParents(2), branchCount(2), headOn('main'),
      reachableFromHead((s) => s.repo.branches.feature),
      reachableFromHead((s) => s.repo.branches.main),
    ),
  ),
};
