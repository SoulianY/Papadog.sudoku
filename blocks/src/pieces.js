// Piece shapes by tier. Each base shape appears in every distinct rotation.
// Tier 0 = easy (small, fits almost anywhere), 1 = medium, 2 = hard (big or awkward).

const BASES = [
  ['#', 0],
  ['##', 0],
  ['###', 0],
  ['##\n##', 0],
  ['##\n#.', 0],
  ['####', 1],
  ['#..\n###', 1],
  ['..#\n###', 1],
  ['###\n.#.', 1],
  ['##\n##\n##', 1],
  ['#####', 2],
  ['##.\n.##', 2],
  ['.##\n##.', 2],
  ['###\n#..\n#..', 2],
  ['###\n###\n###', 2],
];

const parse = (shape) =>
  shape.split('\n').flatMap((line, r) => [...line].flatMap((ch, c) => (ch === '#' ? [[r, c]] : [])));

const normalize = (cells) => {
  const r0 = Math.min(...cells.map(([r]) => r));
  const c0 = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

const rotate = (cells) => normalize(cells.map(([r, c]) => [c, -r]));

function rotations(cells) {
  const seen = new Map();
  let current = normalize(cells);
  for (let k = 0; k < 4; k++) {
    seen.set(JSON.stringify(current), current);
    current = rotate(current);
  }
  return [...seen.values()];
}

/** Every piece variant per base shape: { cells: [[row, col], ...], color: 1..7, tier }. */
export const SHAPES = BASES.map(([base, tier], i) =>
  rotations(parse(base)).map((cells) => ({ cells, color: (i % 7) + 1, tier })),
);

const pick = (list, random) => list[Math.floor(random() * list.length)];

/** A random piece; tierWeights[t] is the relative chance of a tier-t shape. */
export function randomPiece(tierWeights, random = Math.random) {
  let roll = random() * tierWeights.reduce((a, b) => a + b, 0);
  const tier = tierWeights.findIndex((w) => (roll -= w) < 0);
  return pick(pick(SHAPES.filter((v) => v[0].tier === tier), random), random);
}
