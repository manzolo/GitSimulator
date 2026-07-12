import { mkEnvs } from './generators.js';
import {
  all, commitCount, blobShared, headHistory, treeAt, rootTreeOf,
} from './util.js';

// Level 12 — integrity: one changed byte cascades up the Merkle tree.
export default {
  id: 'merkle',
  title: { en: 'Merkle: the hash cascade', it: 'Merkle: la cascata di hash' },
  text: {
    en: `<p>Because every object names its children by hash, changing one byte deep inside a
file changes <em>everything above it</em>. Edit <code>src/app.js</code> and its blob hash
changes → the <code>src</code> tree that points to it changes → the root tree changes → the
commit changes. This is a <strong>Merkle tree</strong>, and it is what makes Git tamper-evident.</p>
<p>Commit an unchanged <code>README</code> alongside <code>src/app.js</code>. Then edit only
<code>src/app.js</code> and commit. <code>README</code>'s blob is shared; the changed path is
brand-new all the way up.</p>`,
    it: `<p>Poiché ogni oggetto nomina i suoi figli per hash, cambiare un byte in profondità in un
file cambia <em>tutto ciò che sta sopra</em>. Modifica <code>src/app.js</code> e il suo hash di
blob cambia → il tree <code>src</code> che lo punta cambia → il tree radice cambia → il commit
cambia. Questo è un <strong>Merkle tree</strong>, ed è ciò che rende Git a prova di manomissione.</p>
<p>Committa un <code>README</code> invariato insieme a <code>src/app.js</code>. Poi modifica solo
<code>src/app.js</code> e committa. Il blob di <code>README</code> è condiviso; il percorso
modificato è nuovo di zecca fino in cima.</p>`,
  },
  goal: {
    en: 'Two commits; editing <code>src/app.js</code> changes its blob, the <code>src</code> tree, and the root tree — while <code>README</code> stays shared.',
    it: 'Due commit; modificare <code>src/app.js</code> cambia il suo blob, il tree <code>src</code> e il tree radice — mentre <code>README</code> resta condiviso.',
  },
  hints: [
    { en: 'Commit README + src/app.js first, then edit only src/app.js.',
      it: 'Prima committa README + src/app.js, poi modifica solo src/app.js.' },
    { en: 'README must be untouched so its blob is reused across both commits.',
      it: 'README non va toccato, così il suo blob è riutilizzato tra i due commit.' },
  ],
  allowedOps: ['write', 'edit', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['R', 'A1', 'A2'],
  paths: ['README', 'src/app.js'],
  start: [],
  makeCases: () => mkEnvs(
    [{ R: '# docs\n', A1: 'let x = 1\n', A2: 'let x = 2\n' }],
    [{ R: 'readme\n', A1: 'v1\n', A2: 'v2\n' }, { R: 'k\n', A1: 'a\n', A2: 'b\n' }],
    all(
      commitCount(2),
      (s) => { const [c2, c1] = headHistory(s); return blobShared(c1, c2, 'README')(s); },
      (s) => { const [c2, c1] = headHistory(s); return treeAt(s, c1)['src/app.js'] !== treeAt(s, c2)['src/app.js']; },
      (s) => { const [c2, c1] = headHistory(s); return rootTreeOf(s, c1) !== rootTreeOf(s, c2); },
    ),
  ),
};
