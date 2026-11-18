import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageInfo, TOTAL } from '../src/stages.js';
import { Round } from '../src/round.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('stages grow one number per stage and one board size every 50 stages', () => {
  assert.equal(TOTAL, 300);
  assert.deepEqual(stageInfo(1), { size: 5, max: 25, step: 1 });
  assert.deepEqual(stageInfo(2), { size: 5, max: 26, step: 2 });
  assert.deepEqual(stageInfo(50), { size: 5, max: 74, step: 50 });
  assert.deepEqual(stageInfo(51), { size: 6, max: 36, step: 1 });
  assert.deepEqual(stageInfo(300), { size: 10, max: 149, step: 50 });
});

test('the board starts with every number from 1 to size² once', () => {
  const r = new Round(6, 40, seeded(5));
  assert.deepEqual([...r.cells].sort((a, b) => a - b), Array.from({ length: 36 }, (_, i) => i + 1));
});

test('a wrong number is rejected and nothing changes', () => {
  const r = new Round(5, 25, seeded());
  const before = [...r.cells];
  assert.equal(r.tap(r.cells.indexOf(2)), 'wrong');
  assert.deepEqual(r.cells, before);
  assert.equal(r.next, 1);
});

test('tapped cells refill with the next numbers, then stay empty', () => {
  const r = new Round(5, 27, seeded());
  const at1 = r.cells.indexOf(1), at2 = r.cells.indexOf(2), at3 = r.cells.indexOf(3);
  r.tap(at1);
  assert.equal(r.cells[at1], 26);
  r.tap(at2);
  assert.equal(r.cells[at2], 27);
  r.tap(at3);
  assert.equal(r.cells[at3], null);
});

test('tapping every number in order finishes exactly on max', () => {
  const r = new Round(5, 74, seeded(9));
  for (let n = 1; n <= 74; n++) {
    const result = r.tap(r.cells.indexOf(n));
    assert.equal(result, n === 74 ? 'done' : 'ok');
  }
  assert.ok(r.cells.every((v) => v === null));
});
