// Progress persisted in localStorage.
// { solved: { "easy-12": seconds }, saves: { "easy-12": { values, notes, elapsed } } }

const KEY = 'sudoku';

// Storage can be unavailable (private mode, sandboxed frames): play still works, just without saving.
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data) return data;
  } catch {}
  return { solved: {}, saves: {} };
}

function store(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export const puzzleId = (level, index) => `${level}-${index}`;

export const getSolvedTime = (id) => load().solved[id];
export const getSave = (id) => load().saves[id];

export const countSolved = (level) =>
  Object.keys(load().solved).filter((id) => id.startsWith(`${level}-`)).length;

export function writeSave(id, save) {
  const data = load();
  data.saves[id] = save;
  store(data);
}

export function markSolved(id, seconds) {
  const data = load();
  data.solved[id] = Math.min(seconds, data.solved[id] ?? Infinity);
  delete data.saves[id];
  store(data);
}
