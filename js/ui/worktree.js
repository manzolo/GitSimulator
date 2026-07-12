// The working-tree editor: the files the user creates and edits. In a guided
// level, a file's content is chosen from the level's content TOKENS (so the same
// action log can be replayed on any content set); in the sandbox, content is
// typed freely. Each row shows the file's status (untracked / modified / staged)
// against the index. Actions here feed the recorded action log via callbacks.

import { makeBlob, shortSha } from '../core/objects.js';
import { t } from '../i18n.js';

export function createWorktree(container, { onWrite, onEditContent, onStage, onDelete } = {}) {
  let tokens = null;   // [{token, bytes}] or null (sandbox → free text)
  let paths = [];      // suggested filenames
  let snap = null;

  function shaToToken() {
    const m = new Map();
    // First token wins: when two tokens are bound to identical bytes (e.g. the
    // dedup level's A === B), show the earlier one rather than let it flip.
    if (tokens) for (const { token, bytes } of tokens) {
      const sha = makeBlob(bytes).sha;
      if (!m.has(sha)) m.set(sha, token);
    }
    return m;
  }

  function statusOf(path) {
    const wsha = snap.work[path];
    const isha = snap.index[path];
    if (isha === undefined) return 'untracked';
    if (isha === wsha) return 'staged';
    return 'modified';
  }

  function contentControl(path, currentToken) {
    if (tokens) {
      const opts = tokens.map(({ token, bytes }) => {
        const preview = bytes.replace(/\n/g, '⏎').slice(0, 14);
        const sel = token === currentToken ? ' selected' : '';
        return `<option value="${token}"${sel}>${token} · ${escapeAttr(preview)}</option>`;
      }).join('');
      return `<select class="wt-content" data-path="${escapeAttr(path)}">${opts}</select>`;
    }
    return '';
  }

  function render(snapshot, opts = {}) {
    snap = snapshot;
    tokens = opts.tokens ?? null;
    paths = opts.paths ?? [];
    const map = shaToToken();
    const files = Object.keys(snap.work).sort();

    const rows = files.map((path) => {
      const st = statusOf(path);
      const tok = map.get(snap.work[path]) ?? '?';
      const canStage = st !== 'staged';
      return `<div class="wt-row wt-${st}">
        <span class="wt-status" title="${t(`wt${cap(st)}`)}"></span>
        <span class="wt-path">${escapeHtml(path)}</span>
        <span class="wt-blob">${shortSha(snap.work[path])}</span>
        ${contentControl(path, tok)}
        <button class="btn btn-mini wt-stage" data-path="${escapeAttr(path)}" ${canStage ? '' : 'disabled'}>${t('wtStage')}</button>
        <button class="btn btn-mini btn-ghost wt-del" data-path="${escapeAttr(path)}">${t('wtDelete')}</button>
      </div>`;
    }).join('');

    const pathList = paths.map((p) => `<option value="${escapeAttr(p)}">`).join('');
    const newContent = tokens
      ? `<select class="wt-new-content">${tokens.map(({ token, bytes }) => `<option value="${token}">${token} · ${escapeAttr(bytes.replace(/\n/g, '⏎').slice(0, 14))}</option>`).join('')}</select>`
      : `<input class="wt-new-content wt-freetext" placeholder="content" value="hello\\n">`;

    container.innerHTML = `
      <div class="wt">
        <div class="wt-list">${files.length ? rows : `<div class="wt-empty">${t('wtEmpty')}</div>`}</div>
        <div class="wt-new">
          <input class="wt-new-path" list="wt-paths" placeholder="${t('wtPathPlaceholder')}">
          <datalist id="wt-paths">${pathList}</datalist>
          ${newContent}
          <button class="btn btn-mini btn-primary wt-add">${t('wtNew')}</button>
        </div>
      </div>`;

    wire();
  }

  function readNewContent() {
    const el = container.querySelector('.wt-new-content');
    if (tokens) return { token: el.value };
    return { bytes: unescapeNewlines(el.value) };
  }

  function wire() {
    container.querySelector('.wt-add')?.addEventListener('click', () => {
      const path = container.querySelector('.wt-new-path').value.trim();
      if (!path) return;
      onWrite?.(path, readNewContent());
    });
    container.querySelectorAll('.wt-stage').forEach((b) => b.addEventListener('click',
      () => onStage?.([b.dataset.path])));
    container.querySelectorAll('.wt-del').forEach((b) => b.addEventListener('click',
      () => onDelete?.(b.dataset.path)));
    container.querySelectorAll('.wt-content').forEach((sel) => sel.addEventListener('change',
      () => onEditContent?.(sel.dataset.path, { token: sel.value })));
    container.querySelector('.wt-new-path')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') container.querySelector('.wt-add').click();
    });
  }

  return { render };
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(s) { return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
function unescapeNewlines(s) { return s.replace(/\\n/g, '\n'); }
