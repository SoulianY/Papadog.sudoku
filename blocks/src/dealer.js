// Chooses the next tray. Every piece variant is weighted by
//   tier odds (small/medium/large-or-awkward, by score)  ×  e^(help · fit)
// where fit (0..1) says how well the piece suits the board right now: half for
// completing lines, half for how snugly its best spot is enclosed by walls and blocks.
// help starts high and fades with score: early trays match the open space, later ones don't.
import { SIZE, fits, fitsAnywhere, fullLineCells } from './board.js';
import { SHAPES } from './pieces.js';

const TRAY_SIZE = 3;

// [score, easy, medium, hard, help], linearly blended between rows.
const CURVE = [
  [0, 8, 2, 0, 4],
  [150, 6, 3, 1, 3],
  [500, 4, 4, 2, 2],
  [1200, 3, 4, 3, 1],
  [2500, 2, 4, 4, 0],
];
// Below this score every dealt piece fits somewhere; above it, at least one does.
const FRIENDLY_UNTIL = 300;

// Each variant's share of its tier, so a shape with four rotations is not four times as common.
const VARIANTS = SHAPES.flatMap((variants) => {
  const bases = SHAPES.filter((v) => v[0].tier === variants[0].tier).length;
  return variants.map((piece) => ({ piece, share: 1 / bases / variants.length }));
});

export function curveAt(score) {
  const k = CURVE.findIndex(([s]) => s > score);
  if (k === -1) return toCurve(CURVE.at(-1).slice(1));
  const [s0, ...a] = CURVE[k - 1];
  const [s1, ...b] = CURVE[k];
  const t = (score - s0) / (s1 - s0);
  return toCurve(a.map((v, i) => v + (b[i] - v) * t));
}
const toCurve = ([easy, medium, hard, help]) => ({ tiers: [easy, medium, hard], help });

/** Share of the piece's outer edges that touch a wall or a block when placed at (row, col). */
function snugness(board, piece, row, col) {
  const own = new Set(piece.cells.map(([dr, dc]) => (row + dr) * SIZE + col + dc));
  let edges = 0;
  let touching = 0;
  for (const [dr, dc] of piece.cells) {
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = row + dr + a;
      const c = col + dc + b;
      const inside = r >= 0 && r < SIZE && c >= 0 && c < SIZE;
      if (inside && own.has(r * SIZE + c)) continue;
      edges++;
      if (!inside || board[r * SIZE + c] !== 0) touching++;
    }
  }
  return touching / edges;
}

/** How well the piece suits the board, 0..1, or -1 if it cannot be placed. */
export function fit(board, piece) {
  let best = -1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!fits(board, piece, r, c)) continue;
      const next = [...board];
      for (const [dr, dc] of piece.cells) next[(r + dr) * SIZE + c + dc] = 1;
      const { lines } = fullLineCells(next);
      best = Math.max(best, Math.min(1, 0.5 * lines + 0.5 * snugness(board, piece, r, c)));
    }
  }
  return best;
}

function weightedIndex(weights, random) {
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  return weights.findIndex((w) => (roll -= w) < 0);
}

/** A fresh tray for this board and score. */
export function newTray(board, score, random = Math.random) {
  const { tiers, help } = curveAt(score);
  const friendly = score < FRIENDLY_UNTIL;
  const fitness = VARIANTS.map(({ piece }) => fit(board, piece));
  let weights = VARIANTS.map(({ piece, share }, i) =>
    friendly && fitness[i] < 0 ? 0 : tiers[piece.tier] * share * Math.exp(help * Math.max(fitness[i], 0)),
  );
  if (weights.every((w) => w === 0)) weights = VARIANTS.map(({ piece, share }) => tiers[piece.tier] * share);

  const draw = () => VARIANTS[weightedIndex(weights, random)].piece;
  let tray;
  for (let attempt = 0; attempt < 20; attempt++) {
    tray = Array.from({ length: TRAY_SIZE }, draw);
    if (tray.some((p) => fitsAnywhere(board, p))) break;
  }
  return tray;
}
