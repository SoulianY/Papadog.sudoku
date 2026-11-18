// Game rules. State is a plain object mutated in place by the functions below.
import { PIECES, bag } from './pieces.js';

export const COLS = 10;
export const ROWS = 20;
export const HIDDEN = 2; // rows above the visible field where pieces spawn
const HEIGHT = ROWS + HIDDEN;
const LOCK_MS = 500;
const MAX_LOCK_RESETS = 15;
const LINE_POINTS = [0, 100, 300, 500, 800];
const KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];

export const gravityMs = (level) => Math.max(50, 1000 * 0.8 ** (level - 1));

export function newGame(random = Math.random) {
  const s = {
    random,
    board: new Array(COLS * HEIGHT).fill(-1), // -1 empty, otherwise piece kind
    queue: [],
    hold: -1,
    canHold: true,
    piece: null,
    score: 0,
    lines: 0,
    level: 1,
    over: false,
    fallTimer: 0,
    lockTimer: 0,
    lockResets: 0,
  };
  spawn(s, next(s));
  return s;
}

function next(s) {
  while (s.queue.length < 7) s.queue.push(...bag(s.random));
  return s.queue.shift();
}

export function upcoming(s, n) {
  while (s.queue.length < n) s.queue.push(...bag(s.random));
  return s.queue.slice(0, n);
}

function spawn(s, kind) {
  const { size } = PIECES[kind];
  s.piece = { kind, rot: 0, x: Math.floor((COLS - size) / 2), y: 1 };
  s.fallTimer = 0;
  s.lockTimer = 0;
  s.lockResets = 0;
  if (!fits(s, s.piece)) s.over = true;
}

export function pieceCells(piece) {
  return PIECES[piece.kind].rotations[piece.rot].map(([r, c]) => [piece.y + r, piece.x + c]);
}

function fits(s, piece) {
  return pieceCells(piece).every(([r, c]) => c >= 0 && c < COLS && r < HEIGHT && (r < 0 || s.board[r * COLS + c] === -1));
}

function shift(s, dx, dy) {
  const moved = { ...s.piece, x: s.piece.x + dx, y: s.piece.y + dy };
  if (!fits(s, moved)) return false;
  s.piece = moved;
  return true;
}

const grounded = (s) => !fits(s, { ...s.piece, y: s.piece.y + 1 });

// A move or rotation while resting on the stack buys more time before locking, up to a limit.
function extendLock(s) {
  if (s.lockTimer > 0 && s.lockResets < MAX_LOCK_RESETS) {
    s.lockTimer = 0;
    s.lockResets++;
  }
}

export function move(s, dx) {
  if (s.over || !shift(s, dx, 0)) return false;
  extendLock(s);
  return true;
}

export function rotate(s, dir) {
  if (s.over) return false;
  const rot = (s.piece.rot + dir + 4) % 4;
  for (const [dx, dy] of KICKS) {
    const turned = { ...s.piece, rot, x: s.piece.x + dx, y: s.piece.y + dy };
    if (fits(s, turned)) {
      s.piece = turned;
      extendLock(s);
      return true;
    }
  }
  return false;
}

export function softDrop(s) {
  if (s.over || !shift(s, 0, 1)) return false;
  s.score += 1;
  s.fallTimer = 0;
  return true;
}

export function dropDistance(s) {
  let d = 0;
  while (fits(s, { ...s.piece, y: s.piece.y + d + 1 })) d++;
  return d;
}

export function hardDrop(s) {
  if (s.over) return;
  const d = dropDistance(s);
  s.piece.y += d;
  s.score += 2 * d;
  lock(s);
}

export function hold(s) {
  if (s.over || !s.canHold) return false;
  const current = s.piece.kind;
  spawn(s, s.hold === -1 ? next(s) : s.hold);
  s.hold = current;
  s.canHold = false;
  return true;
}

// Advances gravity and the lock timer by dt milliseconds.
export function update(s, dt) {
  if (s.over) return;
  if (grounded(s)) {
    s.fallTimer = 0;
    s.lockTimer += dt;
    if (s.lockTimer >= LOCK_MS) lock(s);
    return;
  }
  s.lockTimer = 0;
  s.fallTimer += dt;
  const interval = gravityMs(s.level);
  while (s.fallTimer >= interval && shift(s, 0, 1)) s.fallTimer -= interval;
}

function lock(s) {
  for (const [r, c] of pieceCells(s.piece)) s.board[r * COLS + c] = s.piece.kind;
  const full = [];
  for (let r = 0; r < HEIGHT; r++) {
    if (s.board.slice(r * COLS, (r + 1) * COLS).every((v) => v !== -1)) full.push(r);
  }
  for (const r of full) {
    s.board.splice(r * COLS, COLS);
    s.board.unshift(...new Array(COLS).fill(-1));
  }
  s.score += LINE_POINTS[full.length] * s.level;
  s.lines += full.length;
  s.level = 1 + Math.floor(s.lines / 10);
  s.canHold = true;
  spawn(s, next(s));
}
