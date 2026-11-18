// Canvas drawing for the field and the small hold/next previews.
import { PIECES } from './pieces.js';
import { COLS, ROWS, HIDDEN, pieceCells, dropDistance } from './engine.js';

let palette = [];
let well = '';
let grid = '';

export function readColors() {
  const css = getComputedStyle(document.documentElement);
  palette = PIECES.map((_, i) => css.getPropertyValue(`--c${i + 1}`).trim());
  well = css.getPropertyValue('--well').trim();
  grid = css.getPropertyValue('--grid').trim();
}

// Matches the canvas backing store to its CSS size at device pixel ratio; returns CSS size.
function fit(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function block(ctx, x, y, size, color, alpha = 1) {
  const inset = size * 0.06;
  const r = size * 0.2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, r);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.roundRect(x + inset * 2, y + inset * 2, size - inset * 4, (size - inset * 4) * 0.35, r * 0.6);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawField(canvas, s) {
  const { ctx, width, height } = fit(canvas);
  const size = width / COLS;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = well;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, size * 0.3);
  ctx.fill();

  ctx.fillStyle = grid;
  for (let r = 1; r < ROWS; r++) {
    for (let c = 1; c < COLS; c++) ctx.fillRect(c * size - 1, r * size - 1, 2, 2);
  }

  for (let r = HIDDEN; r < ROWS + HIDDEN; r++) {
    for (let c = 0; c < COLS; c++) {
      const kind = s.board[r * COLS + c];
      if (kind !== -1) block(ctx, c * size, (r - HIDDEN) * size, size, palette[kind]);
    }
  }
  if (s.over) return;

  const color = palette[s.piece.kind];
  const ghost = dropDistance(s);
  for (const [r, c] of pieceCells(s.piece)) {
    if (r + ghost >= HIDDEN) block(ctx, c * size, (r + ghost - HIDDEN) * size, size, color, 0.22);
  }
  for (const [r, c] of pieceCells(s.piece)) {
    if (r >= HIDDEN) block(ctx, c * size, (r - HIDDEN) * size, size, color);
  }
}

// Draws pieces in a row (or a column if the canvas is taller than wide), each centred in its slot.
export function drawPreview(canvas, kinds, dim = false) {
  const { ctx, width, height } = fit(canvas);
  ctx.clearRect(0, 0, width, height);
  const across = width >= height;
  const slotW = across ? width / kinds.length : width;
  const slotH = across ? height : height / kinds.length;
  const size = Math.min(slotW / 4.4, slotH / 2.4);
  kinds.forEach((kind, i) => {
    if (kind === -1) return;
    const cells = PIECES[kind].rotations[0];
    const rows = cells.map(([r]) => r), cols = cells.map(([, c]) => c);
    const w = (Math.max(...cols) - Math.min(...cols) + 1) * size;
    const h = (Math.max(...rows) - Math.min(...rows) + 1) * size;
    const ox = (across ? i * slotW : 0) + (slotW - w) / 2 - Math.min(...cols) * size;
    const oy = (across ? 0 : i * slotH) + (slotH - h) / 2 - Math.min(...rows) * size;
    for (const [r, c] of cells) block(ctx, ox + c * size, oy + r * size, size, palette[kind], dim ? 0.35 : 1);
  });
}
