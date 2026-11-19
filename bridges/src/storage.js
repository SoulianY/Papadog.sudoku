// Cleared stages in localStorage. Storage may be unavailable; the game still runs.
const KEY = 'bridges-done';

export function loadDone() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? []);
  } catch {
    return new Set();
  }
}

export function saveDone(done) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {}
}
