#!/usr/bin/env node
// End-to-end test: drives the real UI in headless Chrome over the DevTools
// Protocol, using only Node built-ins (node:http static server + the global
// WebSocket of Node ≥ 22). Zero npm dependencies.
//
// Scenario: boot the app, set turbo, solve level 1 (one-blob) and level 2
// (dedup) by driving the working-tree editor and action buttons, assert the
// pass banner + localStorage progress, check the object store renders cards and
// that dedup yields a SINGLE blob, switch language, open the sandbox, and
// require zero console errors.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEADLINE_MS = 90000;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/plain' };

let passed = 0;
function ok(name) { passed += 1; console.log(`ok — ${name}`); }
function fail(msg) { console.error(`FAIL — ${msg}`); process.exitCode = 1; throw new Error(msg); }

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      const file = join(ROOT, path === '/' ? 'index.html' : path.slice(1));
      if (!file.startsWith(ROOT)) throw new Error('traversal');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function findChrome() {
  const candidates = [process.env.CHROME_BIN, 'google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser', 'chrome', '/snap/bin/chromium', '/usr/bin/chromium'].filter(Boolean);
  for (const bin of candidates) {
    try { if (spawnSync(bin, ['--version'], { stdio: 'pipe' }).status === 0) return bin; } catch { /* next */ }
  }
  console.error('No Chrome/Chromium found. Set CHROME_BIN=/path/to/chrome and retry.');
  process.exit(1);
  return null;
}

function launchChrome(bin, profileDir) {
  const chrome = spawn(bin, ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions', `--user-data-dir=${profileDir}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = (d) => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { chrome.stderr.off('data', onData); resolve({ chrome, wsBase: m[1] }); }
    };
    chrome.stderr.on('data', onData);
    chrome.on('exit', (code) => reject(new Error(`chrome exited early (${code})\n${buf}`)));
    setTimeout(() => reject(new Error(`no DevTools banner:\n${buf}`)), 15000);
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.consoleErrors = [];
    ws.addEventListener('message', (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) { this.pending.delete(msg.id); if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result); }
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.consoleErrors.push(`exception: ${d.text} ${d.exception?.description ?? ''}`);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`eval failed: ${r.exceptionDetails.text}\n${expression}`);
    return r.result.value;
  }

  async waitFor(expression, what, timeout = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await this.eval(expression)) return;
      await new Promise((r) => setTimeout(r, 80));
    }
    fail(`timeout waiting for ${what}: ${expression}`);
  }
}

function openWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', (e) => reject(new Error(`ws error: ${e.message ?? url}`)));
  });
}

async function connect(wsBase) {
  const browser = new Cdp(await openWs(wsBase));
  const { targetInfos } = await browser.send('Target.getTargets');
  const page = targetInfos.find((t) => t.type === 'page');
  if (!page) fail('no page target');
  const pageWs = wsBase.replace(/\/devtools\/browser\/.*/, `/devtools/page/${page.targetId}`);
  const cdp = new Cdp(await openWs(pageWs));
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  return cdp;
}

// ---------- UI-driving helpers ----------
async function addFile(cdp, path, tokenIndex = 0) {
  await cdp.eval(`(() => {
    const p = document.querySelector('.wt-new-path');
    p.value = ${JSON.stringify(path)};
    p.dispatchEvent(new Event('input', { bubbles: true }));
    const c = document.querySelector('.wt-new-content');
    if (c && c.tagName === 'SELECT') { c.selectedIndex = ${tokenIndex}; c.dispatchEvent(new Event('change', { bubbles: true })); }
    document.querySelector('.wt-add').click();
  })()`);
}
async function clickAction(cdp, op) {
  await cdp.eval(`document.querySelector('.act[data-op="${op}"]').click()`);
}
async function waitLog(cdp, n) {
  await cdp.waitFor(`document.querySelectorAll('#actionLog .log-row').length >= ${n}`, `action log has ${n} rows`);
}

