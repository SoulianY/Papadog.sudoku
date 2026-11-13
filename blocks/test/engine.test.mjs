import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES } from '../src/pieces.js';
import { SIZE, fits, newGame, play, points } from '../src/engine.js';

const piece = (cells) => ({ cells, color: 1 });
const single = piece([[0, 0]]);
const bar = (n) => piece(Array.from({ length: n }, (_, c) => [0, c]));

test('shapes expand to distinct rotations', () => {
  const variants = SHAPES.flat();
  assert.equal(new Set(variants.map((v) => JSON.stringify(v.cells))).size, variants.length);
  assert.equal(SHAPES[1].length, 2); // domino: horizontal + vertical
  assert.equal(SHAPES[5].length, 1); // 2×2 square
});

test('fits respects edges and occupied cells', () => {
  const board = Array(SIZE * SIZE).fill(0);
  assert.ok(fits(board, bar(3), 0, 5));
  assert.ok(!fits(board, bar(3), 0, 6));
  board[2] = 1;
  assert.ok(!fits(board, bar(3), 0, 0));
});

test('completing a row and a column clears both and scores the combo', () => {
  const state = { ...newGame(), tray: [single, bar(2), bar(2)], streak: 0, score: 0 };
  state.board = Array(SIZE * SIZE).fill(0);
  for (let k = 1; k < SIZE; k++) {
    state.board[k] = 2; // row 0 except (0,0)
    state.board[k * SIZE] = 2; // column 0 except (0,0)
  }
  const result = play(state, 0, 0, 0);
  assert.equal(result.lines, 2);
  assert.equal(result.cleared.size, 15);
  assert.ok(result.state.board.every((v) => v === 0));
  assert.equal(result.state.score, points(1, 2, 1));
  assert.equal(result.state.streak, 1);
  assert.equal(result.state.tray[0], null);
});

test('illegal moves are rejected, used trays refill, a stuck tray ends the game', () => {
  const state = { ...newGame(), tray: [bar(5), null, null] };
  assert.equal(play(state, 0, 0, 4), null);
  assert.equal(play(state, 1, 0, 0), null);

  const refilled = play(state, 0, 0, 0).state;
  assert.equal(refilled.tray.filter(Boolean).length, 3);

  const board = Array(SIZE * SIZE).fill(0).map((_, i) => ((Math.floor(i / SIZE) + i) % 2 ? 0 : 3)); // checkerboard
  const stuck = play({ board, tray: [single, bar(2), null], score: 0, streak: 0, over: false }, 0, 0, 1).state;
  assert.equal(stuck.over, true);
});
