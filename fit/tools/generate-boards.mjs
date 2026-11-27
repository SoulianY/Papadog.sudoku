// Generates boards.json: board cards for each mode. A card is a board shape plus six piece sets
// (one per die face), each a different combination of pieces that fills the board exactly.
// A board is grown by joining randomly turned pieces edge to edge; the other five sets are found
// by trying every combination of the same size and keeping those the solver can fit.
// Cells in the file are row × 10 + column.
// Run: node fit/tools/generate-boards.mjs
import { writeFileSync } from 'node:fs';
import { PIECES, byId, orientations } from '../src/pieces.js';
import { tile } from '../src/solver.js';

// minHard: every die face uses at least this many of the irregular five-cell pieces.
const MODES = { easy: { pieces: 3, cards: 100, maxW: 5, maxH: 4, minHard: 1 }, hard: { pieces: 4, cards: 200, maxW: 6, maxH: 5, minHard: 2 } };
let seed = 20261127;
const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const randInt = (n) => Math.floor(rng() * n);
const pick = (a) => a[randInt(a.length)];

function combinations(items, k, start = 0, acc = [], out = []) {
  if (acc.length === k) { out.push(acc.slice()); return out; }
  for (let i = start; i < items.length; i++) { acc.push(items[i]); combinations(items, k, i + 1, acc, out); acc.pop(); }
  return out;
}

// Joins the pieces edge to edge at random; returns the board's cell keys or null.
function grow(ids, maxW, maxH) {
  const cells = new Set();
  for (const [n, id] of ids.entries()) {
    const shape = pick(orientations(byId[id].cells));
    let placedOk = false;
    for (let tries = 0; tries < 60 && !placedOk; tries++) {
      let dr = 0, dc = 0;
      if (n > 0) {
        const [r, c] = pick([...cells]).split(',').map(Number);
        const [sr, sc] = pick(shape);
        const [nr, nc] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        dr = r + nr - sr; dc = c + nc - sc;
      }
      const keys = shape.map(([r, c]) => `${r + dr},${c + dc}`);
      if (keys.some((k) => cells.has(k))) continue;
      const all = [...cells, ...keys].map((k) => k.split(',').map(Number));
      const h = Math.max(...all.map(([r]) => r)) - Math.min(...all.map(([r]) => r)) + 1;
      const w = Math.max(...all.map(([, c]) => c)) - Math.min(...all.map(([, c]) => c)) + 1;
      if (w > maxW || h > maxH) continue;
      keys.forEach((k) => cells.add(k));
      placedOk = true;
    }
    if (!placedOk) return null;
  }
  // Shift to 0,0 and reject boards with holes (empty cells the outside can't reach).
  const all = [...cells].map((k) => k.split(',').map(Number));
  const r0 = Math.min(...all.map(([r]) => r)), c0 = Math.min(...all.map(([, c]) => c));
  const board = all.map(([r, c]) => [r - r0, c - c0]);
  const H = Math.max(...board.map(([r]) => r)) + 1, W = Math.max(...board.map(([, c]) => c)) + 1;
  const inBoard = new Set(board.map(([r, c]) => `${r},${c}`));
  const outside = new Set(), stack = [[-1, -1]];
  while (stack.length) {
    const [r, c] = stack.pop();
    const k = `${r},${c}`;
    if (r < -1 || c < -1 || r > H || c > W || outside.has(k) || inBoard.has(k)) continue;
    outside.add(k);
    stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
  }
  if (outside.size + inBoard.size !== (H + 2) * (W + 2)) return null;
  return [...inBoard];
}

const ids = PIECES.map((p) => p.id);
const out = {};
const hardCount = (combo) => combo.filter((id) => byId[id].hard).length;
for (const [mode, { pieces, cards, maxW, maxH, minHard }] of Object.entries(MODES)) {
  const combos = combinations(ids, pieces).filter((c) => hardCount(c) >= minHard);
  const list = [];
  const seen = new Set();
  let tried = 0;
  while (list.length < cards) {
    tried++;
    const board = grow(pick(combos), maxW, maxH);
    if (!board) continue;
    const key = board.slice().sort().join(';');
    if (seen.has(key)) continue;
    const area = board.length;
    const sets = [];
    for (const combo of combos) {
      if (combo.reduce((s, id) => s + byId[id].cells.length, 0) !== area) continue;
      const solution = tile(board, combo);
      if (solution) sets.push({ pieces: combo, solution });
    }
    if (sets.length < 6) continue;
    seen.add(key);
    // Six of the fitting sets, chosen at random, become the die faces.
    for (let i = sets.length - 1; i > 0; i--) { const j = randInt(i + 1); [sets[i], sets[j]] = [sets[j], sets[i]]; }
    // Cells are stored as row × 10 + column to keep the file small.
    const pack = ([r, c]) => r * 10 + c;
    list.push({
      board: board.map((k) => pack(k.split(',').map(Number))),
      faces: sets.slice(0, 6).map(({ pieces: p, solution }) => ({ pieces: p, solution: solution.map(({ id, cells }) => ({ id, cells: cells.map(pack) })) })),
    });
  }
  out[mode] = list;
  console.log(`${mode}: ${list.length} cards from ${tried} tries`);
}
writeFileSync(new URL('../boards.json', import.meta.url), JSON.stringify(out));
