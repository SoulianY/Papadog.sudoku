import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEdges, solved, blocked } from '../src/bridges.js';
import { countSolutions } from '../src/solver.js';

const levels = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url)));

test('edges join nearest islands and know which edges cross them', () => {
  //  . 1 .
  //  1 . 1
  //  . 1 .
  const islands = [[0, 1, 1], [1, 0, 1], [1, 2, 1], [2, 1, 1]];
  const edges = buildEdges(islands);
  assert.equal(edges.length, 2);
  const [v, h] = edges[0].horizontal ? [edges[1], edges[0]] : edges;
  assert.deepEqual(v.crosses, [edges.indexOf(h)]);
  const counts = edges.map((e) => (e === v ? 1 : 0));
  assert.ok(blocked(edges, counts, edges.indexOf(h)));
});

test('a solution needs every number met and every island connected', () => {
  // 2 = 2 joined by a double bridge, then a third island makes it disconnected.
  const pair = [[0, 0, 2], [0, 2, 2]];
  const edges = buildEdges(pair);
  assert.ok(solved(pair, edges, [2]));
  assert.ok(!solved(pair, edges, [1]));
  const split = [[0, 0, 1], [0, 2, 1], [2, 0, 1], [2, 2, 1]];
  const e2 = buildEdges(split);
  const counts = e2.map((e) => (e.horizontal ? 1 : 0));
  assert.ok(!solved(split, e2, counts));
});

test('300 levels, 75 per size from 7×7 to 10×10, each with exactly one solution', () => {
  assert.equal(levels.length, 300);
  [7, 8, 9, 10].forEach((size, k) => {
    assert.ok(levels.slice(k * 75, k * 75 + 75).every((l) => l.size === size));
  });
  for (const [i, { size, islands }] of levels.entries()) {
    assert.ok(islands.every(([r, c, n]) => r < size && c < size && n >= 1 && n <= 8), `level ${i + 1}`);
    assert.equal(countSolutions(islands, { nodeLimit: 2e6 }), 1, `level ${i + 1}`);
  }
});
