// Board geometry, no DOM. Board: 64 cells row-major, 0 = empty, otherwise a color id.

export const SIZE = 8;
export function fits(board, piece, row, col) {
  return piece.cells.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === 0;
  });
}

export function fitsAnywhere(board, piece) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (fits(board, piece, r, c)) return true;
  return false;
}

/** Cells of every full row and column. */
export function fullLineCells(board) {
  const cells = new Set();
  let lines = 0;
  for (let k = 0; k < SIZE; k++) {
    const row = Array.from({ length: SIZE }, (_, j) => k * SIZE + j);
    const col = Array.from({ length: SIZE }, (_, j) => j * SIZE + k);
    for (const line of [row, col]) {
      if (line.every((i) => board[i] !== 0)) {
        lines++;
        line.forEach((i) => cells.add(i));
      }
    }
  }
  return { cells, lines };
}
