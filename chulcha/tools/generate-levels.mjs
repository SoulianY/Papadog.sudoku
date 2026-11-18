// Generates levels.json: 500 puzzles ordered from easy to hard by fewest moves.
// Each candidate comes from a random set of pieces: explore every position those pieces can reach,
// measure each position's distance from the nearest solved one, and keep the farthest position.
// Run: node chulcha/tools/generate-levels.mjs
import { writeFileSync } from 'node:fs';
import { SIZE, EXIT_ROW, startOffsets, occupancy, solved } from '../src/board.js';
import { neighbours } from '../src/solver.js';

const LEVEL_COUNT = 500;
const ATTEMPTS = Number(process.argv[2] ?? 12000);
const SEED = 20261118;
const MAX_STATES = 20000; // larger state spaces are slow to explore and skipped

let seed = SEED;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const randInt = (n) => Math.floor(rng() * n);

function randomPieces() {
  const pieces = [[EXIT_ROW, randInt(SIZE - 2), 2, false]];
  const target = 7 + randInt(7);
  for (let tries = 0; pieces.length < target && tries < 200; tries++) {
    const len = rng() < 0.25 ? 3 : 2;
    const vertical = rng() < 0.55;
    const r = vertical ? randInt(SIZE - len + 1) : randInt(SIZE);
    const c = vertical ? randInt(SIZE) : randInt(SIZE - len + 1);
    if (!vertical && r === EXIT_ROW) continue; // would block the exit row for good
    const piece = [r, c, len, vertical];
    const grid = occupancy(pieces, startOffsets(pieces));
    const cells = vertical ? Array.from({ length: len }, (_, k) => (r + k) * SIZE + c) : Array.from({ length: len }, (_, k) => r * SIZE + c + k);
    if (cells.every((cell) => grid[cell] === -1)) pieces.push(piece);
  }
  return pieces;
}

// Hardest position reachable from the start, with its fewest-moves distance.
function hardest(pieces) {
  const start = startOffsets(pieces);
  const key = (o) => o.join('');
  const all = new Map([[key(start), start]]);
  const queue = [start];
  while (queue.length) {
    for (const n of neighbours(pieces, queue.pop())) {
      const k = key(n);
      if (!all.has(k)) { all.set(k, n); queue.push(n); }
    }
    if (all.size > MAX_STATES) return null;
  }
  const dist = new Map();
  let frontier = [...all.values()].filter(solved);
  if (!frontier.length) return null;
  for (const p of frontier) dist.set(key(p), 0);
  let depth = 0, last = frontier;
  while (frontier.length) {
    last = frontier;
    const next = [];
    for (const p of frontier) {
      for (const n of neighbours(pieces, p)) {
        const k = key(n);
        if (!dist.has(k)) { dist.set(k, depth + 1); next.push(n); }
      }
    }
    if (next.length) depth++;
    frontier = next;
  }
  const offsets = last[randInt(last.length)];
  return { moves: depth, offsets };
}

const candidates = new Map();
for (let a = 0; a < ATTEMPTS; a++) {
  const pieces = randomPieces();
  const result = hardest(pieces);
  if (!result || result.moves < 2) continue;
  const placed = pieces.map(([r, c, len, v], i) => (v ? [result.offsets[i], c, len, 1] : [r, result.offsets[i], len, 0]));
  const k = JSON.stringify([placed[0], ...placed.slice(1).sort()]);
  if (!candidates.has(k)) candidates.set(k, { moves: result.moves, pieces: placed });
  if ((a + 1) % 1000 === 0) console.log(`${a + 1}/${ATTEMPTS} attempts, ${candidates.size} candidates`);
}

const byMoves = new Map();
for (const c of candidates.values()) {
  if (!byMoves.has(c.moves)) byMoves.set(c.moves, []);
  byMoves.get(c.moves).push(c);
}
console.log('moves → candidates:', [...byMoves].sort((a, b) => a[0] - b[0]).map(([m, l]) => `${m}:${l.length}`).join(' '));

if (process.argv[3] !== 'stats') {
  // Spread the 500 levels across the difficulty range: raise a per-move-count quota until the
  // total reaches 500 (rare hard counts give all they have), trimming any excess from the easy end.
  const moves = [...byMoves.keys()].sort((a, b) => a - b);
  const pool = (m) => byMoves.get(m);
  const total = (q) => moves.reduce((sum, m) => sum + Math.min(pool(m).length, q), 0);
  let quota = 0;
  while (total(quota) < LEVEL_COUNT) quota++;
  let excess = total(quota) - LEVEL_COUNT;
  const levels = [];
  for (const m of moves) {
    let take = Math.min(pool(m).length, quota);
    if (excess > 0 && take === quota) { take--; excess--; }
    levels.push(...pool(m).slice(0, take));
  }
  levels.sort((a, b) => a.moves - b.moves);
  writeFileSync(new URL('../levels.json', import.meta.url), JSON.stringify(levels.map((l) => ({ moves: l.moves, pieces: l.pieces }))));
  console.log(`wrote ${levels.length} levels, ${levels[0].moves}–${levels.at(-1).moves} moves`);
}
