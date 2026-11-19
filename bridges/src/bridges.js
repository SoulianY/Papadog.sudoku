// Board model. A level is { size, islands: [[row, col, number], ...] }.
// Bridges may only join an island to its nearest island straight right or straight down, so the
// possible bridges ("edges") follow from where the islands are.

export function buildEdges(islands) {
  const at = new Map(islands.map(([r, c], i) => [`${r},${c}`, i]));
  const size = Math.max(...islands.flatMap(([r, c]) => [r, c])) + 1;
  const edges = [];
  islands.forEach(([r, c], a) => {
    for (let k = c + 1; k < size; k++) {
      const b = at.get(`${r},${k}`);
      if (b !== undefined) { edges.push({ a, b, horizontal: true, line: r, from: c, to: k }); break; }
    }
    for (let k = r + 1; k < size; k++) {
      const b = at.get(`${k},${c}`);
      if (b !== undefined) { edges.push({ a, b, horizontal: false, line: c, from: r, to: k }); break; }
    }
  });
  edges.forEach((e) => {
    e.crosses = [];
    edges.forEach((f, j) => {
      if (e.horizontal !== f.horizontal && f.line > e.from && f.line < e.to && e.line > f.from && e.line < f.to) e.crosses.push(j);
    });
  });
  return edges;
}

export function degrees(islands, edges, counts) {
  const deg = new Array(islands.length).fill(0);
  edges.forEach((e, i) => { deg[e.a] += counts[i]; deg[e.b] += counts[i]; });
  return deg;
}

export function connected(islands, edges, counts) {
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const i = stack.pop();
    edges.forEach((e, k) => {
      if (!counts[k]) return;
      const other = e.a === i ? e.b : e.b === i ? e.a : -1;
      if (other !== -1 && !seen.has(other)) { seen.add(other); stack.push(other); }
    });
  }
  return seen.size === islands.length;
}

export function solved(islands, edges, counts) {
  const deg = degrees(islands, edges, counts);
  return islands.every(([, , n], i) => deg[i] === n) && connected(islands, edges, counts);
}

// True if a bridge may be added on edge k (nothing crossing it already has a bridge).
export const blocked = (edges, counts, k) => edges[k].crosses.some((j) => counts[j] > 0);
