// i18n core (same design as the sibling EDU-* projects): flat per-language
// dictionaries for the chrome, inline {en, it} objects for level content via
// tr(). The chosen language is stored under the app's own key.

import en from './strings/en.js';
import it from './strings/it.js';

const LANG_KEY = 'gitsim.lang';

const dicts = { en, it };
let lang = 'en';
const listeners = [];

// Language priority: ?lang=xx URL param > localStorage > browser language > en.
export function initLang() {
  let fromUrl = null;
  try {
    fromUrl = new URLSearchParams(location.search).get('lang');
  } catch { /* no location */ }

  if (fromUrl && dicts[fromUrl]) {
    lang = fromUrl;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  } else {
    let stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch { /* private mode */ }
    if (stored && dicts[stored]) {
      lang = stored;
    } else if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('it')) {
      lang = 'it';
    }
  }
  document.documentElement.lang = lang;
  syncUrlLang();
}

// Keep ?lang= in the address bar in sync, preserving the hash route.
function syncUrlLang() {
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('lang') === lang) return;
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  } catch { /* no history/location */ }
}

export function getLang() { return lang; }

export function setLang(l) {
  if (!dicts[l] || l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
  syncUrlLang();
  refreshStatic();
  listeners.forEach((f) => f(l));
}

export function onLangChange(f) { listeners.push(f); }

export function t(key, ...args) {
  const s = dicts[lang][key] ?? dicts.en[key] ?? key;
  return s.replace(/\{(\d+)\}/g, (_, n) => String(args[+n] ?? ''));
}

// tr({en: '...', it: '...'}) for per-level content.
export function tr(obj) {
  if (obj == null) return '';
  return obj[lang] ?? obj.en ?? '';
}

// Resolve a label that is either a plain string or a {code, args} object.
export function tl(label) {
  if (label == null) return '';
  if (typeof label === 'string') return label;
  return t(label.code, ...(label.args ?? []));
}

export function refreshStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}
