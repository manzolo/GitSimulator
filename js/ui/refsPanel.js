// A compact textual read-out of refs and HEAD — the mutable pointers that move
// while the objects stay immutable. (The store also draws ref pills on commits;
// this panel is the plain-text summary.)

import { t } from '../i18n.js';
import { shortSha } from '../core/objects.js';

export function createRefsPanel(container) {
  function render(snap) {
    const branches = Object.entries(snap.branches);
    let headLine;
    if (snap.HEAD.type === 'detached') {
      headLine = t('refsDetached', snap.HEAD.sha ? shortSha(snap.HEAD.sha) : '—');
    } else if (snap.HEAD.sha) {
      headLine = t('refsHeadOn', snap.HEAD.ref.replace('refs/heads/', ''));
    } else {
      headLine = t('refsUnborn');
    }
    const rows = branches.length
      ? branches.map(([name, sha]) => `<div class="ref-row">
          <span class="ref-name">${escapeHtml(name)}</span>
          <span class="ref-arrow">→</span>
          <span class="mono obj-commit-fg">${shortSha(sha)}</span></div>`).join('')
      : `<div class="ref-none">${t('refsNone')}</div>`;
    container.innerHTML = `<div class="refs">
      <div class="ref-head-line">${escapeHtml(headLine)}</div>${rows}</div>`;
  }
  return { render };
}

function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
