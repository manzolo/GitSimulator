// The recorded action log — the user's "program". Every GUI action appends a
// line here; the verifier replays exactly this list on each content set. A reset
// clears it back to the level's starter log.

import { t } from '../i18n.js';

export function createActionLog(container, { onReset } = {}) {
  function fmt(a) {
    const op = a.op === 'add' ? 'stage' : a.op;
    const c = a.content?.token ? ` = ${a.content.token}`
      : (a.content?.bytes != null ? ` = "${a.content.bytes.replace(/\n/g, '⏎').slice(0, 10)}"` : '');
    switch (op) {
      case 'write': case 'edit': return `${op} ${a.path}${c}`;
      case 'delete': return `delete ${a.path}`;
      case 'stage': return `stage ${(a.paths ?? [a.path]).join(' ')}`;
      case 'commit': return 'commit';
      case 'branch': return `branch ${a.name}`;
      case 'delete-branch': return `branch -d ${a.name ?? a.target}`;
      case 'checkout': return `checkout ${a.target ?? a.name}`;
      case 'merge': return `merge ${a.name ?? a.target}`;
      case 'gc': return 'gc';
      default: return op;
    }
  }

  function render(actions, activeIndex = -1) {
    const rows = actions.map((a, i) => `<div class="log-row${i === activeIndex ? ' active' : ''}">
      <span class="log-n">${i + 1}</span><span class="log-cmd">${escapeHtml(fmt(a))}</span></div>`).join('');
    container.innerHTML = `
      <div class="log">
        <div class="log-list">${actions.length ? rows : `<div class="log-empty">${t('logEmpty')}</div>`}</div>
        <button class="btn btn-mini btn-ghost log-reset">${t('logReset')}</button>
      </div>`;
    container.querySelector('.log-reset').addEventListener('click', () => onReset?.());
    const list = container.querySelector('.log-list');
    list.scrollTop = list.scrollHeight;
  }

  return { render };
}

function escapeHtml(s) { return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
