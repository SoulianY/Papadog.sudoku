// Saved game and best score in localStorage. Storage may be unavailable; the game still runs.
const KEY = 'blocks';

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}
