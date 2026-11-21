// Board geometry for a sudoku of boxRows × boxCols boxes (6×6 uses 2×3, 9×9 uses 3×3).
// Cells are indexed row by row.

export function makeShape(boxRows, boxCols) {
  const size = boxRows * boxCols;
  const count = size * size;
  const row = (i) => Math.floor(i / size);
  const col = (i) => i % size;
  const box = (i) => Math.floor(row(i) / boxRows) * boxRows + Math.floor(col(i) / boxCols);
  const cells = [...Array(count).keys()];
  const peers = cells.map((i) => cells.filter((j) => j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))));
  const units = [
    ...Array.from({ length: size }, (_, k) => cells.filter((i) => row(i) === k)),
    ...Array.from({ length: size }, (_, k) => cells.filter((i) => col(i) === k)),
    ...Array.from({ length: size }, (_, k) => cells.filter((i) => box(i) === k)),
  ];
  return { boxRows, boxCols, size, count, row, col, box, peers, units };
}

export const parse = (s) => Array.from(s, Number);
