// Generates levels.json: 500 puzzles whose fewest-moves count climbs from MIN_MOVES to about MAX_MOVES.
//
// Hill climbing over piece layouts: change the layout a little (add, remove, or move one piece),
// measure how hard it is, and keep the change if it is at least as hard. A layout's difficulty is
// found by exploring every position its pieces can reach and taking the position farthest (in moves)
// from any solved one. Every layout met along the way that is hard enough becomes a candidate.
//
// Run: node chulcha/tools/generate-levels.mjs [minutes per worker]
import { writeFileSync } from 'node:fs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { SIZE, EXIT_ROW, GOAL_COL } from '../src/board.js';

const LEVEL_COUNT = 500;
const MIN_MOVES = 15;
const MAX_MOVES = 40;
const MAX_STATES = 120000; // skip layouts whose reachable positions exceed this
const STALL_LIMIT = 300; // restart a climb after this many tries without improvement

if (isMainThread) {
  const minutes = Number(process.argv[2] ?? 20);
  const workers = availableParallelism();
  const results = await Promise.all(Array.from({ length: workers }, (_, w) => new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { seed: 20261118 + w * 7919, minutes, id: w } });
    worker.on('message', (m) => (m.done ? resolve(m.candidates) : console.log(m.log)));
    worker.on('error', reject);
  })));

  const candidates = new Map();
  for (const list of results) for (const c of list) if (!candidates.has(c.key)) candidates.set(c.key, c);
  const byMoves = new Map();
  for (const c of candidates.values()) {
    if (!byMoves.has(c.moves)) byMoves.set(c.moves, []);
    byMoves.get(c.moves).push(c);
  }
  console.log('moves → candidates:', [...byMoves].sort((a, b) => a[0] - b[0]).map(([m, l]) => `${m}:${l.length}`).join(' '));

  // Level i aims at a move count rising evenly from MIN_MOVES to the hardest available (≤ MAX_MOVES).
  // Among candidates at that count, take the one from the climb used least so far, so neighbouring
  // levels don't come from the same lineage of near-identical layouts.
  const top = Math.min(MAX_MOVES, Math.max(...byMoves.keys()));
  const usedPerClimb = new Map();
  const levels = [];
  for (let i = 0; i < LEVEL_COUNT; i++) {
    const want = MIN_MOVES + ((top - MIN_MOVES) * i) / (LEVEL_COUNT - 1);
    const counts = [...byMoves.keys()].filter((m) => byMoves.get(m).length && m <= MAX_MOVES);
    const m = counts.reduce((best, x) => (Math.abs(x - want) < Math.abs(best - want) ? x : best));
    const pool = byMoves.get(m);
    let pick = 0;
    pool.forEach((c, k) => { if ((usedPerClimb.get(c.climb) ?? 0) < (usedPerClimb.get(pool[pick].climb) ?? 0)) pick = k; });
    const [chosen] = pool.splice(pick, 1);
    usedPerClimb.set(chosen.climb, (usedPerClimb.get(chosen.climb) ?? 0) + 1);
    levels.push(chosen);
  }
  levels.sort((a, b) => a.moves - b.moves);
  writeFileSync(new URL('../levels.json', import.meta.url), JSON.stringify(levels.map(({ moves, pieces }) => ({ moves, pieces }))));
  console.log(`wrote ${levels.length} levels, ${levels[0].moves}–${levels.at(-1).moves} moves`);
} else {
  const { seed: initialSeed, minutes, id } = workerData;
  let seed = initialSeed;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const randInt = (n) => Math.floor(rng() * n);

  // Pieces are [row, col, len, vertical(0/1)] placed at their current spot.
  const cellsAt = ([r, c, len, v]) => Array.from({ length: len }, (_, k) => (v ? (r + k) * SIZE + c : r * SIZE + c + k));

  function tryAdd(pieces) {
    const grid = new Uint8Array(SIZE * SIZE);
    for (const p of pieces) for (const cell of cellsAt(p)) grid[cell] = 1;
    for (let tries = 0; tries < 50; tries++) {
      const len = rng() < 0.3 ? 3 : 2;
      const v = rng() < 0.55 ? 1 : 0;
      const r = v ? randInt(SIZE - len + 1) : randInt(SIZE);
      const c = v ? randInt(SIZE) : randInt(SIZE - len + 1);
      if (!v && r === EXIT_ROW) continue;
      const piece = [r, c, len, v];
      if (cellsAt(piece).every((cell) => !grid[cell])) return [...pieces, piece];
    }
    return pieces;
  }

  function mutate(pieces) {
    const roll = rng();
    if ((roll < 0.35 && pieces.length < 14) || pieces.length < 6) return tryAdd(pieces);
    const without = pieces.filter((_, i) => i !== 1 + randInt(pieces.length - 1));
    return roll < 0.55 ? without : tryAdd(without);
  }

  // Positions are encoded as one number: each piece's offset is a base-5 digit.
  const POW = Array.from({ length: 16 }, (_, i) => 5 ** i);

  function hardest(pieces) {
    const n = pieces.length;
    const fixed = pieces.map(([r, c, len, v]) => [v ? c : r, len, v]);
    const decode = (key, out) => { for (let i = 0; i < n; i++) { out[i] = key % 5; key = Math.floor(key / 5); } return out; };
    const offs = new Array(n);
    const grid = new Int8Array(SIZE * SIZE);
    const at = (i, k) => (fixed[i][2] ? k * SIZE + fixed[i][0] : fixed[i][0] * SIZE + k);

    function forEachNeighbour(key, visit) {
      decode(key, offs);
      grid.fill(-1);
      for (let i = 0; i < n; i++) for (let k = 0; k < fixed[i][1]; k++) grid[at(i, offs[i] + k)] = i;
      for (let i = 0; i < n; i++) {
        const len = fixed[i][1], o = offs[i];
        for (let k = o - 1; k >= 0 && grid[at(i, k)] === -1; k--) visit(key + (k - o) * POW[i]);
        for (let k = o + 1; k + len <= SIZE && grid[at(i, k + len - 1)] === -1; k++) visit(key + (k - o) * POW[i]);
      }
    }

    let start = 0;
    pieces.forEach(([r, c, , v], i) => { start += (v ? r : c) * POW[i]; });
    const seen = new Set([start]);
    const stack = [start];
    const solvedKeys = [];
    while (stack.length) {
      const key = stack.pop();
      if (key % 5 === GOAL_COL) solvedKeys.push(key);
      forEachNeighbour(key, (k) => { if (!seen.has(k)) { seen.add(k); stack.push(k); } });
      if (seen.size > MAX_STATES) return null;
    }
    if (!solvedKeys.length) return null;
    const dist = new Set(solvedKeys);
    let frontier = solvedKeys, depth = 0, last = frontier;
    while (frontier.length) {
      const next = [];
      for (const key of frontier) forEachNeighbour(key, (k) => { if (!dist.has(k)) { dist.add(k); next.push(k); } });
      if (next.length) { depth++; last = next; }
      frontier = next;
    }
    decode(last[randInt(last.length)], offs);
    const placed = pieces.map(([r, c, len, v], i) => (v ? [offs[i], c, len, 1] : [r, offs[i], len, 0]));
    return { moves: depth, pieces: placed };
  }

  const keyOf = (pieces) => JSON.stringify([pieces[0], ...pieces.slice(1).sort()]);
  const candidates = new Map();
  const deadline = Date.now() + minutes * 60000;
  let climb = 0, best = 0, lastLog = Date.now();
  while (Date.now() < deadline) {
    climb++;
    let current = null;
    while (!current) {
      let start = [[EXIT_ROW, randInt(SIZE - 2), 2, 0]];
      for (let k = 0; k < 6 + randInt(5); k++) start = tryAdd(start);
      current = hardest(start);
    }
    for (let stall = 0; stall < STALL_LIMIT && Date.now() < deadline;) {
      const next = hardest(mutate(current.pieces));
      if (!next) { stall++; continue; }
      if (next.moves >= MIN_MOVES) {
        const key = keyOf(next.pieces);
        if (!candidates.has(key)) candidates.set(key, { key, moves: next.moves, pieces: next.pieces, climb: `${id}-${climb}` });
      }
      if (next.moves > current.moves) stall = 0; else stall++;
      if (next.moves >= current.moves) current = next;
      best = Math.max(best, current.moves);
    }
    if (Date.now() - lastLog > 60000) {
      lastLog = Date.now();
      parentPort.postMessage({ log: `worker ${id}: ${climb} climbs, ${candidates.size} candidates, best ${best}` });
    }
  }
  parentPort.postMessage({ done: true, candidates: [...candidates.values()] });
}
