// Content-sets panel: the visible environments a level runs your actions on,
// each shown as its token→bytes bindings. After a verify, a pass/fail mark
// appears per set — and the hidden sets (not shown) are what defeat hardcoding.

import { t } from '../i18n.js';

export function createCasesPanel(container) {
  let envs = [];

  function render(verdicts = null) {
    if (!envs.length) { container.innerHTML = ''; return; }
    const rows = envs.map((env, i) => {
      const bindings = Object.entries(env.content)
        .map(([k, v]) => `<span class="cs-tok">${k}<b>${escapeHtml(v.replace(/\n/g, '⏎').slice(0, 10))}</b></span>`)
        .join('');
      const mark = verdicts && verdicts.has(i)
        ? (verdicts.get(i) ? '<span class="cs-mark ok">✓</span>' : '<span class="cs-mark bad">✕</span>')
        : '';
      const cls = verdicts && verdicts.has(i) ? (verdicts.get(i) ? 'ok' : 'bad') : '';
      return `<div class="cs-row ${cls}">${mark}<span class="cs-bindings">${bindings}</span></div>`;
    }).join('');
    container.innerHTML = `<div class="cases">
      <div class="cs-hint">${t('casesHint')}</div>${rows}</div>`;
  }

  return {
    showCases(visibleEnvs) { envs = visibleEnvs; render(); },
    setVerdicts(verdicts) { render(verdicts); },
    clear() { envs = []; container.innerHTML = ''; },
    refresh() { render(); },
  };
}

function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
