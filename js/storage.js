// Persistence under the 'gitsim.' namespace. Failures (private mode, quota)
// degrade to in-memory values, exactly like the sibling EDU-* projects. The
// user's "program" here is an ACTION LOG (an array), stored per level/sandbox.

const PREFIX = 'gitsim.';
const mem = new Map();

function get(key) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? mem.get(key) ?? null : v;
  } catch {
    return mem.get(key) ?? null;
  }
}

function set(key, value) {
  mem.set(key, value);
  try { localStorage.setItem(PREFIX + key, value); } catch { /* private mode */ }
}

function getJSON(key, fallback) {
  try {
    const v = get(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function getProgress() {
  return new Set(getJSON('progress', []));
}

export function markCompleted(levelId) {
  const p = getProgress();
  p.add(levelId);
  set('progress', JSON.stringify([...p]));
}

// The user's recorded action log for a level (or the sandbox).
export function getActions(id) {
  return getJSON(`actions.${id}`, null);
}

export function saveActions(id, actions) {
  set(`actions.${id}`, JSON.stringify(actions));
}

export function getLastMode() { return get('lastMode'); }
export function setLastMode(mode) { set('lastMode', mode); }
