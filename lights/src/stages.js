// 300 stages: 60 per board size from 4×4 to 8×8. Within a size, the number of random presses used
// to scramble the board grows from `size` to 40% of the cells. Boards are built from the stage
// number alone, so every device gets the same puzzle.
import { press, allOff } from './lights.js';

export const PER_SIZE = 60;
export const MIN_SIZE = 4;
export const MAX_SIZE = 8;
export const TOTAL = PER_SIZE * (MAX_SIZE - MIN_SIZE + 1);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stageInfo(stage) {
  const size = MIN_SIZE + Math.floor((stage - 1) / PER_SIZE);
  const step = (stage - 1) % PER_SIZE;
  const most = Math.round(size * size * 0.4);
  return { size, presses: Math.round(size + ((most - size) * step) / (PER_SIZE - 1)) };
}

export function stageBoard(stage) {
  const { size, presses } = stageInfo(stage);
  for (let attempt = 0; ; attempt++) {
    const random = mulberry32(stage * 7919 + attempt);
    const cells = new Array(size * size).fill(0);
    const order = [...cells.keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const i of order.slice(0, presses)) press(cells, size, i);
    if (!allOff(cells)) return { size, cells };
  }
}
