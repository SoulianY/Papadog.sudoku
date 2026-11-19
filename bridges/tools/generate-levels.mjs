// Generates levels.json: 300 bridge puzzles with exactly one solution, 75 per board size 7×7–10×10,
// island count growing within each size.
// A solution is grown first (each new island branches straight off an existing one and is joined to it),
// a few extra bridges close loops, the numbers are read off, and the layout is kept only if the solver
// finds a single solution.
// Run: node bridges/tools/generate-levels.mjs
import { writeFileSync } from 'node:fs';
import { countSolutions } from '../src/solver.js';

const PER_SIZE = 75;
const SIZES = [
  { size: 7, islands: [9, 15] },
  { size: 8, islands: [12, 20] },
  { size: 9, islands: [16, 26] },
  { size: 10, islands: [20, 32] },
];
let seed = 20261119;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const randInt = (n) => Math.floor(rng() * n);
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

function grow(size, target) {
  const grid = new Int8Array(size * size).fill(0); // 0 empty, 1 island, 2 horizontal bridge, 3 vertical bridge
  const islands = [[randInt(size), randInt(size)]];
  grid[islands[0][0] * size + islands[0][1]] = 1;
  const bridges = new Map(); // "a-b" → count
  const isIsland = (r, c) => r >= 0 && c >= 0 && r < size && c < size && grid[r * size + c] === 1;
  for (let tries = 0; islands.length < target && tries < target * 60; tries++) {
    const from = randInt(islands.length);
    const [r0, c0] = islands[from];
    const [dr, dc] = DIRS[randInt(4)];
    const dist = 2 + randInt(Math.max(1, Math.floor(size / 2)));
    const r = r0 + dr * dist, c = c0 + dc * dist;
    if (r < 0 || c < 0 || r >= size || c >= size || grid[r * size + c] !== 0) continue;
    // The path must be clear, and the new island may not touch another island side by side.
    let clear = true;
    for (let k = 1; k < dist; k++) if (grid[(r0 + dr * k) * size + (c0 + dc * k)] !== 0) clear = false;
    if (!clear || DIRS.some(([a, b]) => isIsland(r + a, c + b))) continue;
    const to = islands.length;
    islands.push([r, c]);
    grid[r * size + c] = 1;
    for (let k = 1; k < dist; k++) grid[(r0 + dr * k) * size + (c0 + dc * k)] = dr ? 3 : 2;
    bridges.set(`${Math.min(from, to)}-${Math.max(from, to)}`, rng() < 0.4 ? 2 : 1);
  }
  if (islands.length < target) return null;
  return { grid, islands, bridges };
}

// Extra single bridges between straight-line neighbours whose path is still free close loops.
function closeLoops({ grid, islands, bridges }, size) {
  islands.forEach(([r0, c0], a) => {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      let k = 1;
      while (r0 + dr * k < size && c0 + dc * k < size && grid[(r0 + dr * k) * size + (c0 + dc * k)] === 0) k++;
      const r = r0 + dr * k, c = c0 + dc * k;
      if (r >= size || c >= size || grid[r * size + c] !== 1 || k < 2 || rng() > 0.35) continue;
      const b = islands.findIndex(([x, y]) => x === r && y === c);
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (bridges.has(key)) continue;
      for (let j = 1; j < k; j++) grid[(r0 + dr * j) * size + (c0 + dc * j)] = dr ? 3 : 2;
      bridges.set(key, 1);
    }
  });
}

function makeLevel(size, target) {
  for (;;) {
    const grown = grow(size, target);
    if (!grown) continue;
    closeLoops(grown, size);
    const deg = new Array(grown.islands.length).fill(0);
    for (const [key, count] of grown.bridges) {
      const [a, b] = key.split('-').map(Number);
      deg[a] += count;
      deg[b] += count;
    }
    const islands = grown.islands.map(([r, c], i) => [r, c, deg[i]]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    if (countSolutions(islands) === 1) return { size, islands };
  }
}

const levels = [];
const t0 = Date.now();
for (const { size, islands: [lo, hi] } of SIZES) {
  for (let s = 0; s < PER_SIZE; s++) {
    levels.push(makeLevel(size, Math.round(lo + ((hi - lo) * s) / (PER_SIZE - 1))));
  }
  console.log(`${size}×${size} done, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
writeFileSync(new URL('../levels.json', import.meta.url), JSON.stringify(levels));
console.log(`wrote ${levels.length} levels`);
