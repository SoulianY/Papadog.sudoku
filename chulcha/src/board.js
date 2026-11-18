// Board rules shared by the game, the solver, and the level generator.
// A piece is [row, col, length, vertical]; piece 0 is the key piece, horizontal on EXIT_ROW.
// A position is an array with each piece's offset along its own axis (col if horizontal, row if vertical).

export const SIZE = 6;
export const EXIT_ROW = 2;
export const GOAL_COL = SIZE - 2; // key piece fully at the exit

export const startOffsets = (pieces) => pieces.map(([r, c, , vertical]) => (vertical ? r : c));

export function cellsOf(piece, offset) {
  const [r, c, len, vertical] = piece;
  return Array.from({ length: len }, (_, k) => (vertical ? (offset + k) * SIZE + c : r * SIZE + offset + k));
}

export function occupancy(pieces, offsets, skip = -1) {
  const grid = new Int8Array(SIZE * SIZE).fill(-1);
  pieces.forEach((p, i) => {
    if (i !== skip) for (const cell of cellsOf(p, offsets[i])) grid[cell] = i;
  });
  return grid;
}

// Lowest and highest offset piece i can slide to from where it stands.
export function slideRange(pieces, offsets, i, grid = occupancy(pieces, offsets)) {
  const [r, c, len, vertical] = pieces[i];
  const at = (k) => (vertical ? k * SIZE + c : r * SIZE + k);
  let lo = offsets[i], hi = offsets[i];
  while (lo > 0 && grid[at(lo - 1)] === -1) lo--;
  while (hi + len < SIZE && grid[at(hi + len)] === -1) hi++;
  return [lo, hi];
}

export const solved = (offsets) => offsets[0] === GOAL_COL;
