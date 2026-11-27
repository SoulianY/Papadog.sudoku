// Results per mode in localStorage: { [mode]: { won, lost, totalMs } }. Storage may be unavailable.
const KEY = 'fit-stats';

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
