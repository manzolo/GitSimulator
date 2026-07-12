// Lesson panel: level text, goal, the allowed-actions chips, one-at-a-time hints
// and the pass/fail banner. Adapted from the sibling EDU-* projects.

import { t, tr } from '../i18n.js';

export function createLevelPanel(container, { onNext } = {}) {
  let level = null;
  let levelIndex = 0;
  let total = 0;
  let revealedHints = 0;
  let result = null;   // { pass, msg }
  let completed = false;

  function chips() {
    if (!level?.allowedOps) return '';
    const c = level.allowedOps.map((op) => `<span class="chip chip-rule">${op}</span>`).join('');
    return `<div class="rule-chips"><span class="chip-label">${t('allowedLabel')}</span>${c}</div>`;
  }

  function hintsHtml() {
    if (!level?.hints?.length) return '';
    const shown = level.hints.slice(0, revealedHints)
      .map((h) => `<div class="hint">${tr(h)}</div>`).join('');
    const more = revealedHints < level.hints.length;
    const btn = `<button class="btn btn-ghost btn-hint" ${more ? '' : 'disabled'}>${
      more ? t('hintBtn', revealedHints + 1, level.hints.length) : t('hintsDone')}</button>`;
    return `<div class="hints">${shown}${btn}</div>`;
  }

  function resultHtml() {
    if (!result) return '';
    if (result.pass) {
      const last = levelIndex >= total - 1;
      return `<div class="banner banner-pass"><div>${result.msg}</div>
        ${last ? '' : `<button class="btn btn-primary btn-next">${t('nextLevel')}</button>`}</div>`;
    }
    return `<div class="banner banner-fail">${result.msg}</div>`;
  }

  function render() {
    if (!level) {
      container.innerHTML = `<div class="lesson">
        <div class="lesson-eyebrow">${t('sandboxTitle')}</div>
        <div class="lesson-text">${t('sandboxText')}</div></div>`;
      return;
    }
    container.innerHTML = `<div class="lesson">
      <div class="lesson-eyebrow">${t('levelBadge', levelIndex + 1)} / ${total}
        ${completed ? `<span class="done-mark" title="${t('completedBadge')}">✓</span>` : ''}</div>
      <h2 class="lesson-title">${tr(level.title)}</h2>
      <div class="lesson-text">${tr(level.text)}</div>
      <div class="goal"><span class="goal-label">${t('goalLabel')}</span> ${tr(level.goal)}</div>
      ${chips()}${hintsHtml()}${resultHtml()}</div>`;
    container.querySelector('.btn-hint')?.addEventListener('click', () => { revealedHints++; render(); });
    container.querySelector('.btn-next')?.addEventListener('click', () => onNext?.());
  }

  return {
    showLevel(lv, index, count, isCompleted) {
      level = lv; levelIndex = index; total = count; completed = isCompleted;
      revealedHints = 0; result = null; render();
    },
    showSandbox() { level = null; result = null; render(); },
    setResult(r) { result = r; if (r?.pass) completed = true; render(); },
    refresh: render,
  };
}
