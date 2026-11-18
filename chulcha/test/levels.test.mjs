import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIZE, EXIT_ROW, startOffsets, occupancy, cellsOf } from '../src/board.js';
import { minMoves } from '../src/solver.js';

const levels = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url)));
const asPieces = (level) => level.pieces.map(([r, c, len, v]) => [r, c, len, Boolean(v)]);

test('500 distinct levels, easiest first, from at least 15 moves to about 40', () => {
  assert.equal(levels.length, 500);
  assert.ok(levels[0].moves >= 15);
  assert.ok(levels.at(-1).moves >= 35);
  assert.equal(new Set(levels.map((l) => JSON.stringify(l.pieces))).size, 500);
  for (let i = 1; i < levels.length; i++) assert.ok(levels[i].moves >= levels[i - 1].moves, `level ${i + 1}`);
});

test('pieces sit inside the board without overlapping; the key piece is on the exit row', () => {
  for (const level of levels) {
    const pieces = asPieces(level);
    assert.deepEqual([pieces[0][0], pieces[0][2], pieces[0][3]], [EXIT_ROW, 2, false]);
    const offsets = startOffsets(pieces);
    const cells = pieces.flatMap((p, i) => cellsOf(p, offsets[i]));
    assert.ok(cells.every((c) => c >= 0 && c < SIZE * SIZE));
    assert.equal(new Set(cells).size, cells.length);
    assert.equal(occupancy(pieces, offsets).filter((v) => v !== -1).length, cells.length);
  }
});

test('every level is solvable in exactly its recorded fewest moves', () => {
  for (const [i, level] of levels.entries()) {
    const pieces = asPieces(level);
    assert.equal(minMoves(pieces, startOffsets(pieces)), level.moves, `level ${i + 1}`);
  }
});
