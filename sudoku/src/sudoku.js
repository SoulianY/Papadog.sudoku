// Pure board helpers. Cells are indexed 0..80, row-major.

export const row = (i) => Math.floor(i / 9);
export const col = (i) => i % 9;
export const box = (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);

/** Cells sharing a row, column or box with i (excluding i). */
export const PEERS = Array.from({ length: 81 }, (_, i) =>
  Array.from({ length: 81 }, (_, j) => j).filter(
    (j) => j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i)),
  ),
);

export const parse = (s) => Array.from(s, Number);