async function main() {
  const hardDeadline = setTimeout(() => { console.error('GLOBAL DEADLINE EXCEEDED'); process.exit(1); }, DEADLINE_MS);
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const profileDir = mkdtempSync(join(tmpdir(), 'edugit-e2e-'));
  const bin = findChrome();
  console.log(`# chrome: ${bin}`);
  const { chrome, wsBase } = await launchChrome(bin, profileDir);

  try {
    const cdp = await connect(wsBase);
    await cdp.send('Page.navigate', { url: `${base}/#one-blob` });
    await cdp.waitFor('!!document.querySelector(".lesson-title")', 'app boot');
    ok('app boots from hash #one-blob');

    await cdp.eval('localStorage.clear()');
    await cdp.send('Page.navigate', { url: `${base}/#one-blob` });
    await cdp.waitFor('!!document.querySelector(".lesson-title")', 'app reboot');

    // first visit: the beginner's primer auto-opens and covers the page; close
    // it and check it stays closed on the next reload
    await cdp.waitFor('!document.getElementById("introOverlay").hidden', 'beginner primer auto-opens');
    await cdp.waitFor('document.querySelectorAll("#introBody h3").length >= 4', 'primer content rendered');
    await cdp.eval('document.getElementById("introClose").click()');
    await cdp.waitFor('document.getElementById("introOverlay").hidden', 'primer closed');
    await cdp.send('Page.navigate', { url: `${base}/#one-blob` });
    await cdp.waitFor('!!document.querySelector(".lesson-title")', 'app reload after primer');
    if (await cdp.eval('!document.getElementById("introOverlay").hidden')) fail('primer reopened despite introSeen flag');
    ok('beginner primer: auto-opens once, then stays behind the Basics button');

    // turbo for fast headless runs
    await cdp.eval(`(() => { const s = document.getElementById('speed'); s.value = s.max; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    ok('turbo speed set');

    // ---- solve level 1: one-blob ----
    await addFile(cdp, 'README', 0);
    await waitLog(cdp, 1);
    await clickAction(cdp, 'stage');
    await waitLog(cdp, 2);
    await clickAction(cdp, 'commit');
    await waitLog(cdp, 3);
    await cdp.waitFor('!!document.querySelector("#lessonPanel .banner-pass")', 'level 1 pass banner', 20000);
    await cdp.waitFor('document.querySelectorAll("#objectStore .obj").length >= 3', 'store rendered objects');
    let prog = await cdp.eval('JSON.parse(localStorage.getItem("gitsim.progress") ?? "[]")');
    if (!prog.includes('one-blob')) fail('progress missing one-blob');
    ok('level 1 solved via UI (blob + tree + commit, pass banner, progress)');

    // ---- solve level 2: dedup ----
    await cdp.eval('location.hash = "#dedup"');
    await cdp.waitFor('location.hash === "#dedup" && !!document.querySelector(".lesson-title")', 'level 2 loaded');
    await addFile(cdp, 'a.txt', 0);   // token A
    await waitLog(cdp, 1);
    await addFile(cdp, 'b.txt', 0);   // token A again → same content
    await waitLog(cdp, 2);
    await clickAction(cdp, 'stage');
    await waitLog(cdp, 3);
    await clickAction(cdp, 'commit');
    await waitLog(cdp, 4);
    await cdp.waitFor('!!document.querySelector("#lessonPanel .banner-pass")', 'level 2 pass banner', 20000);
    const blobCount = await cdp.eval('document.querySelectorAll("#objectStore .obj-blob").length');
    if (blobCount !== 1) fail(`dedup should yield exactly ONE blob, saw ${blobCount}`);
    ok('level 2 dedup: two equal files → a single shared blob');

    // level map shows completion
    await cdp.eval('document.getElementById("btnLevels").click()');
    await cdp.waitFor('document.querySelectorAll("#levelSelectOverlay .level-card.done").length >= 2', 'level map done marks');
    await cdp.eval('document.querySelector("#levelSelectOverlay .modal-close").click()');
    ok('level map shows completed levels');

    // language switch
    await cdp.eval(`document.querySelector(".lang-switch [data-lang='en']").click()`);
    const en = await cdp.eval('document.getElementById("btnLevels").textContent.trim()');
    if (en !== 'Levels') fail(`expected EN nav label, got "${en}"`);
    await cdp.eval(`document.querySelector(".lang-switch [data-lang='it']").click()`);
    const it = await cdp.eval('document.getElementById("btnLevels").textContent.trim()');
    if (it !== 'Livelli') fail(`expected IT nav label, got "${it}"`);
    ok('language switch IT ⇄ EN');

    // sandbox
    await cdp.eval('document.getElementById("btnSandbox").click()');
    await cdp.waitFor('location.hash === "#sandbox" && !!document.querySelector(".wt-new-path")', 'sandbox loaded');
    ok('sandbox opens');

    if (cdp.consoleErrors.length) fail(`console errors:\n${cdp.consoleErrors.join('\n')}`);
    ok('zero console errors / exceptions');

    console.log(`\n# e2e passed (${passed} checks)`);
  } finally {
    clearTimeout(hardDeadline);
    chrome.kill('SIGKILL');
    server.close();
    try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
