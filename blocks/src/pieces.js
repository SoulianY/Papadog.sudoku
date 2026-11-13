// Piece shapes. Each base shape appears in every distinct rotation.

const BASES = [
  '#',
  '##',
  '###',
  '####',
  '#####',
  '##\n##',
  '###\n###\n###',
  '##\n##\n##',
  '##\n#.',
  '#..\n###',
  '..#\n###',
  '###\n.#.',
  '##.\n.##',
  '.##\n##.',
  '###\n#..\n#..',
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

/** Every piece variant: { cells: [[row, col], ...], color: 1..n }. */
export const SHAPES = BASES.map((base, i) => rotations(parse(base)).map((cells) => ({ cells, color: (i % 7) + 1 })));

export function randomPiece(random = Math.random) {
  const variants = SHAPES[Math.floor(random() * SHAPES.length)];
  return variants[Math.floor(random() * variants.length)];
}
