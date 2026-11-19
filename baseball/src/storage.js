// Per-mode stats in localStorage: { [length]: { played, won, best } }. Storage may be unavailable.
const KEY = 'baseball-stats';

export function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {}
}
