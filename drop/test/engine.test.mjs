import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PIECES, bag } from '../src/pieces.js';
import { COLS, ROWS, HIDDEN, newGame, move, rotate, hardDrop, softDrop, hold, update, pieceCells, upcoming, dropDistance } from '../src/engine.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const HEIGHT = ROWS + HIDDEN;
const fillRow = (s, r, except = -1) => { for (let c = 0; c < COLS; c++) if (c !== except) s.board[r * COLS + c] = 0; };
const setPiece = (s, kind) => { s.piece = { kind, rot: 0, x: Math.floor((COLS - PIECES[kind].size) / 2), y: 1 }; };

test('every piece has four cells in every rotation', () => {
  for (const p of PIECES) for (const cells of p.rotations) assert.equal(cells.length, 4);
  assert.equal(new Set(PIECES[1].rotations.map((r) => JSON.stringify(r))).size, 1); // square never changes
});

test('a bag holds each kind exactly once', () => {
  assert.deepEqual([...bag(seeded(3))].sort(), [0, 1, 2, 3, 4, 5, 6]);
});

test('hard drop lands on the floor, scores 2 per row, and spawns the next piece', () => {
  const s = newGame(seeded());
  setPiece(s, 1); // square
  const nextKind = upcoming(s, 1)[0];
  hardDrop(s);
  assert.equal(s.board[(HEIGHT - 1) * COLS + 4], 1);
  assert.equal(s.board[(HEIGHT - 2) * COLS + 5], 1);
  assert.equal(s.score, 2 * (HEIGHT - 3));
  assert.equal(s.piece.kind, nextKind);
});

test('clearing four rows scores 800 × level and counts lines', () => {
  const s = newGame(seeded());
  for (let r = HEIGHT - 4; r < HEIGHT; r++) fillRow(s, r, 0);
  setPiece(s, 0);
  rotate(s, 1); // vertical bar
  while (move(s, -1));
  const before = s.score;
  const d = dropDistance(s);
  hardDrop(s);
  assert.equal(s.lines, 4);
  assert.equal(s.score - before, 800 + 2 * d);
  assert.ok(s.board.slice((HEIGHT - 4) * COLS).every((v) => v === -1));
});

test('ten lines raise the level', () => {
  const s = newGame(seeded());
  s.lines = 9;
  fillRow(s, HEIGHT - 1, 0);
  setPiece(s, 0);
  rotate(s, 1);
  while (move(s, -1));
  hardDrop(s);
  assert.equal(s.lines, 10);
  assert.equal(s.level, 2);
});

test('rotation kicks off the wall instead of failing', () => {
  const s = newGame(seeded());
  setPiece(s, 0);
  rotate(s, 1);
  while (move(s, 1));
  assert.ok(rotate(s, 1));
  assert.ok(pieceCells(s.piece).every(([, c]) => c >= 0 && c < COLS));
});

test('hold swaps once per piece', () => {
  const s = newGame(seeded());
  const first = s.piece.kind;
  assert.ok(hold(s));
  assert.equal(s.hold, first);
  assert.ok(!hold(s));
  hardDrop(s);
  const current = s.piece.kind;
  assert.ok(hold(s));
  assert.equal(s.piece.kind, first);
  assert.equal(s.hold, current);
});

test('a resting piece locks after the lock delay, not before', () => {
  const s = newGame(seeded());
  setPiece(s, 1);
  while (softDrop(s));
  update(s, 400);
  assert.equal(s.board.filter((v) => v !== -1).length, 0);
  update(s, 200);
  assert.equal(s.board.filter((v) => v !== -1).length, 4);
});

test('the game ends when a new piece cannot appear', () => {
  const s = newGame(seeded());
  for (let r = 0; r < HEIGHT; r++) fillRow(s, r, r % 2 ? 0 : 9);
  setPiece(s, 1);
  s.piece.y = -5; // park the piece above the field
  hardDrop(s);
  assert.ok(s.over);
});
