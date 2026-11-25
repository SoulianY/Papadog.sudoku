// Pipes on a square grid. A tile is a 4-bit mask of the sides it opens: N=1, E=2, S=4, W=8.
// Turning a tile clockwise shifts the mask one side round.
export const SIDES = [
  { bit: 1, dr: -1, dc: 0, opposite: 4 },
  { bit: 2, dr: 0, dc: 1, opposite: 8 },
  { bit: 4, dr: 1, dc: 0, opposite: 1 },
  { bit: 8, dr: 0, dc: -1, opposite: 2 },
];

export const turn = (mask, times = 1) => {
  let m = mask;
  for (let k = 0; k < ((times % 4) + 4) % 4; k++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
};

// A spanning tree of the grid drawn uniformly at random (Wilson's algorithm), as tile masks.
export function randomTree(size, random) {
  const n = size * size;
  const masks = new Array(n).fill(0);
  const inTree = new Array(n).fill(false);
  const next = new Array(n).fill(-1);
  const neighbour = (i, s) => {
    const r = Math.floor(i / size) + s.dr, c = (i % size) + s.dc;
    return r < 0 || c < 0 || r >= size || c >= size ? -1 : r * size + c;
  };
  inTree[Math.floor(random() * n)] = true;
  for (let start = 0; start < n; start++) {
    // Random walk from `start` until it hits the tree, remembering only the last exit from each cell.
    for (let i = start; !inTree[i];) {
      let j;
      do { next[i] = Math.floor(random() * 4); j = neighbour(i, SIDES[next[i]]); } while (j === -1);
      i = j;
    }
    for (let i = start; !inTree[i];) {
      const s = SIDES[next[i]];
      const j = neighbour(i, s);
      masks[i] |= s.bit;
      masks[j] |= s.opposite;
      inTree[i] = true;
      i = j;
    }
  }
  return masks;
}

// Cells reached by water from `source`, following sides that both tiles open.
export function watered(masks, size, source) {
  const seen = new Set([source]);
  const stack = [source];
  while (stack.length) {
    const i = stack.pop();
    const r = Math.floor(i / size), c = i % size;
    for (const s of SIDES) {
      if (!(masks[i] & s.bit)) continue;
      const rr = r + s.dr, cc = c + s.dc;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
      const j = rr * size + cc;
      if (masks[j] & s.opposite && !seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return seen;
}

// Solved: no side opens onto the edge or onto a closed neighbour, and water reaches every tile.
export function solved(masks, size, source) {
  for (let i = 0; i < masks.length; i++) {
    const r = Math.floor(i / size), c = i % size;
    for (const s of SIDES) {
      if (!(masks[i] & s.bit)) continue;
      const rr = r + s.dr, cc = c + s.dc;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) return false;
      if (!(masks[rr * size + cc] & s.opposite)) return false;
    }
  }
  return watered(masks, size, source).size === masks.length;
}
