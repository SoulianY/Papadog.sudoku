// 500 stages; the board grows from 4×4 to 10×10. Each board comes from its stage number alone,
// so every device gets the same puzzle.
import { randomTree, turn, solved } from './pipes.js';

// [size, stages]
const BLOCKS = [[4, 40], [5, 60], [6, 70], [7, 80], [8, 80], [9, 90], [10, 80]];
export const TOTAL = BLOCKS.reduce((sum, [, n]) => sum + n, 0);
export const SIZES = BLOCKS.map(([size, count], k) => ({ size, from: BLOCKS.slice(0, k).reduce((s, [, n]) => s + n, 0) + 1, count }));

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sizeOf = (stage) => SIZES.find(({ from, count }) => stage < from + count).size;

// { size, source, solution: masks, turns: how far each tile is turned from its solution }
export function stageBoard(stage) {
  const size = sizeOf(stage);
  const source = Math.floor(size / 2) * size + Math.floor(size / 2);
  for (let attempt = 0; ; attempt++) {
    const random = mulberry32(stage * 104729 + attempt);
    const solution = randomTree(size, random);
    const turns = solution.map(() => Math.floor(random() * 4));
    if (!solved(solution.map((m, i) => turn(m, turns[i])), size, source)) return { size, source, solution, turns };
  }
}
