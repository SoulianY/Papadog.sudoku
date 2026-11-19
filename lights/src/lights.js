// Rules and solver. A board is an array of 0/1 (1 = light on), row by row.

export function press(cells, size, i) {
  const r = Math.floor(i / size), c = i % size;
  cells[i] ^= 1;
  if (r > 0) cells[i - size] ^= 1;
  if (r < size - 1) cells[i + size] ^= 1;
  if (c > 0) cells[i - 1] ^= 1;
  if (c < size - 1) cells[i + 1] ^= 1;
}

export const allOff = (cells) => cells.every((v) => v === 0);

// Fewest presses that turn every light off, as cell indices. Pressing twice cancels out, so a
// solution is a set of cells: solve A·x = b over GF(2) where column j of A is what pressing j toggles.
// Boards with several solutions (4×4, 5×5) are searched over the free variables for the smallest.
export function solve(cells, size) {
  const n = size * size;
  const rows = Array.from({ length: n }, (_, i) => {
    const row = new Uint8Array(n + 1);
    const effect = new Array(n).fill(0);
    press(effect, size, i); // press is symmetric: cell i is toggled by exactly the presses that toggle from i
    effect.forEach((v, j) => { row[j] = v; });
    row[n] = cells[i];
    return row;
  });
  const pivotCol = [];
  let r = 0;
  for (let col = 0; col < n && r < n; col++) {
    const p = rows.findIndex((row, k) => k >= r && row[col]);
    if (p === -1) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    for (let k = 0; k < n; k++) {
      if (k !== r && rows[k][col]) for (let j = col; j <= n; j++) rows[k][j] ^= rows[r][j];
    }
    pivotCol.push(col);
    r++;
  }
  if (rows.slice(r).some((row) => row[n])) return null; // unsolvable
  const free = [...Array(n).keys()].filter((c) => !pivotCol.includes(c));
  let best = null;
  for (let mask = 0; mask < 1 << free.length; mask++) {
    const x = new Uint8Array(n);
    free.forEach((c, k) => { x[c] = (mask >> k) & 1; });
    pivotCol.forEach((col, k) => {
      let v = rows[k][n];
      for (const c of free) if (rows[k][c] && x[c]) v ^= 1;
      x[col] = v;
    });
    const presses = [...x.keys()].filter((i) => x[i]);
    if (!best || presses.length < best.length) best = presses;
  }
  return best;
}
