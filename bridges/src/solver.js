// Counts solutions (stopping at `limit`) by settling one island at a time: the island with the
// fewest ways to spread its remaining bridges over its still-open edges.
import { buildEdges } from './bridges.js';

// onSolution, if given, receives the bridge count per edge (in buildEdges order) for each solution.
export function countSolutions(islands, { limit = 2, nodeLimit = 300000, onSolution } = {}) {
  const edges = buildEdges(islands);
  const n = islands.length;
  const val = new Int8Array(edges.length).fill(-1);
  const need = islands.map(([, , k]) => k);
  const touching = islands.map((_, i) => edges.map((e, k) => (e.a === i || e.b === i ? k : -1)).filter((k) => k !== -1));
  let found = 0, nodes = 0, aborted = false;

  const open = (k) => val[k] === -1 && need[edges[k].a] > 0 && need[edges[k].b] > 0 && !edges[k].crosses.some((j) => val[j] > 0);
  const cap = (k) => Math.min(2, need[edges[k].a], need[edges[k].b]);

  function ways(caps, target) {
    let count = 0;
    const walk = (i, left) => {
      if (i === caps.length) { if (left === 0) count++; return; }
      for (let v = 0; v <= Math.min(caps[i], left); v++) walk(i + 1, left - v);
    };
    walk(0, target);
    return count;
  }

  // A group of islands joined by bridges that needs nothing more can never reach the others.
  function strandedGroup() {
    const group = new Int16Array(n).fill(-1);
    for (let s = 0; s < n; s++) {
      if (group[s] !== -1) continue;
      const members = [s];
      group[s] = s;
      for (let q = 0; q < members.length; q++) {
        for (const k of touching[members[q]]) {
          if (val[k] > 0) {
            const o = edges[k].a === members[q] ? edges[k].b : edges[k].a;
            if (group[o] === -1) { group[o] = s; members.push(o); }
          }
        }
      }
      if (members.length < n && members.every((i) => need[i] === 0)) return true;
    }
    return false;
  }

  function search() {
    if (found >= limit) return;
    if (++nodes > nodeLimit) { aborted = true; return; }
    if (strandedGroup()) return;
    let pick = -1, pickEdges = null, pickCaps = null, pickWays = Infinity;
    for (let i = 0; i < n; i++) {
      if (need[i] === 0) continue;
      const ks = touching[i].filter(open);
      const caps = ks.map(cap);
      const w = ways(caps, need[i]);
      if (w === 0) return;
      if (w < pickWays) { pick = i; pickEdges = ks; pickCaps = caps; pickWays = w; }
    }
    if (pick === -1) {
      found++;
      onSolution?.(Array.from(val, (v) => Math.max(v, 0)));
      return;
    }
    const assign = (j, left) => {
      if (found >= limit || aborted) return;
      if (j === pickEdges.length) {
        if (left === 0) search();
        return;
      }
      const k = pickEdges[j];
      for (let v = 0; v <= Math.min(pickCaps[j], left); v++) {
        if (v > 0 && edges[k].crosses.some((x) => val[x] > 0)) break;
        val[k] = v;
        need[edges[k].a] -= v;
        need[edges[k].b] -= v;
        assign(j + 1, left - v);
        need[edges[k].a] += v;
        need[edges[k].b] += v;
        val[k] = -1;
      }
    };
    assign(0, need[pick]);
  }

  search();
  return aborted ? limit : found;
}
