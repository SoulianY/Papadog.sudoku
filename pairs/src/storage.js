// Fewest pairs tried per cleared stage in localStorage. Storage may be unavailable.
const KEY = 'pairs-records'; // stage numbers changed with the 350-stage layout, so older records aren't reused

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
