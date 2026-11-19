// Fewest pairs tried per cleared stage in localStorage. Storage may be unavailable.
const KEY = 'pairs-best';

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
