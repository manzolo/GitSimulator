export default {
  // chrome
  tagline: 'Apri il cofano dell\'object store di Git — guarda nascere blob, tree e commit.',
  navLevels: 'Livelli',
  navSandbox: 'Sandbox',
  help: 'Aiuto',
  run: 'Avvia',
  pause: 'Pausa',
  step: 'Passo',
  reset: 'Reset',
  speed: 'Velocità',

  // panels
  panelWorktree: 'Working tree',
  panelActions: 'Azioni',
  panelLog: 'Log azioni',
  panelStore: 'Object store',
  panelRefs: 'Ref e HEAD',
  panelInspector: 'Ispettore',
  panelEvents: 'Log eventi',
  panelCases: 'Set di contenuti',

  // status line
  statusRunning: 'In esecuzione…',
  statusReady: 'Pronto.',
  statusPaused: 'In pausa.',
  statusDone: 'Fatto — {0} oggetti/archi animati.',
  statusBuildFailed: 'Questa azione non è eseguibile qui.',

  // verification
  passMsg: 'L\'object store corrisponde all\'obiettivo su ogni set di contenuti. Ottimo!',
  failVisible: 'Non ancora: l\'object store è sbagliato su uno dei set di contenuti mostrati.',
  failHidden: 'Funziona sui contenuti mostrati ma fallisce su uno nascosto — la struttura del grafo deve valere per QUALSIASI byte, non solo questi.',
  failStatus: 'L\'object store non corrisponde ancora all\'obiettivo.',

  // level chrome
  levelBadge: 'Livello {0}',
  goalLabel: 'Obiettivo',
  allowedLabel: 'azioni',
  hintBtn: 'Mostra suggerimento ({0}/{1})',
  hintsDone: 'Nessun altro suggerimento',
  nextLevel: 'Livello successivo →',
  completedBadge: 'completato',

  // sandbox
  sandboxTitle: 'Sandbox',
  sandboxText: 'Gioco libero: crea file con qualsiasi contenuto, poi stage, commit, branch, checkout e merge. Guarda ogni oggetto apparire nello store. Digita byte reali e verifica l\'hash del blob con <code>git hash-object</code> nel tuo terminale — sarà identico.',

  // level select
  selectTitle: 'Scegli un livello',

  // working tree
  wtEmpty: 'Nessun file. Creane uno qui sotto.',
  wtNew: '+ file',
  wtNewFile: 'Nuovo file',
  wtStaged: 'in stage',
  wtModified: 'modificato',
  wtUntracked: 'non tracciato',
  wtDelete: 'elimina',
  wtStage: 'stage',
  wtPickContent: 'contenuto',
  wtPathPlaceholder: 'percorso (es. a.txt)',

  // actions bar
  actStage: 'Stage tutto',
  actCommit: 'Commit',
  actBranch: 'Branch',
  actDeleteBranch: 'Elimina branch',
  actCheckout: 'Checkout',
  actMerge: 'Merge',
  actGc: 'gc',
  promptBranch: 'Nome del nuovo branch:',
  promptDeleteBranch: 'Quale branch eliminare?',
  promptCheckout: 'Checkout di quale branch o commit?',
  promptMerge: 'Merge di quale branch?',

  // action log
  logEmpty: 'Le tue azioni sono registrate qui come un programma ri-eseguibile.',
  logReset: 'Reset',

  // object store
  storeEmpty: 'L\'object store è vuoto. Fai stage di un file per creare il primo blob.',
  objReused: 'riutilizzato',
  legendBlob: 'blob',
  legendTree: 'tree',
  legendCommit: 'commit',

  // refs
  refsHeadOn: 'HEAD → {0}',
  refsDetached: 'HEAD staccato @ {0}',
  refsUnborn: 'HEAD → main (non nato)',
  refsNone: 'Ancora nessun ref.',

  // inspector
  inspEmpty: 'Seleziona un oggetto nello store per ispezionarlo.',
  inspType: 'tipo',
  inspHash: 'hash',
  inspSize: 'dimensione',
  inspPreimage: 'preimmagine git',
  inspContent: 'contenuto',
  inspEntries: 'voci',
  inspTree: 'tree',
  inspParents: 'parent',
  inspMessage: 'messaggio',
  inspNone: '(nessuno)',
  typeBlob: 'blob',
  typeTree: 'tree',
  typeCommit: 'commit',

  // content sets (cases)
  casesHint: 'La verifica ri-esegue le tue azioni su ogni set qui sotto, inclusi quelli nascosti.',
  casesVisible: 'mostrato',
  casesHidden: 'nascosto',

  // event log
  evtEmpty: 'Il log eventi si riempie mentre gli oggetti nascono e si collegano.',
  'evt_action-begin': '▸ {0}',
  'evt_content-hashed': 'hash {0}',
  'evt_object-created': 'crea {0} {1}',
  'evt_object-reused': 'RIUSA {0} {1}',
  'evt_edge-added': 'arco {0}',
  'evt_index-updated': 'index {0}',
  'evt_worktree-changed': 'work {0}',
  'evt_ref-moved': 'ref {0} → {1}',
  'evt_ref-deleted': 'ref ✕ {0}',
  'evt_head-moved': 'HEAD → {0}',
  'evt_merge-base': 'merge-base {0}',
  'evt_object-unreachable': 'dangling {0}',
  'evt_object-collected': 'raccolto {0}',

  // errors (actions / build)
  errUnknownFile: 'file inesistente: {0}',
  errNoCommit: 'non c\'è ancora nessun commit',
  errBranchExists: 'il branch esiste già: {0}',
  errUnknownRef: 'branch o commit inesistente: {0}',
  errDeleteCurrent: 'non puoi eliminare il branch su cui sei: {0}',
  errUnknownToken: 'token di contenuto sconosciuto: {0}',
  errLiteralContent: 'questo livello richiede contenuti scelti dai token, non byte digitati',
  errUnknownOp: 'azione sconosciuta: {0}',
  errOpNotAllowed: 'azione non consentita in questo livello: {0}',

  // help
  helpTitle: 'Come funziona EDU-GIT',
  helpHtml: `<p>Git è un <strong>file system indirizzato dal contenuto</strong>. Sotto <code>.git/objects</code> tiene tre tipi di oggetto immutabile, ognuno nominato dallo <strong>SHA-1 del suo contenuto</strong>:</p>
  <table>
  <tr><th>oggetto</th><th>contiene</th></tr>
  <tr><td><strong>blob</strong></td><td>i byte di un file (senza nome)</td></tr>
  <tr><td><strong>tree</strong></td><td>una cartella: nomi → blob e sottoalberi</td></tr>
  <tr><td><strong>commit</strong></td><td>un tree + parent + messaggio</td></tr>
  </table>
  <h3>Cosa fai</h3>
  <p>Modifica il <strong>working tree</strong> ed esegui <strong>azioni</strong> di alto livello (stage, commit, branch, checkout, merge). Ogni azione è registrata nel <strong>log azioni</strong> — il tuo programma ri-eseguibile — e si anima nell'<strong>object store</strong> a destra.</p>
  <h3>Gli hash sono veri</h3>
  <p>Gli oggetti sono hashati esattamente come fa Git (<code>&lt;tipo&gt; &lt;len&gt;\\0&lt;payload&gt;</code>), quindi l'hash breve di un blob coincide con <code>git hash-object</code> nel tuo terminale.</p>
  <h3>Verifica</h3>
  <p>L'obiettivo di un livello riguarda il <em>grafo degli oggetti</em>, non i comandi. Ri-esegue le tue azioni su vari set di contenuti — mostrati e nascosti. Una soluzione che funziona solo per i byte mostrati fallisce su quelli nascosti.</p>
  <h3>Controlli</h3>
  <table><tr><th>tasto</th><th>azione</th></tr>
  <tr><td>Ctrl/⌘ + Invio</td><td>avvia / pausa</td></tr>
  <tr><td>F8</td><td>un passo</td></tr></table>
  <p>Fa parte della collana EDU, insieme a <a href="https://github.com/manzolo/SimulatoreAssembler">EDU-16 ASM</a>, <a href="https://github.com/manzolo/SimulatoreRete">EDU-NET</a> e <a href="https://github.com/manzolo/SimulatoreRegEx">EDU-REGEX</a>.</p>`,
};
