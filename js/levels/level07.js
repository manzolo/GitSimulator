import { mkEnvs } from './generators.js';
import { all, commitCount, headOn, headParents } from './util.js';

// Level 7 — HEAD and refs are just mutable pointers to a hash.
export default {
  id: 'refs-head',
  title: { en: 'HEAD & refs: movable pointers', it: 'HEAD e ref: puntatori mobili' },
  text: {
    en: `<p>Objects are <strong>immutable</strong> — a blob, tree or commit can never change,
because changing it would change its hash, making it a different object. So what moves as you
work? <strong>Refs</strong>. A branch such as <code>main</code> is just a file containing one
commit hash, and <code>HEAD</code> usually points at a branch.</p>
<p>Make a commit, then change a file and commit again. Nothing rewrites the first commit —
<code>main</code> simply <em>slides</em> from the first hash to the second.</p>`,
    it: `<p>Gli oggetti sono <strong>immutabili</strong> — un blob, un tree o un commit non
possono cambiare, perché cambiarli cambierebbe il loro hash, rendendoli un altro oggetto. Cosa
si muove allora mentre lavori? I <strong>ref</strong>. Un branch come <code>main</code> è solo
un file che contiene un hash di commit, e <code>HEAD</code> di solito punta a un branch.</p>
<p>Fai un commit, poi cambia un file e committa di nuovo. Niente riscrive il primo commit —
<code>main</code> <em>scivola</em> semplicemente dal primo hash al secondo.</p>`,
  },
  goal: {
    en: 'Two commits on <code>main</code>; <code>main</code> points to the newest one.',
    it: 'Due commit su <code>main</code>; <code>main</code> punta al più recente.',
  },
  hints: [
    { en: 'Commit, then edit the same file and commit again.', it: 'Committa, poi modifica lo stesso file e committa di nuovo.' },
    { en: 'The second commit\'s parent is the first — a chain of two.', it: 'Il parent del secondo commit è il primo — una catena di due.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A1', 'A2'],
  paths: ['notes.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A1: 'draft\n', A2: 'final\n' }],
    [{ A1: 'v1\n', A2: 'v2\n' }, { A1: 'one\n', A2: 'two\n' }],
    all(commitCount(2), headOn('main'),
      (s) => s.repo.branches.main === s.repo.head, headParents(1)),
  ),
};
