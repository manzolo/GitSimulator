import { mkEnvs } from './generators.js';
import { all, commitCount, headParents, reachableFromHead } from './util.js';

// Level 9 — what a merge commit really is: a commit with two parents.
export default {
  id: 'merge',
  title: { en: 'A merge has two parents', it: 'Un merge ha due parent' },
  text: {
    en: `<p>A merge is not magic at the object level. It is an ordinary commit with <strong>two
parents</strong> instead of one — a snapshot that joins two lines of history. The parent list
is the <em>only</em> thing special about it.</p>
<p>Commit on <code>main</code>, branch off to <code>feature</code> and commit there, then
switch back to <code>main</code> and <strong>merge</strong> <code>feature</code>. The merge
commit points back at both tips.</p>`,
    it: `<p>Un merge non è magia a livello di oggetti. È un commit ordinario con <strong>due
parent</strong> invece di uno — uno snapshot che unisce due linee di storia. La lista dei
parent è l'<em>unica</em> cosa speciale.</p>
<p>Committa su <code>main</code>, crea il branch <code>feature</code> e committa lì, poi torna
su <code>main</code> e fai il <strong>merge</strong> di <code>feature</code>. Il commit di
merge punta a entrambe le punte.</p>`,
  },
  goal: {
    en: 'Produce a merge commit at HEAD with exactly <strong>two parents</strong>.',
    it: 'Produci un commit di merge su HEAD con esattamente <strong>due parent</strong>.',
  },
  hints: [
    { en: 'Commit on main → branch feature → checkout feature → commit → checkout main → merge feature.',
      it: 'Commit su main → branch feature → checkout feature → commit → checkout main → merge feature.' },
    { en: 'You need a commit on feature that main does not have, or there is nothing to merge.',
      it: 'Ti serve un commit su feature che main non ha, altrimenti non c\'è nulla da unire.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit', 'branch', 'checkout', 'merge'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['base.txt', 'feature.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'base line\n', B: 'feature line\n' }],
    [{ A: 'x\n', B: 'y\n' }, { A: 'root\n', B: 'branch\n' }],
    all(commitCount(3), headParents(2),
      reachableFromHead((s) => s.repo.branches.feature)),
  ),
};
