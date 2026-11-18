import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, DIFFICULTIES } from 'sudoku-core';
import { PUZZLES } from '../src/puzzles.js';
import { PEERS, parse } from '../src/sudoku.js';

const BANDS = {
  easy: ['L2'],
  medium: ['L3', 'L4'],
  hard: ['L5', 'L6'],
  expert: ['L7', 'L8'],
};

const board = (s) => parse(s).map((v) => v || null);

test('each level has 100 distinct puzzles', () => {
  for (const [level, list] of Object.entries(PUZZLES)) {
    assert.equal(list.length, 100, level);
    assert.equal(new Set(list.map(([p]) => p)).size, 100, level);
  }
});

test('every puzzle has one solution, matching the stored one, in its level band, easiest first', () => {
  for (const [level, list] of Object.entries(PUZZLES)) {
    let previous = 0;
    for (const [n, [puzzle, solution]] of list.entries()) {
      const p = parse(puzzle);
      const s = parse(solution);
      assert.ok(p.every((v, i) => v === 0 || v === s[i]), 'givens agree with solution');
      assert.ok(s.every((v, i) => v >= 1 && PEERS[i].every((j) => s[j] !== v)), 'solution is valid');
      const { hasUniqueSolution, difficulty } = analyze(board(puzzle));
      assert.ok(hasUniqueSolution, `${level} #${n + 1} unique`);
      assert.ok(BANDS[level].includes(difficulty), `${level} #${n + 1} is ${difficulty}`);
      const rank = DIFFICULTIES.indexOf(difficulty);
      assert.ok(rank >= previous, `${level} #${n + 1} not easier than #${n}`);
      previous = rank;
    }
  }
});
