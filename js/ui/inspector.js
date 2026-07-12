// Object inspector: when you click an object in the store, this shows what Git
// actually stored — its type, full 40-hex hash, size, the exact PREIMAGE that
// was hashed, and its typed contents (blob bytes, tree entries, commit fields).
// The blob preimage is what `git hash-object` sees, so the hash is checkable.

import { t } from '../i18n.js';
import { shortSha } from '../core/objects.js';

export function createInspector(container) {
  let current = null;
  let snap = null;

  function row(k, v) { return `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`; }

  function renderObject(sha, snapshot) {
    current = sha; snap = snapshot;
    const o = snapshot?.objects[sha];
    if (!o) { clear(); return; }
    let rows = row(t('inspType'), `<span class="obj-tag obj-${o.type}">${t(`type${cap(o.type)}`)}</span>`)
      + row(t('inspHash'), `<span class="mono">${sha}</span>`)
      + row(t('inspSize'), `${o.size} B`);

    let body = '';
    if (o.type === 'blob') {
      body = `<div class="insp-h">${t('inspPreimage')}</div>
        <pre class="insp-pre">blob ${o.size}\\0${escapeHtml(o.content ?? '')}</pre>`;
    } else if (o.type === 'tree') {
      const entries = o.entries.map((e) => `<tr><td class="mono">${e.mode}</td>
        <td>${escapeHtml(e.name)}${e.type === 'tree' ? '/' : ''}</td>
        <td class="mono obj-${e.type}-fg">${shortSha(e.sha)}</td></tr>`).join('');
      body = `<div class="insp-h">${t('inspEntries')}</div>
        <table class="insp-tbl"><tbody>${entries}</tbody></table>`;
    } else if (o.type === 'commit') {
      const parents = o.parents.length
        ? o.parents.map((p) => `<span class="mono obj-commit-fg">${shortSha(p)}</span>`).join(' ')
        : t('inspNone');
      body = `<table class="insp-tbl"><tbody>
        ${row(t('inspTree'), `<span class="mono obj-tree-fg">${shortSha(o.tree)}</span>`)}
        ${row(t('inspParents'), parents)}
        ${row(t('inspMessage'), escapeHtml(o.message ?? ''))}
        </tbody></table>`;
    }

    container.innerHTML = `<div class="insp">
      <table class="insp-tbl insp-head"><tbody>${rows}</tbody></table>${body}</div>`;
  }

  function clear() {
    current = null;
    container.innerHTML = `<div class="insp-empty">${t('inspEmpty')}</div>`;
  }

  function refresh() { if (current && snap) renderObject(current, snap); else clear(); }

  clear();
  return { renderObject, clear, refresh };
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
