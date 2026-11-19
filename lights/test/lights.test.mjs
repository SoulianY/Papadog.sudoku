import { test } from 'node:test';
import assert from 'node:assert/strict';
import { press, allOff, solve } from '../src/lights.js';
import { stageInfo, stageBoard, TOTAL } from '../src/stages.js';

test('pressing toggles the cell and its orthogonal neighbours', () => {
  const cells = new Array(9).fill(0);
  press(cells, 3, 4);
  assert.deepEqual(cells, [0, 1, 0, 1, 1, 1, 0, 1, 0]);
  press(cells, 3, 0);
  assert.deepEqual(cells, [1, 0, 0, 0, 1, 1, 0, 1, 0]);
});

test('stage sizes and scramble counts', () => {
  assert.equal(TOTAL, 300);
  assert.deepEqual(stageInfo(1), { size: 4, presses: 4 });
  assert.deepEqual(stageInfo(60), { size: 4, presses: 6 });
  assert.deepEqual(stageInfo(61), { size: 5, presses: 5 });
  assert.deepEqual(stageInfo(300), { size: 8, presses: 26 });
});

test('every stage is lit, distinct, and the solver turns it off in the fewest presses', () => {
  const seen = new Set();
  for (let s = 1; s <= TOTAL; s++) {
    const { size, cells } = stageBoard(s);
    assert.ok(!allOff(cells), `stage ${s}`);
    const key = cells.join('');
    assert.ok(!seen.has(key), `stage ${s} repeats`);
    seen.add(key);
    const solution = solve(cells, size);
    const board = cells.slice();
    for (const i of solution) press(board, size, i);
    assert.ok(allOff(board), `stage ${s} solution`);
    assert.ok(solution.length <= stageInfo(s).presses);
    if (size >= 6) assert.equal(solution.length, stageInfo(s).presses, `stage ${s}: 6×6 and up have one solution`);
  }
});

test('the solver finds the shorter of several solutions on 5×5', () => {
  // The 5×5 board has a non-trivial kernel: this pattern of presses changes nothing.
  const kernel = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
  const cells = new Array(25).fill(0);
  kernel.forEach((v, i) => { if (v) press(cells, 5, i); });
  assert.ok(allOff(cells));
  press(cells, 5, 12);
  assert.deepEqual(solve(cells, 5), [12]);
});
