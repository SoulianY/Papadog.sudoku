// Progress persisted in localStorage: best solve time (ms) per level index.

const KEY = 'itda-progress';

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function recordSolve(progress, index, ms) {
  const best = progress[index];
  if (best === undefined || ms < best) progress[index] = ms;
  localStorage.setItem(KEY, JSON.stringify(progress));
}
