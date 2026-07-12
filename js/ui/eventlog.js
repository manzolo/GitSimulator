// Scrolling delta tape — every atomic step as the engine emits it. Language is
// resolved here via t('evt_<type>', …), keeping the core language-neutral.

import { t } from '../i18n.js';
import { shortSha } from '../core/objects.js';

export function createEventLog(container) {
  container.innerHTML = `<div class="evt-tape"><div class="evt-empty">${t('evtEmpty')}</div></div>`;
  const tape = container.querySelector('.evt-tape');

  function line(evt) {
    const s = (x) => (x ? shortSha(x) : '');
    let text;
    switch (evt.type) {
      case 'action-begin': text = t('evt_action-begin', evt.op); break;
      case 'content-hashed': text = t('evt_content-hashed', s(evt.sha)); break;
      case 'object-created': text = t('evt_object-created', evt.objType, s(evt.sha)); break;
      case 'object-reused': text = t('evt_object-reused', evt.objType, s(evt.sha)); break;
      case 'edge-added': text = t('evt_edge-added', `${s(evt.from)}→${s(evt.to)}`); break;
      case 'index-updated': text = t('evt_index-updated', `${evt.op} ${evt.path ?? ''}`.trim()); break;
      case 'worktree-changed': text = t('evt_worktree-changed', `${evt.op} ${evt.path}`); break;
      case 'ref-moved': text = t('evt_ref-moved', evt.ref.replace('refs/heads/', ''), s(evt.to)); break;
      case 'ref-deleted': text = t('evt_ref-deleted', evt.ref.replace('refs/heads/', '')); break;
      case 'head-moved': text = t('evt_head-moved', s(evt.to)); break;
      case 'merge-base': text = t('evt_merge-base', s(evt.sha)); break;
      case 'object-unreachable': text = t('evt_object-unreachable', s(evt.sha)); break;
      case 'object-collected': text = t('evt_object-collected', s(evt.sha)); break;
      default: text = evt.type;
    }
    return { text, cls: cssFor(evt.type) };
  }

  function append(evt) {
    if (evt.type === 'action-begin') { /* group header styling only */ }
    container.querySelector('.evt-empty')?.remove();
    const { text, cls } = line(evt);
    const row = document.createElement('div');
    row.className = `evt-row ${cls}`;
    row.innerHTML = `<span class="evt-t">${evt.time}</span><span class="evt-msg">${escapeHtml(text)}</span>`;
    tape.appendChild(row);
    tape.scrollTop = tape.scrollHeight;
  }

  function setAll(trace) {
    clear();
    for (const e of trace) append(e);
  }

  function clear() {
    tape.innerHTML = `<div class="evt-empty">${t('evtEmpty')}</div>`;
  }

  return { append, setAll, clear };
}

function cssFor(type) {
  if (type === 'object-reused') return 'evt-reuse';
  if (type === 'object-created') return 'evt-create';
  if (type === 'action-begin') return 'evt-act';
  if (type === 'object-collected' || type === 'object-unreachable') return 'evt-gc';
  if (type === 'ref-moved' || type === 'head-moved' || type === 'ref-deleted') return 'evt-ref';
  return '';
}
function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
