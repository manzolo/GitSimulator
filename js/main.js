// EDU-GIT orchestrator: wires the DOM-free git engine to the UI through the
// Player's delta stream. The user's "program" is a recorded ACTION LOG; adding
// an action rebuilds the sim and animates only that action's deltas onto the
// object store, while Run/Step replay the whole log. Verification replays the
// log headlessly on every content set (visible AND hidden) — the anti-cheat.

import { buildRun, runHeadless } from './core/engine.js';
import { Player } from './player.js';
import { initLang, setLang, getLang, t, onLangChange, refreshStatic } from './i18n.js';
import * as storage from './storage.js';
import { levels, levelById } from './levels/index.js';
import { createWorktree } from './ui/worktree.js';
import { createActionsBar } from './ui/actionsBar.js';
import { createActionLog } from './ui/actionLog.js';
import { createObjectStore } from './ui/objectStore.js';
import { createRefsPanel } from './ui/refsPanel.js';
import { createInspector } from './ui/inspector.js';
import { createEventLog } from './ui/eventlog.js';
import { createLevelPanel } from './ui/levelPanel.js';
import { createLevelSelect } from './ui/levelSelect.js';
import { createCasesPanel } from './ui/casesPanel.js';

initLang();

// ---------- components ----------
const worktree = createWorktree(document.getElementById('worktree'), {
  onWrite: (path, content) => addAction({ op: 'write', path, content }),
  onEditContent: (path, content) => addAction({ op: 'edit', path, content }),
  onStage: (paths) => addAction({ op: 'stage', paths }),
  onDelete: (path) => addAction({ op: 'delete', path }),
});
const actionsBar = createActionsBar(document.getElementById('actionsBar'), { onAction: doAction });
const actionLog = createActionLog(document.getElementById('actionLog'), { onReset: resetLog });
const objectStore = createObjectStore(document.getElementById('objectStore'), { onSelect: inspect });
const refsPanel = createRefsPanel(document.getElementById('refsPanel'));
const inspector = createInspector(document.getElementById('inspector'));
const eventlog = createEventLog(document.getElementById('eventLog'));
const casesPanel = createCasesPanel(document.getElementById('casesPanel'));
const levelPanel = createLevelPanel(document.getElementById('lessonPanel'), { onNext: gotoNextLevel });
const levelSelect = createLevelSelect(document.getElementById('levelSelectOverlay'), { onSelect: select });

const statusEl = document.getElementById('statusLine');
const btnRun = document.getElementById('btnRun');
const btnPause = document.getElementById('btnPause');
const btnStep = document.getElementById('btnStep');
const btnReset = document.getElementById('btnReset');
const casesCard = document.getElementById('casesCard');

// ---------- state ----------
let currentId = null;
let level = null;
let actions = [];
let displayEnv = { content: {} };
let currentSim = null;
let currentSnapshot = null;
let machineStale = true;

const player = new Player({
  onEvents: handleEvents,
  onHalt: handleHalt,
  onError: () => {},
  onRunState: (running) => {
    btnRun.hidden = running;
    btnPause.hidden = !running;
    btnStep.disabled = running;
    if (running) setStatus(t('statusRunning'), 'run');
  },
});

function setStatus(msg, kind = '') { statusEl.textContent = msg; statusEl.dataset.kind = kind; }
function isSandbox() { return currentId === 'sandbox'; }
function levelOpts() {
  return { allowedOps: level?.allowedOps, allowLiteral: !level?.noLiteralContent };
}
function wtOpts() {
  const tokens = level
    ? level.tokens.map((name) => ({ token: name, bytes: displayEnv.content[name] ?? '' }))
    : null;
  return { tokens, paths: level?.paths ?? [] };
}
function build(list) { return buildRun({ actions: list, env: displayEnv, ...levelOpts() }); }

// ---------- render current state instantly (no animation) ----------
function showState(snap) {
  currentSnapshot = snap;
  objectStore.renderSnapshot(snap);
  refsPanel.render(snap);
  worktree.render(snap, wtOpts());
}

