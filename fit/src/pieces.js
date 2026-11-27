// The piece set: ten polyominoes from 2 to 5 cells. Shapes are lists of [row, col].
export const PIECES = [
  { id: 'i2', cells: [[0, 0], [0, 1]] },
  { id: 'i3', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'l3', cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'o4', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 't4', cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 's4', cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
  { id: 'l4', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: 'i4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'p5', cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { id: 'u5', cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
];
export const byId = Object.fromEntries(PIECES.map((p) => [p.id, p]));

// Shift a shape so its top-left is at 0,0 and sort its cells, so equal shapes compare equal.
export function normalize(cells) {
  const r0 = Math.min(...cells.map(([r]) => r)), c0 = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

export const rotate = (cells) => normalize(cells.map(([r, c]) => [c, -r])); // 90° clockwise
export const flip = (cells) => normalize(cells.map(([r, c]) => [r, -c])); // mirror left–right

// Every distinct orientation (turns and mirror images) of a shape.
export function orientations(cells) {
  const seen = new Map();
  let shape = normalize(cells);
  for (let m = 0; m < 2; m++) {
    for (let k = 0; k < 4; k++) {
      seen.set(JSON.stringify(shape), shape);
      shape = rotate(shape);
    }
    shape = flip(shape);
  }
  return [...seen.values()];
}
