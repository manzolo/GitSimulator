import { mkEnvs } from './generators.js';
import { all, commitCount, branchCount, branchesSameCommit } from './util.js';

// Level 8 — a branch is just a second ref on the same commit.
export default {
  id: 'branch',
  title: { en: 'A branch is a pointer', it: 'Un branch è un puntatore' },
  text: {
    en: `<p>Creating a branch is astonishingly cheap: Git writes <strong>one new ref</strong> —
41 bytes on disk — pointing at the current commit. No objects are copied. Right after
<code>git branch feature</code>, both <code>main</code> and <code>feature</code> name the
<em>same</em> commit.</p>
<p>Make a commit, then create a branch <code>feature</code>. Two refs, one commit.</p>`,
    it: `<p>Creare un branch costa pochissimo: Git scrive <strong>un nuovo ref</strong> — 41 byte
su disco — che punta al commit corrente. Nessun oggetto viene copiato. Subito dopo
<code>git branch feature</code>, sia <code>main</code> sia <code>feature</code> nominano lo
<em>stesso</em> commit.</p>
<p>Fai un commit, poi crea un branch <code>feature</code>. Due ref, un commit.</p>`,
  },
  goal: {
    en: 'One commit, then a branch <code>feature</code> — both refs on the same commit.',
    it: 'Un commit, poi un branch <code>feature</code> — entrambi i ref sullo stesso commit.',
  },
  hints: [
    { en: 'Commit first; a branch needs a commit to point at.', it: 'Prima committa; un branch ha bisogno di un commit a cui puntare.' },
    { en: 'Do not commit again after branching, or the refs will diverge.',
      it: 'Non committare di nuovo dopo il branch, o i ref divergeranno.' },
  ],
  allowedOps: ['write', 'stage', 'commit', 'branch'],
  noLiteralContent: true,
  tokens: ['A'],
  paths: ['main.py'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'print(1)\n' }],
    [{ A: 'code\n' }, { A: 'x\n' }],
    all(commitCount(1), branchCount(2), branchesSameCommit('main', 'feature')),
  ),
};
