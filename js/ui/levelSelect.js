// The level-select modal: a grid of level cards plus the sandbox card. Mirrors
// the sibling projects' level map, including completion marks.

import { t, tr } from '../i18n.js';

export function createLevelSelect(overlay, { onSelect } = {}) {
  function open(levels, progress, currentId) {
    const cards = levels.map((lv, i) => {
      const done = progress.has(lv.id);
      const cur = lv.id === currentId;
      return `<button class="level-card${done ? ' done' : ''}${cur ? ' current' : ''}" data-id="${lv.id}">
        <span class="level-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="level-name">${tr(lv.title)}</span>
        ${done ? '<span class="done-mark">✓</span>' : ''}</button>`;
    }).join('');
    const sandbox = `<button class="level-card sandbox-card${currentId === 'sandbox' ? ' current' : ''}" data-id="sandbox">
      <span class="level-num">∞</span>
      <span class="level-name">${t('sandboxTitle')}</span></button>`;
    overlay.innerHTML = `<div class="modal">
      <div class="modal-head"><h2>${t('selectTitle')}</h2>
        <button class="btn btn-ghost modal-close" aria-label="close">✕</button></div>
      <div class="level-cards">${cards}${sandbox}</div></div>`;
    overlay.hidden = false;
    overlay.querySelectorAll('.level-card').forEach((b) => b.addEventListener('click', () => {
      overlay.hidden = true; onSelect?.(b.dataset.id);
    }));
    overlay.querySelector('.modal-close').addEventListener('click', () => { overlay.hidden = true; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; }, { once: true });
  }
  return { open };
}
