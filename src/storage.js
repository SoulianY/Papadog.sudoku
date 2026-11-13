// Progress persisted in localStorage, keyed by the puzzle's 81-digit string so it
// stays attached to the right puzzle even if the puzzle list is regenerated.
// { solved: { [puzzle]: seconds }, saves: { [puzzle]: { values, notes, elapsed } } }

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

export const getSolvedTime = (id) => load().solved[id];
export const getSave = (id) => load().saves[id];

export function countSolved(puzzles) {
  const { solved } = load();
  return puzzles.filter(([puzzle]) => puzzle in solved).length;
}

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
