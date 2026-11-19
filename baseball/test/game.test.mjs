import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSecret, judge, Game, MAX_TRIES } from '../src/game.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('secrets have distinct digits from 1 to 9', () => {
  for (let s = 1; s < 50; s++) {
    const secret = makeSecret(4, seeded(s));
    assert.equal(new Set(secret).size, 4);
    assert.ok(secret.every((d) => d >= 1 && d <= 9));
  }
});

test('strikes and balls', () => {
  assert.deepEqual(judge([1, 2, 3], [1, 2, 3]), { strike: 3, ball: 0 });
  assert.deepEqual(judge([1, 2, 3], [3, 1, 2]), { strike: 0, ball: 3 });
  assert.deepEqual(judge([1, 2, 3], [1, 3, 5]), { strike: 1, ball: 1 });
  assert.deepEqual(judge([1, 2, 3], [4, 5, 6]), { strike: 0, ball: 0 });
});

test('guesses with repeated digits or the wrong length are refused', () => {
  const g = new Game(3, seeded());
  assert.equal(g.guess([1, 1, 2]), null);
  assert.equal(g.guess([1, 2]), null);
  assert.equal(g.history.length, 0);
});

test('guessing the secret wins and ends the game', () => {
  const g = new Game(3, seeded(4));
  g.guess(g.secret.slice());
  assert.ok(g.won && g.over);
  assert.equal(g.guess([1, 2, 3]), null);
});

test('the game ends after the last try', () => {
  const g = new Game(3, seeded(2));
  const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !g.secret.includes(d)).slice(0, 3);
  for (let i = 0; i < MAX_TRIES; i++) g.guess(wrong);
  assert.ok(g.over && !g.won);
});
