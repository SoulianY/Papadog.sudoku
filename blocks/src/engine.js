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

// Difficulty ramps with score: [score, easy, medium, hard] weights, linearly blended between rows.
const CURVE = [
  [0, 8, 2, 0],
  [150, 6, 3, 1],
  [500, 4, 4, 2],
  [1200, 3, 4, 3],
  [2500, 2, 4, 4],
];
// Below this score every piece of a new tray fits somewhere; above it, only one is guaranteed.
const FRIENDLY_UNTIL = 300;

export function tierWeights(score) {
  const k = CURVE.findIndex(([s]) => s > score);
  if (k === -1) return CURVE.at(-1).slice(1);
  const [s0, ...w0] = CURVE[k - 1];
  const [s1, ...w1] = CURVE[k];
  const t = (score - s0) / (s1 - s0);
  return w0.map((w, i) => w + (w1[i] - w) * t);
}

/** A fresh tray for this score; rerolls a few times so it can be played. */
export function newTray(board, score, random = Math.random) {
  const weights = tierWeights(score);
  const playable = (p) => fitsAnywhere(board, p);
  let tray;
  for (let attempt = 0; attempt < 20; attempt++) {
    tray = Array.from({ length: TRAY_SIZE }, () => randomPiece(weights, random));
    if (score < FRIENDLY_UNTIL ? tray.every(playable) : tray.some(playable)) break;
  }
  return tray;
}

export function newGame(random = Math.random) {
  const board = Array(SIZE * SIZE).fill(0);
  return { board, tray: newTray(board, 0, random), score: 0, streak: 0, over: false };
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
  if (tray.every((p) => p === null)) tray = newTray(board, score, random);
  const over = !tray.some((p) => p && fitsAnywhere(board, p));

  return { state: { board, tray, score, streak, over }, cleared, lines };
}
