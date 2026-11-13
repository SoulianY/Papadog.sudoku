import { test } from 'node:test';
import assert from 'node:assert/strict';
import QQWing from 'qqwing';
import { PUZZLES } from '../src/puzzles.js';
import { PEERS, parse } from '../src/sudoku.js';

const LEVEL_DIFFICULTY = {
  easy: QQWing.Difficulty.SIMPLE,
  medium: QQWing.Difficulty.EASY,
  hard: QQWing.Difficulty.INTERMEDIATE,
  expert: QQWing.Difficulty.EXPERT,
};

test('each level has 100 distinct puzzles', () => {
  for (const [level, list] of Object.entries(PUZZLES)) {
    assert.equal(list.length, 100, level);
    assert.equal(new Set(list.map(([p]) => p)).size, 100, level);
  }
});

test('every puzzle has one solution, matching the stored one, at its level', () => {
  const q = new QQWing();
  for (const [level, list] of Object.entries(PUZZLES)) {
    for (const [puzzle, solution] of list) {
      const p = parse(puzzle);
      const s = parse(solution);
      assert.ok(p.every((v, i) => v === 0 || v === s[i]), 'givens agree with solution');
      assert.ok(s.every((v, i) => v >= 1 && PEERS[i].every((j) => s[j] !== v)), 'solution is valid');
      q.setPuzzle(p);
      assert.equal(q.countSolutions(), 1, 'unique solution');
      q.setPuzzle(p);
      q.setRecordHistory(true);
      q.solve();
      assert.equal(q.getDifficulty(), LEVEL_DIFFICULTY[level], `${level} difficulty`);
    }
  }
});
