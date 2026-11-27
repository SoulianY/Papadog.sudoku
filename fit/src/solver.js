// Exact cover of a board by a given list of pieces (each used once, any orientation).
// Fills the first empty board cell each step, which keeps the search small.
import { byId, orientations } from './pieces.js';

// board: array of "r,c" keys. Returns [{ id, cells: [[r, c], ...] }] or null.
export function tile(board, ids) {
  const free = new Set(board);
  const order = [...board].sort((a, b) => { const [ar, ac] = a.split(',').map(Number), [br, bc] = b.split(',').map(Number); return ar - br || ac - bc; });
  const shapes = ids.map((id) => orientations(byId[id].cells));
  const used = new Array(ids.length).fill(false);
  const placed = [];
  const area = ids.reduce((s, id) => s + byId[id].cells.length, 0);
  if (area !== board.length) return null;

  function search() {
    const first = order.find((k) => free.has(k));
    if (!first) return true;
    const [fr, fc] = first.split(',').map(Number);
    for (let p = 0; p < ids.length; p++) {
      if (used[p]) continue;
      for (const shape of shapes[p]) {
        // The first empty cell must be the shape's first cell (top-most, then left-most).
        const [ar, ac] = shape[0];
        const cells = shape.map(([r, c]) => [r - ar + fr, c - ac + fc]);
        const keys = cells.map(([r, c]) => `${r},${c}`);
        if (!keys.every((k) => free.has(k))) continue;
        keys.forEach((k) => free.delete(k));
        used[p] = true;
        placed.push({ id: ids[p], cells });
        if (search()) return true;
        placed.pop();
        used[p] = false;
        keys.forEach((k) => free.add(k));
      }
    }
    return false;
  }
  return search() ? placed.map((x) => ({ ...x })) : null;
}
