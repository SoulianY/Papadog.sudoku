// Fewest moves used per solved level (by index) in localStorage. Storage may be unavailable.
const KEY = 'hanoi-best';

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
