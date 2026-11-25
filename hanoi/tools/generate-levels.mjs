// Generates levels.json: 500 puzzles, each a start and a target arrangement of the same disks.
// Disk count and fewest-moves distance both grow through the list.
// Run: node hanoi/tools/generate-levels.mjs
import { writeFileSync } from 'node:fs';
import { PEGS, distancesTo } from '../src/hanoi.js';

// [disks, levels, fewest moves at the first level of the block, at the last]
const BLOCKS = [
  [3, 60, 2, 7],
  [4, 80, 5, 15],
  [5, 100, 10, 31],
  [6, 120, 18, 55],
  [7, 140, 30, 90],
];

let seed = 20261125;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const randInt = (n) => Math.floor(rng() * n);
const randomPos = (disks) => Array.from({ length: disks }, () => randInt(PEGS));

const levels = [];
const seen = new Set();
for (const [disks, count, lo, hi] of BLOCKS) {
  for (let k = 0; k < count; k++) {
    const want = Math.round(lo + ((hi - lo) * k) / (count - 1));
    for (;;) {
      const target = randomPos(disks);
      const dist = distancesTo(target);
      const starts = [...dist].filter(([, d]) => d === want).map(([key]) => key);
      if (!starts.length) continue;
      const start = starts[randInt(starts.length)];
      const id = `${start}>${target.join('')}`;
      if (seen.has(id)) continue;
      seen.add(id);
      levels.push({ start: Array.from(start, Number), target, moves: want });
      break;
    }
  }
}
writeFileSync(new URL('../levels.json', import.meta.url), JSON.stringify(levels));
console.log(`wrote ${levels.length} levels, ${levels[0].moves}–${levels.at(-1).moves} moves`);
