// The seven four-cell pieces. Each is a square matrix so rotation is a plain matrix turn.
const SHAPES = [
  ['....', '####', '....', '....'],
  ['##', '##'],
  ['.#.', '###', '...'],
  ['.##', '##.', '...'],
  ['##.', '.##', '...'],
  ['#..', '###', '...'],
  ['..#', '###', '...'],
];

const cellsOf = (rows) => rows.flatMap((line, r) => [...line].flatMap((ch, c) => (ch === '#' ? [[r, c]] : [])));
const turn = (rows) => rows.map((_, r) => rows.map((line) => line[r]).reverse().join(''));

// PIECES[kind] = { size, rotations: [cells for rotation 0..3] }, cells as [row, col].
export const PIECES = SHAPES.map((shape) => {
  const rotations = [];
  let rows = shape;
  for (let i = 0; i < 4; i++) {
    rotations.push(cellsOf(rows));
    rows = turn(rows);
  }
  return { size: shape.length, rotations };
});

// Shuffled bag of all seven kinds, so droughts and floods of one piece can't happen.
export function bag(random) {
  const kinds = PIECES.map((_, i) => i);
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds;
}
