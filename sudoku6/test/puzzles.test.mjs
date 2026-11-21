import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../puzzles.js';
import { makeShape, parse } from '../../sudoku/src/shape.js';

const { size, count, peers, units } = makeShape(2, 3);
const all = LEVELS.flatMap((l) => l.puzzles);
const candidates = (g, i) => [1, 2, 3, 4, 5, 6].filter((d) => peers[i].every((j) => g[j] !== d));

function countSolutions(g) {
  const i = g.indexOf(0);
  if (i === -1) return 1;
  let n = 0;
  for (const d of candidates(g, i)) {
    g[i] = d;
    n += countSolutions(g);
    g[i] = 0;
    if (n > 1) break;
  }
  return n;
}

function solvesWithSingles(puzzle) {
  const g = puzzle.slice();
  for (let moved = true; moved;) {
    moved = false;
    for (let i = 0; i < count; i++) {
      if (g[i]) continue;
      const c = candidates(g, i);
      if (c.length === 1) { g[i] = c[0]; moved = true; }
    }
    for (const unit of units) {
      for (let d = 1; d <= size; d++) {
        if (unit.some((i) => g[i] === d)) continue;
        const spots = unit.filter((i) => !g[i] && candidates(g, i).includes(d));
        if (spots.length === 1) { g[spots[0]] = d; moved = true; }
      }
    }
  }
  return g.every(Boolean);
}

test('500 distinct 6×6 puzzles in 5 levels of 100', () => {
  assert.deepEqual(LEVELS.map((l) => l.puzzles.length), [100, 100, 100, 100, 100]);
  assert.equal(new Set(all.map(([p]) => p)).size, 500);
});

test('each puzzle has one solution, matching the stored one, and needs no guessing', () => {
  for (const [n, [puzzle, solution]] of all.entries()) {
    const p = parse(puzzle), s = parse(solution);
    assert.equal(p.length, 36);
    assert.ok(s.every((v, i) => v >= 1 && v <= 6 && peers[i].every((j) => s[j] !== v)), `#${n + 1} solution valid`);
    assert.ok(p.every((v, i) => v === 0 || v === s[i]), `#${n + 1} givens agree`);
    assert.equal(countSolutions(p.slice()), 1, `#${n + 1} unique`);
    assert.ok(solvesWithSingles(p), `#${n + 1} singles`);
  }
});

test('givens never increase from one puzzle to the next, from 22 down to 10', () => {
  const givens = all.map(([p]) => parse(p).filter(Boolean).length);
  assert.equal(givens[0], 22);
  assert.equal(givens.at(-1), 10);
  for (let i = 1; i < givens.length; i++) assert.ok(givens[i] <= givens[i - 1], `#${i + 1}`);
});
