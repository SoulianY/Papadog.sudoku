// Game rules, no DOM.
import { SIZE, fits, fitsAnywhere, fullLineCells } from './board.js';
import { newTray } from './dealer.js';

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
