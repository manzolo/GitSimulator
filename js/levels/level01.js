import { mkEnvs } from './generators.js';
import { all, blobCount, treeCount, commitCount, hasFile, reachableFromHead, treeOfHead } from './util.js';

// Level 1 — one file → one blob. The hash IS the content.
export default {
  id: 'one-blob',
  title: { en: 'One file, one blob', it: 'Un file, un blob' },
  text: {
    en: `<p>Git is a <strong>content-addressed file system</strong>. When you stage a file,
Git doesn't store its <em>name</em> — it stores its <em>bytes</em> as a <strong>blob</strong>
object, named by the <strong>SHA-1 of the content</strong>. The name of the object <em>is</em>
the hash of what's inside it.</p>
<p>Create a file, stage it, and commit. Watch a blob crystallize in the object store — its
short hash is the real one <code>git hash-object</code> would give you.</p>`,
    it: `<p>Git è un <strong>file system indirizzato dal contenuto</strong>. Quando fai lo staging
di un file, Git non salva il suo <em>nome</em> — salva i suoi <em>byte</em> come oggetto
<strong>blob</strong>, il cui nome è lo <strong>SHA-1 del contenuto</strong>. Il nome
dell'oggetto <em>è</em> l'hash di ciò che contiene.</p>
<p>Crea un file, fai staging e commit. Guarda un blob cristallizzarsi nell'object store — il
suo hash breve è quello vero che ti darebbe <code>git hash-object</code>.</p>`,
  },
  goal: {
    en: 'Create <code>README</code> with content <code>A</code>, stage it, and commit.',
    it: 'Crea <code>README</code> con contenuto <code>A</code>, fai staging e commit.',
  },
  hints: [
    { en: 'A blob is born only when you <strong>stage</strong>, not when you write the file.',
      it: 'Un blob nasce solo quando fai <strong>staging</strong>, non quando scrivi il file.' },
    { en: 'Write → Stage → Commit. Three objects appear: a blob, a tree, a commit.',
      it: 'Scrivi → Stage → Commit. Appaiono tre oggetti: un blob, un tree, un commit.' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A'],
  paths: ['README'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'hello git\n' }],
    [{ A: 'a completely different line\n' }, { A: '\n' }, { A: 'x' }],
    all(blobCount(1), treeCount(1), commitCount(1), hasFile('README'),
      reachableFromHead((s) => treeOfHead(s).README)),
  ),
};
