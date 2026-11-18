// Best clear time (ms) per stage in localStorage. Storage may be unavailable; the game still runs.
const KEY = 'charye-best';

export function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveBest(best) {
  try {
    localStorage.setItem(KEY, JSON.stringify(best));
  } catch {}
}
