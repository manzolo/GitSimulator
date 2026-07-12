import { mkEnvs } from './generators.js';
import { all, blobCount, hasFile, sameBlob, commitCount } from './util.js';

// Level 2 — two equal files → ONE blob. Content-addressed deduplication: the
// signature moment. Because the object's name is the hash of its content, two
// files with identical bytes name the SAME object.
export default {
  id: 'dedup',
  title: { en: 'Two files, one blob (dedup)', it: 'Due file, un blob (dedup)' },
  text: {
    en: `<p>Here is the idea that surprises everyone. Because a blob is named by the hash of
its <em>content</em>, two files with the <strong>same bytes</strong> point to the
<strong>same blob</strong>. Git doesn't store the content twice — it can't even tell the two
apart at the object level.</p>
<p>Give <code>a.txt</code> and <code>b.txt</code> the <strong>same content</strong>. Watch
the second staging <em>reuse</em> the blob instead of creating a new one — the arc converges,
the object pulses.</p>`,
    it: `<p>Ecco l'idea che spiazza tutti. Poiché un blob prende il nome dall'hash del suo
<em>contenuto</em>, due file con gli <strong>stessi byte</strong> puntano allo
<strong>stesso blob</strong>. Git non salva il contenuto due volte — a livello di oggetto non
riesce nemmeno a distinguerli.</p>
<p>Dai ad <code>a.txt</code> e <code>b.txt</code> lo <strong>stesso contenuto</strong>. Guarda
il secondo staging <em>riutilizzare</em> il blob invece di crearne uno nuovo — l'arco converge,
l'oggetto pulsa.</p>`,
  },
  goal: {
    en: 'Commit two files, <code>a.txt</code> and <code>b.txt</code>, that share a single blob.',
    it: 'Committa due file, <code>a.txt</code> e <code>b.txt</code>, che condividono un solo blob.',
  },
  hints: [
    { en: 'Pick the <em>same</em> content for both files.', it: 'Scegli lo <em>stesso</em> contenuto per entrambi i file.' },
    { en: 'If you see two blobs, the contents differ. Content addressing only dedups identical bytes.',
      it: 'Se vedi due blob, i contenuti sono diversi. L\'indirizzamento per contenuto deduplica solo byte identici.' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['a.txt', 'b.txt'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'same content\n', B: 'same content\n' }],
    [{ A: 'left\n', B: 'right\n' }, { A: 'twin\n', B: 'twin\n' }, { A: 'q', B: 'q' }],
    all(blobCount(1), hasFile('a.txt'), hasFile('b.txt'), sameBlob('a.txt', 'b.txt'), commitCount(1)),
  ),
};
