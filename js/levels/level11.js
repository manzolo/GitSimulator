import { mkEnvs } from './generators.js';
import { all, commitCount, noUnreachable } from './util.js';

// Level 11 — unreachable objects and the garbage collector.
export default {
  id: 'unreachable-gc',
  title: { en: 'Lost objects & the collector', it: 'Oggetti persi e il collector' },
  text: {
    en: `<p>An object stays alive only while something <strong>reaches</strong> it — a ref, or
a commit reachable from a ref. Commit on a throwaway branch, delete the branch, and that
commit becomes <strong>unreachable</strong>: still on disk, but orphaned. <code>git gc</code>
eventually sweeps such objects away.</p>
<p>Commit on <code>main</code>. Branch <code>experiment</code>, switch to it, commit. Switch
back to <code>main</code>, <strong>delete</strong> <code>experiment</code> — its commit is now
dangling — then run <strong>gc</strong> to collect it.</p>`,
    it: `<p>Un oggetto resta vivo solo finché qualcosa lo <strong>raggiunge</strong> — un ref, o
un commit raggiungibile da un ref. Committa su un branch usa-e-getta, cancella il branch, e quel
commit diventa <strong>irraggiungibile</strong>: ancora su disco, ma orfano. <code>git gc</code>
prima o poi spazza via questi oggetti.</p>
<p>Committa su <code>main</code>. Crea il branch <code>experiment</code>, passaci sopra,
committa. Torna su <code>main</code>, <strong>cancella</strong> <code>experiment</code> — il suo
commit ora è dangling — poi lancia <strong>gc</strong> per raccoglierlo.</p>`,
  },
  goal: {
    en: 'Orphan a commit by deleting its branch, then <code>gc</code> so nothing is left unreachable.',
    it: 'Rendi orfano un commit cancellando il suo branch, poi fai <code>gc</code> così nulla resta irraggiungibile.',
  },
  hints: [
    { en: 'Switch back to <code>main</code> before deleting <code>experiment</code>.',
      it: 'Torna su <code>main</code> prima di cancellare <code>experiment</code>.' },
    { en: 'gc must actually collect something — orphan a commit first.',
      it: 'gc deve davvero raccogliere qualcosa — prima rendi orfano un commit.' },
  ],
  allowedOps: ['write', 'stage', 'commit', 'branch', 'checkout', 'delete-branch', 'gc'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['keep.txt', 'scratch.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'permanent\n', B: 'throwaway\n' }],
    [{ A: 'x\n', B: 'y\n' }, { A: 'stay\n', B: 'gone\n' }],
    all(
      commitCount(1),
      noUnreachable,
      (s) => s.trace.some((e) => e.type === 'object-collected'),
    ),
  ),
};
