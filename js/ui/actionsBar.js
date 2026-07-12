// High-level action buttons — the "commands" that are just sugar over the object
// store. Only the actions a level allows are shown enabled; the rest are hidden.
// Each button appends to the recorded action log via a callback.

import { t } from '../i18n.js';

const BUTTONS = [
  { op: 'stage', key: 'actStage', cls: '' },
  { op: 'commit', key: 'actCommit', cls: 'btn-primary' },
  { op: 'branch', key: 'actBranch', cls: '' },
  { op: 'checkout', key: 'actCheckout', cls: '' },
  { op: 'merge', key: 'actMerge', cls: '' },
  { op: 'delete-branch', key: 'actDeleteBranch', cls: '' },
  { op: 'gc', key: 'actGc', cls: '' },
];

export function createActionsBar(container, { onAction } = {}) {
  function render(allowedOps) {
    const allow = new Set(allowedOps ?? BUTTONS.map((b) => b.op));
    container.innerHTML = `<div class="actbar">${
      BUTTONS.filter((b) => allow.has(b.op))
        .map((b) => `<button class="btn ${b.cls} act" data-op="${b.op}">${t(b.key)}</button>`)
        .join('')
    }</div>`;
    container.querySelectorAll('.act').forEach((btn) => btn.addEventListener('click',
      () => onAction?.(btn.dataset.op)));
  }
  return { render };
}
