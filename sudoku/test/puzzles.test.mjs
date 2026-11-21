import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, DIFFICULTIES } from 'sudoku-core';
import { LEVELS as CLASSIC } from '../puzzles.js';
import { LEVELS as EASY } from '../../sudoku-easy/puzzles.js';
import { makeShape, parse } from '../src/shape.js';

const NINE = makeShape(3, 3);
const board = (s) => parse(s).map((v) => v || null);

// Allowed sudoku-core bands per level, by set.
const SETS = {
  classic: { levels: CLASSIC, bands: { easy: ['L2'], medium: ['L3', 'L4'], hard: ['L5', 'L6'], expert: ['L7', 'L8'] }, sizes: [100, 100, 100, 100] },
  easy: { levels: EASY, bands: { l2: ['L2'], l3: ['L3'], l4: ['L4'] }, sizes: [334, 333, 333] },
};

for (const [name, { levels, bands, sizes }] of Object.entries(SETS)) {
  test(`${name}: level sizes and no repeated puzzle`, () => {
    assert.deepEqual(levels.map((l) => l.puzzles.length), sizes);
    const all = levels.flatMap((l) => l.puzzles.map(([p]) => p));
    assert.equal(new Set(all).size, all.length);
  });

  test(`${name}: one solution each, matching the stored one, in its band, easiest first`, () => {
    for (const { key, puzzles } of levels) {
      let previous = 0;
      for (const [n, [puzzle, solution]] of puzzles.entries()) {
        const p = parse(puzzle);
        const s = parse(solution);
        assert.ok(p.every((v, i) => v === 0 || v === s[i]), 'givens agree with solution');
        assert.ok(s.every((v, i) => v >= 1 && NINE.peers[i].every((j) => s[j] !== v)), 'solution is valid');
        const { hasUniqueSolution, difficulty } = analyze(board(puzzle));
        assert.ok(hasUniqueSolution, `${key} #${n + 1} unique`);
        assert.ok(bands[key].includes(difficulty), `${key} #${n + 1} is ${difficulty}`);
        const rank = DIFFICULTIES.indexOf(difficulty);
        assert.ok(rank >= previous, `${key} #${n + 1} not easier than #${n}`);
        previous = rank;
      }
    }
  });
}

test('the easy set shares no puzzle with the classic set', () => {
  const classic = new Set(CLASSIC.flatMap((l) => l.puzzles.map(([p]) => p)));
  assert.ok(EASY.every((l) => l.puzzles.every(([p]) => !classic.has(p))));
});
