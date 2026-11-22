import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/game.js';
import { stageInfo, previewMs, SETS, TOTAL } from '../src/stages.js';

const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const partnerOf = (b, i) => b.cards.findIndex((c, k) => k !== i && c.id === b.cards[i].id);
const strangerOf = (b, i) => b.cards.findIndex((c) => c.id !== b.cards[i].id && !c.matched);

test('a deck holds every picture exactly twice', () => {
  const b = new Board(8, seeded());
  const counts = {};
  for (const c of b.cards) counts[c.id] = (counts[c.id] ?? 0) + 1;
  assert.deepEqual(Object.values(counts), new Array(8).fill(2));
});

test('a matching pair stays open', () => {
  const b = new Board(3, seeded());
  assert.equal(b.flip(0), 'first');
  assert.equal(b.flip(partnerOf(b, 0)), 'match');
  assert.ok(b.cards[0].matched && b.cards[partnerOf(b, 0)].matched);
  assert.equal(b.moves, 1);
  assert.equal(b.flip(0), 'ignored');
});

test('a mismatch closes after hideMiss, or as soon as the next card is flipped', () => {
  const b = new Board(3, seeded(2));
  const other = strangerOf(b, 0);
  b.flip(0);
  assert.equal(b.flip(other), 'miss');
  assert.ok(b.cards[0].open && b.cards[other].open);
  const third = b.cards.findIndex((c, k) => k !== 0 && k !== other);
  assert.equal(b.flip(third), 'first');
  assert.ok(!b.cards[0].open && !b.cards[other].open && b.cards[third].open);
});

test('opening every pair finishes the board', () => {
  const b = new Board(6, seeded(3));
  for (let i = 0; i < b.cards.length; i++) {
    if (b.cards[i].matched) continue;
    b.flip(i);
    b.flip(partnerOf(b, i));
  }
  assert.ok(b.done);
  assert.equal(b.moves, 6);
});

test('50 stages per card count, from 6 cards to 36, and every set has enough distinct pictures', () => {
  assert.equal(TOTAL, 350);
  assert.equal(stageInfo(1).pairs, 3);
  assert.equal(stageInfo(50).pairs, 3);
  assert.equal(stageInfo(51).pairs, 6);
  assert.equal(stageInfo(350).pairs, 18);
  for (const set of SETS) assert.equal(new Set(set).size, 18);
  for (let s = 1; s <= TOTAL; s++) assert.equal(new Set(stageInfo(s).symbols).size, stageInfo(s).pairs);
});

test('cards are shown for 1 s with 6 cards, growing to 3 s with 36', () => {
  assert.equal(previewMs(6), 1000);
  assert.equal(previewMs(36), 3000);
  const steps = [6, 12, 16, 20, 24, 30, 36].map(previewMs);
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i] > steps[i - 1]);
  assert.deepEqual(steps, [1000, 1400, 1700, 1900, 2200, 2600, 3000]);
  assert.equal(stageInfo(1).preview, 1000);
  assert.equal(stageInfo(350).preview, 3000);
});
