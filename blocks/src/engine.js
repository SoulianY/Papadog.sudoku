// Game rules, no DOM. Board: 64 cells row-major, 0 = empty, otherwise a color id.
import { randomPiece } from './pieces.js';

export const SIZE = 8;
const TRAY_SIZE = 3;

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

/** A fresh tray; rerolls a few times so at least one piece can be placed. */
export function newTray(board, random = Math.random) {
  let tray;
  for (let attempt = 0; attempt < 20; attempt++) {
    tray = Array.from({ length: TRAY_SIZE }, () => randomPiece(random));
    if (tray.some((p) => fitsAnywhere(board, p))) break;
  }
  return tray;
}

export function newGame(random = Math.random) {
  const board = Array(SIZE * SIZE).fill(0);
  return { board, tray: newTray(board, random), score: 0, streak: 0, over: false };
}

/** Points: 1 per cell placed; clearing n lines gives 10·n² times the combo streak. */
export const points = (cellCount, lines, streak) => cellCount + 10 * lines * lines * streak;

/**
 * Places tray[slot] at (row, col). Returns the next state and the cells that were cleared,
 * or null if the move is not allowed.
 */
export function play(state, slot, row, col, random = Math.random) {
  const piece = state.tray[slot];
  if (state.over || !piece || !fits(state.board, piece, row, col)) return null;

  const board = [...state.board];
  for (const [dr, dc] of piece.cells) board[(row + dr) * SIZE + col + dc] = piece.color;
  const { cells: cleared, lines } = fullLineCells(board);
  for (const i of cleared) board[i] = 0;

  const streak = lines > 0 ? state.streak + 1 : 0;
  const score = state.score + points(piece.cells.length, lines, streak);
  let tray = state.tray.map((p, k) => (k === slot ? null : p));
  if (tray.every((p) => p === null)) tray = newTray(board, random);
  const over = !tray.some((p) => p && fitsAnywhere(board, p));

  return { state: { board, tray, score, streak, over }, cleared, lines };
}
