// Breadth-first search over positions; a move slides one piece any distance.
import { occupancy, slideRange, solved } from './board.js';

const keyOf = (offsets) => offsets.join('');

export function neighbours(pieces, offsets) {
  const grid = occupancy(pieces, offsets);
  const out = [];
  pieces.forEach((_, i) => {
    const [lo, hi] = slideRange(pieces, offsets, i, grid);
    for (let o = lo; o <= hi; o++) {
      if (o === offsets[i]) continue;
      const next = offsets.slice();
      next[i] = o;
      out.push(next);
    }
  });
  return out;
}

// Fewest moves to solve, or -1 if unsolvable.
export function minMoves(pieces, offsets) {
  const seen = new Set([keyOf(offsets)]);
  let frontier = [offsets];
  for (let depth = 0; frontier.length; depth++) {
    const next = [];
    for (const pos of frontier) {
      if (solved(pos)) return depth;
      for (const n of neighbours(pieces, pos)) {
        const k = keyOf(n);
        if (!seen.has(k)) { seen.add(k); next.push(n); }
      }
    }
    frontier = next;
  }
  return -1;
}
