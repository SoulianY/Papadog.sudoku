// Best score in localStorage. Storage may be unavailable; the game still runs.
const KEY = 'drop-best';

export function loadBest() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {}
}