// ---------- adding an action ----------
function addAction(action) {
  const candidate = [...actions, action];
  const full = build(candidate);
  if (full.errors) { showBuildError(full.errors[0]); return; }

  const pre = build(actions);           // state before this action
  actions = candidate;
  storage.saveActions(currentId, actions);
  actionLog.render(actions);

  const preTick = pre.trace.length;
  const finalSnap = full.repo.snapshot();
  currentSnapshot = finalSnap;

  // working tree reflects the action immediately; the store animates the new objects
  worktree.render(finalSnap, wtOpts());
  objectStore.renderSnapshot(pre.repo.snapshot());
  refsPanel.render(pre.repo.snapshot());
  eventlog.setAll(pre.trace);

  currentSim = full.sim;
  player.load(currentSim);
  player.simNow = preTick;
  currentSim.advanceTo(preTick);        // consume pre-deltas (already shown), don't animate
  machineStale = false;
  player.play();
}

function showBuildError(err) {
  setStatus(t(err.code, ...(err.args ?? [])) || t('statusBuildFailed'), 'err');
}

// ---------- high-level action buttons ----------
function doAction(op) {
  if (op === 'stage') {
    const paths = Object.keys(currentSnapshot?.work ?? {})
      .filter((p) => currentSnapshot.index[p] !== currentSnapshot.work[p]);
    if (!paths.length) { setStatus(t('statusReady')); return; }
    addAction({ op: 'stage', paths });
  } else if (op === 'commit') {
    addAction({ op: 'commit', message: 'commit' });
  } else if (op === 'gc') {
    addAction({ op: 'gc' });
  } else if (op === 'branch') {
    const name = prompt(t('promptBranch'));
    if (name) addAction({ op: 'branch', name: name.trim() });
  } else if (op === 'delete-branch') {
    const name = prompt(t('promptDeleteBranch'));
    if (name) addAction({ op: 'delete-branch', name: name.trim() });
  } else if (op === 'checkout') {
    const target = prompt(t('promptCheckout'));
    if (target) addAction({ op: 'checkout', target: target.trim() });
  } else if (op === 'merge') {
    const name = prompt(t('promptMerge'));
    if (name) addAction({ op: 'merge', name: name.trim() });
  }
}

// ---------- event stream → UI ----------
function handleEvents(events) {
  if (player.turbo) return;
  for (const evt of events) {
    objectStore.applyEvent(evt);
    eventlog.append(evt);
  }
}

function handleHalt(sim) {
  const fs = sim.finalState();
  if (player.turbo) eventlog.setAll(fs.trace);
  showState(fs.repo);
  setStatus(t('statusDone', fs.steps), 'ok');
  if (level) verifySolution();
}

// ---------- verification (headless, every content set) ----------
function verifySolution() {
  const envs = level.makeCases();
  const verdicts = new Map();
  let visibleIdx = 0;
  let anyVisibleFail = false;
  let anyHiddenFail = false;
  let buildErr = null;

  for (const env of envs) {
    const { state, errors } = runHeadless({ actions, env, ...levelOpts() });
    if (errors) { buildErr = errors[0]; break; }
    const pass = env.check(state);
    if (env.visible) { verdicts.set(visibleIdx, pass); visibleIdx += 1; }
    if (!pass) { if (env.visible) anyVisibleFail = true; else anyHiddenFail = true; }
  }

  casesPanel.setVerdicts(verdicts);

  if (buildErr) {
    levelPanel.setResult({ pass: false, msg: t(buildErr.code, ...(buildErr.args ?? [])) });
    return;
  }
  if (!anyVisibleFail && !anyHiddenFail) {
    storage.markCompleted(level.id);
    levelPanel.setResult({ pass: true, msg: t('passMsg') });
    setStatus(t('passMsg'), 'ok');
    return;
  }
  levelPanel.setResult({ pass: false, msg: anyVisibleFail ? t('failVisible') : t('failHidden') });
  setStatus(t('failStatus'), 'err');
}

function inspect(sha) { inspector.renderObject(sha, currentSnapshot); }

// ---------- full replay machine (Run / Step) ----------
function ensureMachine() {
  if (!machineStale && currentSim && !currentSim.halted && !currentSim.error) return true;
  const built = build(actions);
  if (built.errors) { showBuildError(built.errors[0]); return false; }
  currentSim = built.sim;
  player.load(currentSim);
  objectStore.reset();
  eventlog.clear();
  refsPanel.render(built.repo.snapshot()); // refs reset to empty baseline
  machineStale = false;
  return true;
}

