import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { topOf, canMove, move, same, distancesTo } from '../src/hanoi.js';

const levels = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url)));

test('only the top disk moves, and never onto a smaller one', () => {
  const pos = [0, 0, 1]; // disks 0 and 1 on peg 0, disk 2 on peg 1
  assert.equal(topOf(pos, 0), 0);
  assert.equal(topOf(pos, 2), -1);
  assert.ok(canMove(pos, 0, 1));
  assert.ok(!canMove(pos, 1, 0)); // disk 2 can't go on disk 0
  assert.ok(!canMove(pos, 2, 0)); // empty peg
  assert.deepEqual(move(pos, 0, 2), [2, 0, 1]);
});

test('moving a full tower of n disks takes 2^n − 1 moves', () => {
  for (let n = 1; n <= 7; n++) {
    assert.equal(distancesTo(new Array(n).fill(2)).get('0'.repeat(n)), 2 ** n - 1);
  }
});

test('500 distinct levels; disks and fewest moves never decrease', () => {
  assert.equal(levels.length, 500);
  assert.equal(new Set(levels.map((l) => `${l.start}>${l.target}`)).size, 500);
  assert.equal(levels[0].start.length, 3);
  assert.equal(levels.at(-1).start.length, 7);
  for (let i = 1; i < levels.length; i++) {
    const [a, b] = [levels[i - 1], levels[i]];
    assert.ok(b.start.length > a.start.length || (b.start.length === a.start.length && b.moves >= a.moves), `level ${i + 1}`);
  }
});

test('every level is exactly its recorded fewest moves from start to target', () => {
  for (const [i, { start, target, moves }] of levels.entries()) {
    assert.ok(!same(start, target));
    assert.equal(distancesTo(target).get(start.join('')), moves, `level ${i + 1}`);
  }
});
