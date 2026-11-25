// Tower of Hanoi with three pegs. A position lists, for each disk from smallest (0) to largest,
// the peg it sits on; within a peg the disks are always stacked largest at the bottom.
export const PEGS = 3;

export const topOf = (pos, peg) => pos.findIndex((p) => p === peg); // smallest disk on the peg, or -1

export function canMove(pos, from, to) {
  const disk = topOf(pos, from);
  if (disk === -1 || from === to) return false;
  const under = topOf(pos, to);
  return under === -1 || disk < under;
}

export function move(pos, from, to) {
  const next = pos.slice();
  next[topOf(pos, from)] = to;
  return next;
}

export const same = (a, b) => a.every((p, i) => p === b[i]);

// Fewest moves from every position to `target`, as a map from position key to distance.
// Moves are reversible, so a search outward from the target gives every position's distance to it.
export function distancesTo(target) {
  const key = (pos) => pos.join('');
  const dist = new Map([[key(target), 0]]);
  let frontier = [target];
  for (let d = 1; frontier.length; d++) {
    const next = [];
    for (const pos of frontier) {
      for (let from = 0; from < PEGS; from++) {
        for (let to = 0; to < PEGS; to++) {
          if (!canMove(pos, from, to)) continue;
          const n = move(pos, from, to);
          if (!dist.has(key(n))) { dist.set(key(n), d); next.push(n); }
        }
      }
    }
    frontier = next;
  }
  return dist;
}
