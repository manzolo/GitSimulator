import { mkEnvs } from './generators.js';
import { all, blobCount, commitCount, headHistory, treeAt } from './util.js';

// Level 13 — why the repo doesn't explode. Even before packfiles compress the
// bytes, Git already shares every object that didn't change. A commit touching
// one file in a big tree adds exactly one blob (+ the trees along its path).
export default {
  id: 'packfile-delta',
  title: { en: 'Why the repo doesn\'t explode', it: 'Perché il repo non esplode' },
  text: {
    en: `<p>If every commit is a full snapshot, shouldn't a thousand commits cost a thousand
copies of everything? No — because <strong>unchanged objects are shared</strong>. Editing one
file in a large project adds a single new blob and re-hashes only the trees on the path from
that file to the root; every other object is reused untouched.</p>
<p>(On disk Git then <strong>packs</strong> the loose objects and delta-compresses similar
blobs — a storage optimisation on top of the sharing you already see here.)</p>
<p>Commit a project of four files. Then edit only <code>docs/b.md</code> and commit. The store
grows by exactly one blob — five in total.</p>`,
    it: `<p>Se ogni commit è uno snapshot completo, mille commit non dovrebbero costare mille copie
di tutto? No — perché gli <strong>oggetti invariati sono condivisi</strong>. Modificare un file
in un grande progetto aggiunge un solo blob nuovo e ricalcola solo i tree sul percorso da quel
file fino alla radice; ogni altro oggetto è riutilizzato intatto.</p>
<p>(Su disco Git poi <strong>impacchetta</strong> gli oggetti sciolti e delta-comprime i blob
simili — un'ottimizzazione di storage sopra alla condivisione che già vedi qui.)</p>
<p>Committa un progetto di quattro file. Poi modifica solo <code>docs/b.md</code> e committa. Lo
store cresce di esattamente un blob — cinque in totale.</p>`,
  },
  goal: {
    en: 'After editing one of four files and committing, exactly one new blob appears (5 total); the other three are reused.',
    it: 'Dopo aver modificato uno di quattro file e committato, appare esattamente un blob nuovo (5 in totale); gli altri tre sono riutilizzati.',
  },
  hints: [
    { en: 'Commit README + docs/a.md + docs/b.md + docs/c.md first.',
      it: 'Prima committa README + docs/a.md + docs/b.md + docs/c.md.' },
    { en: 'Then edit only <code>docs/b.md</code> — nothing else.', it: 'Poi modifica solo <code>docs/b.md</code> — nient\'altro.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['R', 'DA', 'DB1', 'DB2', 'DC'],
  paths: ['README', 'docs/a.md', 'docs/b.md', 'docs/c.md'],
  start: [],
  makeCases: () => mkEnvs(
    [{ R: '# proj\n', DA: 'aaa\n', DB1: 'bbb\n', DB2: 'BBB\n', DC: 'ccc\n' }],
    [{ R: 'r\n', DA: '1\n', DB1: '2\n', DB2: '22\n', DC: '3\n' },
      { R: 'x\n', DA: 'p\n', DB1: 'q\n', DB2: 'qq\n', DC: 's\n' }],
    all(
      commitCount(2),
      blobCount(5),
      (s) => {
        const [c2, c1] = headHistory(s);
        const t1 = treeAt(s, c1); const t2 = treeAt(s, c2);
        return t1.README === t2.README
          && t1['docs/a.md'] === t2['docs/a.md']
          && t1['docs/c.md'] === t2['docs/c.md']
          && t1['docs/b.md'] !== t2['docs/b.md'];
      },
    ),
  ),
};