// ---------- navigation ----------
function resetLog() {
  player.pause();
  levelPanel.setResult(null);
  actions = level ? [...(level.start ?? [])] : [];
  storage.saveActions(currentId, actions);
  actionLog.render(actions);
  machineStale = true;
  const built = build(actions);
  showState(built.repo.snapshot());
  inspector.clear();
  casesPanel.setVerdicts(new Map());
  setStatus(t('statusReady'));
}

function select(id) {
  player.pause();
  const lv = id === 'sandbox' ? null : levelById(id);
  if (id !== 'sandbox' && !lv) { select(levels[0].id); return; }
  currentId = id;
  level = lv;
  storage.setLastMode(id);
  if (window.location.hash !== `#${id}`) window.location.hash = id;

  casesCard.hidden = !level;
  displayEnv = level ? { content: level.makeCases()[0].content } : { content: {} };
  actions = storage.getActions(id) ?? (level ? [...(level.start ?? [])] : []);

  if (level) {
    const idx = levels.indexOf(level);
    levelPanel.showLevel(level, idx, levels.length, storage.getProgress().has(id));
    casesPanel.showCases(level.makeCases().filter((c) => c.visible));
  } else {
    levelPanel.showSandbox();
    casesPanel.clear();
  }
  actionsBar.render(level?.allowedOps);
  actionLog.render(actions);
  inspector.clear();
  machineStale = true;

  const built = build(actions);
  if (built.errors) { showBuildError(built.errors[0]); objectStore.reset(); }
  else { showState(built.repo.snapshot()); setStatus(t('statusReady')); if (level) verifySolution(); }
}

function gotoNextLevel() {
  const idx = levels.indexOf(level);
  if (idx >= 0 && idx < levels.length - 1) select(levels[idx + 1].id);
}

// ---------- toolbar & shortcuts ----------
btnRun.addEventListener('click', () => { if (ensureMachine()) { eventlog.clear(); player.play(); } });
btnPause.addEventListener('click', () => { player.pause(); setStatus(t('statusPaused')); });
btnStep.addEventListener('click', () => { if (ensureMachine()) player.stepOnce(); });
btnReset.addEventListener('click', resetLog);
document.getElementById('speed').addEventListener('input', (e) => player.setSpeed(+e.target.value));
player.setSpeed(+document.getElementById('speed').value);

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (player.running) btnPause.click(); else btnRun.click();
  } else if (e.key === 'F8') { e.preventDefault(); btnStep.click(); }
});

// ---------- header: nav, language, help ----------
document.getElementById('btnLevels').addEventListener('click',
  () => levelSelect.open(levels, storage.getProgress(), currentId));
document.getElementById('btnSandbox').addEventListener('click', () => select('sandbox'));

const helpOverlay = document.getElementById('helpOverlay');
function renderHelp() {
  document.getElementById('helpTitle').textContent = t('helpTitle');
  document.getElementById('helpBody').innerHTML = t('helpHtml');
}
document.getElementById('btnHelp').addEventListener('click', () => { renderHelp(); helpOverlay.hidden = false; });
document.getElementById('helpClose').addEventListener('click', () => { helpOverlay.hidden = true; });
helpOverlay.addEventListener('click', (e) => { if (e.target === helpOverlay) helpOverlay.hidden = true; });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { helpOverlay.hidden = true; document.getElementById('levelSelectOverlay').hidden = true; }
});

const langButtons = document.querySelectorAll('.lang-switch button');
function markLang() { langButtons.forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang())); }
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

onLangChange(() => {
  markLang();
  levelPanel.refresh();
  inspector.refresh();
  casesPanel.refresh();
  actionsBar.render(level?.allowedOps);
  if (currentSnapshot) { worktree.render(currentSnapshot, wtOpts()); refsPanel.render(currentSnapshot); }
  actionLog.render(actions);
  if (!helpOverlay.hidden) renderHelp();
  setStatus(t('statusReady'));
});

// ---------- boot ----------
refreshStatic();
markLang();

const fromHash = window.location.hash.slice(1);
const startId = (fromHash === 'sandbox' || levelById(fromHash)) ? fromHash
  : storage.getLastMode() || levels[0].id;
select(startId);

window.addEventListener('hashchange', () => {
  const id = window.location.hash.slice(1);
  if (id !== currentId && (id === 'sandbox' || levelById(id))) select(id);
});
