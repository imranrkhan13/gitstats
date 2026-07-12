// Thin localStorage wrapper — every key is namespaced, every read/write is
// try/catched so a full quota or disabled storage never crashes the app,
// it just silently stops persisting.

const PREFIX = 'resumeiq:'

export function saveState(key, value) {
  try {
    if (value === undefined || value === null) { localStorage.removeItem(PREFIX + key); return }
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[persistence] failed to save "${key}"`, err)
  }
}

export function loadState(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw != null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function clearState(key) {
  try { localStorage.removeItem(PREFIX + key) } catch { /* ignore */ }
}

export function clearAllState(keys = []) {
  keys.forEach(clearState)
}
