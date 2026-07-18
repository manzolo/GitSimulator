export default {
  // chrome
  tagline: 'Open the hood on Git\'s object store — watch blobs, trees and commits get born.',
  navIntro: 'Basics',
  navLevels: 'Levels',
  navSandbox: 'Sandbox',
  help: 'Help',
  run: 'Run',
  pause: 'Pause',
  step: 'Step',
  reset: 'Reset',
  speed: 'Speed',

  // panels
  panelWorktree: 'Working tree',
  panelActions: 'Actions',
  panelLog: 'Action log',
  panelStore: 'Object store',
  panelRefs: 'Refs & HEAD',
  panelInspector: 'Inspector',
  panelEvents: 'Event log',
  panelCases: 'Content sets',

  // status line
  statusRunning: 'Running…',
  statusReady: 'Ready.',
  statusPaused: 'Paused.',
  statusDone: 'Done — {0} objects/edges animated.',
  statusBuildFailed: 'That action can\'t run here.',

  // verification
  passMsg: 'The object store matches the goal on every content set. Well done!',
  failVisible: 'Not yet: the object store is wrong on one of the shown content sets.',
  failHidden: 'It works on the shown content but fails a hidden one — the graph structure must hold for ANY bytes, not just these.',
  failStatus: 'The object store doesn\'t match the goal yet.',

  // level chrome
  levelBadge: 'Level {0}',
  goalLabel: 'Goal',
  allowedLabel: 'actions',
  hintBtn: 'Show hint ({0}/{1})',
  hintsDone: 'No more hints',
  nextLevel: 'Next level →',
  completedBadge: 'completed',

  // sandbox
  sandboxTitle: 'Sandbox',
  sandboxText: 'Free play: create files with any content, then stage, commit, branch, checkout and merge. Watch every object appear in the store. Type real bytes and verify the blob hash with <code>git hash-object</code> in your terminal — it will match.',

  // beginner's primer
  introTitle: 'Start here — Git from zero',
  introStart: 'Start level 1 →',

  // level select
  selectTitle: 'Choose a level',

  // working tree
  wtEmpty: 'No files yet. Create one below.',
  wtNew: '+ file',
  wtNewFile: 'New file',
  wtStaged: 'staged',
  wtModified: 'modified',
  wtUntracked: 'untracked',
  wtDelete: 'delete',
  wtStage: 'stage',
  wtPickContent: 'content',
  wtPathPlaceholder: 'path (e.g. a.txt)',

  // actions bar
  actStage: 'Stage all',
  actCommit: 'Commit',
  actBranch: 'Branch',
  actDeleteBranch: 'Delete branch',
  actCheckout: 'Checkout',
  actMerge: 'Merge',
  actGc: 'gc',
  promptBranch: 'New branch name:',
  promptDeleteBranch: 'Delete which branch?',
  promptCheckout: 'Checkout which branch or commit?',
  promptMerge: 'Merge which branch?',

  // action log
  logEmpty: 'Your actions are recorded here as a replayable program.',
  logReset: 'Reset',

  // object store
  storeEmpty: 'The object store is empty. Stage a file to create the first blob.',
  objReused: 'reused',
  legendBlob: 'blob',
  legendTree: 'tree',
  legendCommit: 'commit',

  // refs
  refsHeadOn: 'HEAD → {0}',
  refsDetached: 'HEAD detached @ {0}',
  refsUnborn: 'HEAD → main (unborn)',
  refsNone: 'No refs yet.',

  // inspector
  inspEmpty: 'Select an object in the store to inspect it.',
  inspType: 'type',
  inspHash: 'hash',
  inspSize: 'size',
  inspPreimage: 'git preimage',
  inspContent: 'content',
  inspEntries: 'entries',
  inspTree: 'tree',
  inspParents: 'parents',
  inspMessage: 'message',
  inspNone: '(none)',
  typeBlob: 'blob',
  typeTree: 'tree',
  typeCommit: 'commit',

  // content sets (cases)
  casesHint: 'Verification re-runs your actions on every set below, including hidden ones.',
  casesVisible: 'shown',
  casesHidden: 'hidden',

  // event log
  evtEmpty: 'The event log fills as objects are born and linked.',
  'evt_action-begin': '▸ {0}',
  'evt_content-hashed': 'hash {0}',
  'evt_object-created': 'create {0} {1}',
  'evt_object-reused': 'REUSE {0} {1}',
  'evt_edge-added': 'link {0}',
  'evt_index-updated': 'index {0}',
  'evt_worktree-changed': 'work {0}',
  'evt_ref-moved': 'ref {0} → {1}',
  'evt_ref-deleted': 'ref ✕ {0}',
  'evt_head-moved': 'HEAD → {0}',
  'evt_merge-base': 'merge-base {0}',
  'evt_object-unreachable': 'dangling {0}',
  'evt_object-collected': 'collected {0}',

  // errors (actions / build)
  errUnknownFile: 'no such file: {0}',
  errNoCommit: 'there is no commit yet',
  errBranchExists: 'branch already exists: {0}',
  errUnknownRef: 'no such branch or commit: {0}',
  errDeleteCurrent: 'can\'t delete the branch you\'re on: {0}',
  errUnknownToken: 'unknown content token: {0}',
  errLiteralContent: 'this level needs content chosen from the tokens, not typed bytes',
  errUnknownOp: 'unknown action: {0}',
  errOpNotAllowed: 'that action isn\'t allowed in this level: {0}',

  // help
  helpTitle: 'How EDU-GIT works',
  helpHtml: `<p>Git is a <strong>content-addressed file system</strong>. Under <code>.git/objects</code> it keeps three kinds of immutable object, each named by the <strong>SHA-1 of its content</strong>:</p>
  <table>
  <tr><th>object</th><th>holds</th></tr>
  <tr><td><strong>blob</strong></td><td>the bytes of a file (no name)</td></tr>
  <tr><td><strong>tree</strong></td><td>a directory: names → blobs and subtrees</td></tr>
  <tr><td><strong>commit</strong></td><td>one tree + parents + message</td></tr>
  </table>
  <h3>What you do</h3>
  <p>Edit the <strong>working tree</strong> and run high-level <strong>actions</strong> (stage, commit, branch, checkout, merge). Every action is recorded in the <strong>action log</strong> — your replayable program — and animates in the <strong>object store</strong> on the right.</p>
  <h3>The hashes are real</h3>
  <p>Objects are hashed exactly as Git does (<code>&lt;type&gt; &lt;len&gt;\\0&lt;payload&gt;</code>), so a blob's short hash matches <code>git hash-object</code> in your own terminal.</p>
  <h3>Verification</h3>
  <p>A level's goal is about the <em>object graph</em>, not the commands. It re-runs your actions on several content sets — shown and hidden. A solution that only works for the shown bytes fails the hidden ones.</p>
  <h3>Controls</h3>
  <table><tr><th>key</th><th>action</th></tr>
  <tr><td>Ctrl/⌘ + Enter</td><td>run / pause</td></tr>
  <tr><td>F8</td><td>one step</td></tr></table>
  <p>Part of the EDU collection, alongside <a href="https://github.com/manzolo/SimulatoreAssembler">EDU-16 ASM</a>, <a href="https://github.com/manzolo/SimulatoreRete">EDU-NET</a> and <a href="https://github.com/manzolo/SimulatoreRegEx">EDU-REGEX</a>.</p>`,
};
