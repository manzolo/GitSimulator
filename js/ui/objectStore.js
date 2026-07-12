// The signature element: the object store, drawn as a grid of type-coloured
// cards (blob=yellow, tree=green, commit=red) with edges between them, animated
// as objects are born, deduplicated and linked. It keeps its own MODEL and a
// single sync() that diffs model → DOM, so both the instant full render
// (renderSnapshot) and the incremental animation (applyEvent) share one layout.
// Cards are absolutely positioned with CSS transitions, so when a new object
// appears the others glide to their new places while the newcomer pops in.

import { shortSha } from '../core/objects.js';
import { t } from '../i18n.js';

const COL = { commit: 0, tree: 1, blob: 2 };
const COLX = [24, 214, 404];
const CARD_W = 158;
const ROW_H = 66;
const TOP = 44;

export function createObjectStore(container, { onSelect } = {}) {
  container.innerHTML = `
    <div class="store-canvas">
      <svg class="store-edges" xmlns="http://www.w3.org/2000/svg"></svg>
      <div class="store-cards"></div>
      <div class="store-empty" data-i18n="storeEmpty"></div>
    </div>`;
  const canvas = container.querySelector('.store-canvas');
  const svg = container.querySelector('.store-edges');
  const cardsLayer = container.querySelector('.store-cards');
  const emptyEl = container.querySelector('.store-empty');

  // internal model
  let objects = new Map();       // sha -> { sha, type, size, summary }
  let edges = [];                // { from, to, kind }
  const edgeSet = new Set();
  let refs = {};                 // branch -> sha
  let head = null;               // { ref?, sha, detached }
  let order = [];                // sha insertion order (stable row layout)
  let selected = null;
  const cardEls = new Map();     // sha -> element

  function reset() {
    objects = new Map(); edges = []; edgeSet.clear(); refs = {}; head = null;
    order = []; selected = null; cardEls.clear();
    cardsLayer.innerHTML = ''; svg.innerHTML = '';
    layout();
  }

  function ensureOrder(sha) { if (!order.includes(sha)) order.push(sha); }

  // ---- positions ----
  function positions() {
    const rows = { commit: 0, tree: 0, blob: 0 };
    const pos = new Map();
    for (const sha of order) {
      const o = objects.get(sha);
      if (!o) continue;
      const col = COL[o.type];
      const r = rows[o.type]++;
      pos.set(sha, { x: COLX[col], y: TOP + r * ROW_H });
    }
    const maxRows = Math.max(rows.commit, rows.tree, rows.blob, 0);
    const width = COLX[2] + CARD_W + 24;
    const height = TOP + maxRows * ROW_H + 24;
    return { pos, width, height };
  }

  function center(p) { return { x: p.x + CARD_W / 2, y: p.y + 24 }; }

  // ---- render / sync ----
  function layout(opts = {}) {
    const { animateNew = false, born = null, reused = null } = opts;
    const { pos, width, height } = positions();
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    emptyEl.hidden = objects.size > 0;

    // cards
    for (const [sha, o] of objects) {
      let el = cardEls.get(sha);
      const p = pos.get(sha);
      if (!el) {
        el = document.createElement('button');
        el.className = `obj obj-${o.type}`;
        el.dataset.sha = sha;
        el.innerHTML = `<span class="obj-type">${t(`type${cap(o.type)}`)}</span>
          <span class="obj-hash">${shortSha(sha)}</span>
          <span class="obj-sum"></span>
          <span class="obj-reused">${t('objReused')}</span>`;
        el.addEventListener('click', () => { select(sha); onSelect?.(sha); });
        cardsLayer.appendChild(el);
        cardEls.set(sha, el);
        if (animateNew && sha === born) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 500); }
      }
      el.querySelector('.obj-sum').textContent = o.summary ?? '';
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.classList.toggle('selected', sha === selected);
      if (reused && sha === reused) {
        el.classList.add('reused-now');
        setTimeout(() => el.classList.remove('reused-now'), 900);
      }
    }
    // remove stale cards
    for (const [sha, el] of [...cardEls]) {
      if (!objects.has(sha)) { el.classList.add('collected'); const e = el; setTimeout(() => e.remove(), 300); cardEls.delete(sha); }
    }

    // edges
    const svgns = 'http://www.w3.org/2000/svg';
    const keep = new Set();
    for (const e of edges) {
      const a = pos.get(e.from); const b = pos.get(e.to);
      if (!a || !b) continue;
      const id = `${e.from}>${e.to}`;
      keep.add(id);
      let path = svg.querySelector(`[data-edge="${id}"]`);
      const ca = center(a); const cb = center(b);
      const d = edgePath(ca, cb, e.kind);
      if (!path) {
        path = document.createElementNS(svgns, 'path');
        path.setAttribute('data-edge', id);
        path.setAttribute('class', `edge edge-${e.kind}`);
        if (animateNew) path.classList.add('edge-draw');
        svg.appendChild(path);
      }
      path.setAttribute('d', d);
    }
    for (const path of [...svg.querySelectorAll('[data-edge]')]) {
      if (!keep.has(path.getAttribute('data-edge'))) path.remove();
    }

    renderRefPills(pos);
  }

  function edgePath(a, b, kind) {
    if (kind === 'commit-parent' || kind === 'tree-tree') {
      // same column: bow out to the side
      const mx = (a.x + b.x) / 2 - 46;
      const my = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
    }
    const mx = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
  }

  // ---- ref pills (branches + HEAD) drawn above their commit ----
  function renderRefPills(pos) {
    cardsLayer.querySelectorAll('.ref-pill').forEach((el) => el.remove());
    const byCommit = new Map();
    for (const [name, sha] of Object.entries(refs)) {
      if (!byCommit.has(sha)) byCommit.set(sha, []);
      byCommit.get(sha).push(name);
    }
    const headSha = head?.sha ?? null;
    for (const [sha, names] of byCommit) {
      const p = pos.get(sha);
      if (!p) continue;
      names.forEach((name, i) => {
        const pill = document.createElement('div');
        const isHeadBranch = head && !head.detached && head.ref === `refs/heads/${name}`;
        pill.className = `ref-pill${isHeadBranch ? ' ref-head' : ''}`;
        pill.textContent = isHeadBranch ? `HEAD→${name}` : name;
        pill.style.left = `${p.x + 4 + i * 8}px`;
        pill.style.top = `${p.y - 20 - i * 2}px`;
        cardsLayer.appendChild(pill);
      });
    }
    // detached HEAD marker
    if (head?.detached && headSha) {
      const p = pos.get(headSha);
      if (p) {
        const pill = document.createElement('div');
        pill.className = 'ref-pill ref-head ref-detached';
        pill.textContent = 'HEAD';
        pill.style.left = `${p.x + 4}px`;
        pill.style.top = `${p.y - 20}px`;
        cardsLayer.appendChild(pill);
      }
    }
  }

  function select(sha) {
    selected = sha;
    for (const [s, el] of cardEls) el.classList.toggle('selected', s === sha);
  }

  // ---- public: full render from a snapshot ----
  function renderSnapshot(snap) {
    objects = new Map();
    order = [];
    for (const sha in snap.objects) {
      const o = snap.objects[sha];
      objects.set(sha, { sha, type: o.type, size: o.size, summary: summaryOf(o) });
      order.push(sha);
    }
    edges = snap.edges.map((e) => ({ from: e.from, to: e.to, kind: e.kind }));
    edgeSet.clear();
    for (const e of edges) edgeSet.add(`${e.from}>${e.to}`);
    refs = { ...snap.branches };
    head = snap.HEAD.type === 'detached'
      ? { detached: true, sha: snap.HEAD.sha }
      : { detached: false, ref: snap.HEAD.ref, sha: snap.HEAD.sha };
    // sync card set: remove any not present
    for (const [sha, el] of [...cardEls]) if (!objects.has(sha)) { el.remove(); cardEls.delete(sha); }
    layout();
  }

  // ---- public: apply one delta with animation ----
  function applyEvent(evt) {
    switch (evt.type) {
      case 'object-created':
        objects.set(evt.sha, { sha: evt.sha, type: evt.objType, size: evt.size, summary: evt.summary });
        ensureOrder(evt.sha);
        layout({ animateNew: true, born: evt.sha });
        break;
      case 'object-reused':
        layout({ animateNew: true, reused: evt.sha });
        break;
      case 'edge-added':
        if (!edgeSet.has(`${evt.from}>${evt.to}`)) {
          edgeSet.add(`${evt.from}>${evt.to}`);
          edges.push({ from: evt.from, to: evt.to, kind: evt.kind });
        }
        layout({ animateNew: true });
        break;
      case 'ref-moved':
        refs[branchName(evt.ref)] = evt.to;
        layout();
        break;
      case 'ref-deleted':
        delete refs[branchName(evt.ref)];
        layout();
        break;
      case 'head-moved':
        head = evt.mode === 'detached'
          ? { detached: true, sha: evt.to }
          : { detached: false, ref: evt.ref, sha: evt.to };
        layout();
        break;
      case 'object-unreachable': {
        const el = cardEls.get(evt.sha);
        if (el) el.classList.add('dangling');
        break;
      }
      case 'object-collected':
        objects.delete(evt.sha);
        order = order.filter((s) => s !== evt.sha);
        edges = edges.filter((e) => e.from !== evt.sha && e.to !== evt.sha);
        edgeSet.clear(); for (const e of edges) edgeSet.add(`${e.from}>${e.to}`);
        layout();
        break;
      default:
        break;
    }
  }

  reset();
  return { renderSnapshot, applyEvent, reset, select, highlight: select };
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function branchName(ref) { return ref.replace(/^refs\/heads\//, ''); }

function summaryOf(o) {
  if (o.type === 'blob') {
    const s = (o.content ?? '').replace(/\n/g, '⏎');
    return s.length > 24 ? `${s.slice(0, 24)}…` : s;
  }
  if (o.type === 'tree') return `${o.entries.length} entr${o.entries.length === 1 ? 'y' : 'ies'}`;
  return o.message ?? '';
}
