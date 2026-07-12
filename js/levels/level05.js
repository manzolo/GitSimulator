import { mkEnvs } from './generators.js';
import {
  all, blobCount, treeCount, commitCount, headOn, headParents,
  reachableFromHead, rootTreeOf, treeOfHead,
} from './util.js';

// Level 5 — the first commit: commit → tree → blob, and HEAD points at it.
export default {
  id: 'first-commit',
  title: { en: 'The first commit', it: 'Il primo commit' },
  text: {
    en: `<p>A <strong>commit</strong> is the third object type. It points to <em>one</em> tree
(the whole snapshot) plus a list of <em>parents</em> (empty for the very first commit), and it
carries a message and author. Everything hangs off it: <code>commit → tree → blobs</code>.</p>
<p>Commit two files and follow the chain. <code>HEAD</code> and the branch <code>main</code>
now point at your commit — every object is <em>reachable</em> from there.</p>`,
    it: `<p>Un <strong>commit</strong> è il terzo tipo di oggetto. Punta a <em>un</em> tree (l'intero
snapshot) più una lista di <em>parent</em> (vuota per il primissimo commit), e porta un messaggio
e un autore. Tutto pende da lì: <code>commit → tree → blob</code>.</p>
<p>Committa due file e segui la catena. <code>HEAD</code> e il branch <code>main</code> ora
puntano al tuo commit — ogni oggetto è <em>raggiungibile</em> da lì.</p>`,
  },
  goal: {
    en: 'Make one commit of <code>app.js</code> and <code>style.css</code> on <code>main</code>.',
    it: 'Fai un commit di <code>app.js</code> e <code>style.css</code> su <code>main</code>.',
  },
  hints: [
    { en: 'The first commit has <strong>zero parents</strong>.', it: 'Il primo commit ha <strong>zero parent</strong>.' },
    { en: 'commit → tree → two blobs, all reachable from HEAD.', it: 'commit → tree → due blob, tutti raggiungibili da HEAD.' },
  ],
  allowedOps: ['write', 'stage', 'commit'],
  noLiteralContent: true,
  tokens: ['A', 'B'],
  paths: ['app.js', 'style.css'],
  start: [],
  makeCases: () => mkEnvs(
    [{ A: 'app\n', B: 'body{}\n' }],
    [{ A: 'main()\n', B: '.x{}\n' }, { A: 'z\n', B: 'w\n' }],
    all(commitCount(1), treeCount(1), blobCount(2), headOn('main'), headParents(0),
      reachableFromHead((s) => rootTreeOf(s, s.repo.head)),
      reachableFromHead((s) => treeOfHead(s)['app.js']),
      reachableFromHead((s) => treeOfHead(s)['style.css'])),
  ),
};
