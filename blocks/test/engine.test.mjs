import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES } from '../src/pieces.js';
import { SIZE, fits, fitsAnywhere, fullLineCells } from '../src/board.js';
import { curveAt, fit, newTray } from '../src/dealer.js';
import { newGame, play, points } from '../src/engine.js';

const piece = (cells) => ({ cells, color: 1 });
const single = piece([[0, 0]]);
const bar = (n) => piece(Array.from({ length: n }, (_, c) => [0, c]));

test('shapes expand to distinct rotations', () => {
  const variants = SHAPES.flat();
  assert.equal(new Set(variants.map((v) => JSON.stringify(v.cells))).size, variants.length);
  assert.equal(SHAPES[1].length, 2); // domino: horizontal + vertical
  assert.equal(SHAPES[3].length, 1); // 2×2 square
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

test('hard pieces start at zero, grow with score, and the fit bonus fades', () => {
  assert.equal(curveAt(0).tiers[2], 0);
  const hardShare = (score) => curveAt(score).tiers[2] / curveAt(score).tiers.reduce((a, b) => a + b);
  const scores = [0, 100, 300, 800, 2000, 5000];
  scores.slice(1).forEach((s, k) => {
    assert.ok(hardShare(s) > hardShare(scores[k]), `hard share at ${s}`);
    assert.ok(curveAt(s).help <= curveAt(scores[k]).help, `help at ${s}`);
  });
});

test('fit rewards completing lines and snug spots; -1 when nothing fits', () => {
  const board = Array(SIZE * SIZE).fill(0);
  for (let c = 3; c < SIZE; c++) board[56 + c] = 1; // bottom row missing cols 0-2
  const vertical = piece([[0, 0], [1, 0], [2, 0]]);
  assert.ok(fit(board, bar(3)) > 0.5); // completes the row
  assert.ok(fit(board, vertical) <= 0.5); // can't complete anything
  assert.ok(fit(board, bar(3)) > fit(board, vertical));
  const full = Array(SIZE * SIZE).fill(1);
  assert.equal(fit(full, single), -1);
});

test('early trays are fully playable', () => {
  const board = Array(SIZE * SIZE).fill(0);
  for (let i = 0; i < 40; i++) board[i] = 1; // top five rows filled
  for (let k = 0; k < 50; k++) assert.ok(newTray(board, 0).every((p) => fitsAnywhere(board, p)));
});

test('early trays favor pieces that suit the board; late trays much less', () => {
  const board = Array(SIZE * SIZE).fill(0);
  for (let c = 3; c < SIZE; c++) board[56 + c] = 1; // bottom row missing cols 0-2
  const lineFinisher = (p) => {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!fits(board, p, r, c)) continue;
      const next = [...board];
      for (const [dr, dc] of p.cells) next[(r + dr) * SIZE + c + dc] = 1;
      if (fullLineCells(next).lines > 0) return true;
    }
    return false;
  };
  const rate = (score) => {
    let hits = 0;
    for (let k = 0; k < 200; k++) hits += newTray(board, score).filter(lineFinisher).length;
    return hits / 600;
  };
  assert.ok(rate(0) > rate(5000) * 1.5, `${rate(0)} vs ${rate(5000)}`);
});
