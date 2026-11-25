import { test } from 'node:test';
import assert from 'node:assert/strict';
import { turn, randomTree, watered, solved, SIDES } from '../src/pipes.js';
import { stageBoard, sizeOf, TOTAL } from '../src/stages.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('turning shifts the open sides clockwise', () => {
  assert.equal(turn(1), 2); // N → E
  assert.equal(turn(8), 1); // W → N
  assert.equal(turn(1 | 2), 2 | 4); // corner NE → ES
  assert.equal(turn(5, 2), 5); // straight N–S is back after two turns
  assert.equal(turn(3, 4), 3);
});

test('a random tree joins every cell with no loops and no loose ends', () => {
  for (const size of [4, 7, 10]) {
    const masks = randomTree(size, seeded(size));
    const edges = masks.reduce((sum, m) => sum + SIDES.filter((s) => m & s.bit).length, 0) / 2;
    assert.equal(edges, size * size - 1); // a tree on n cells has n − 1 links
    assert.ok(solved(masks, size, 0));
  }
});

test('water stops at a broken link', () => {
  // 1×... a 2×2 board: two tiles joined, two not
  const masks = [2, 8 | 4, 0, 1];
  assert.deepEqual([...watered(masks, 2, 0)].sort(), [0, 1, 3]);
  assert.ok(!solved(masks, 2, 0));
});

test('500 stages from 4×4 to 10×10, each scrambled and solvable by turning tiles back', () => {
  assert.equal(TOTAL, 500);
  assert.equal(sizeOf(1), 4);
  assert.equal(sizeOf(500), 10);
  const seen = new Set();
  for (let s = 1; s <= TOTAL; s++) {
    const { size, source, solution, turns } = stageBoard(s);
    if (s > 1) assert.ok(size >= sizeOf(s - 1));
    assert.ok(solved(solution, size, source), `stage ${s} solution`);
    const scrambled = solution.map((m, i) => turn(m, turns[i]));
    assert.ok(!solved(scrambled, size, source), `stage ${s} starts unsolved`);
    const key = scrambled.join(',');
    assert.ok(!seen.has(key), `stage ${s} repeats`);
    seen.add(key);
  }
});
