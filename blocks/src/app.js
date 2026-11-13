// UI: board, tray, drag-and-drop, game over.
import { SIZE, fits, fitsAnywhere, fullLineCells, newGame, play } from './engine.js';
import * as storage from './storage.js';

const CLEAR_MS = 280;
const LIFT = 1.6; // dragged piece floats this many cells above the finger

const boardEl = document.querySelector('.board');
const trayEl = document.querySelector('.tray');
const scoreEl = document.querySelector('.score');
const bestEl = document.querySelector('.best');
const comboEl = document.querySelector('.combo');
const dialog = document.querySelector('dialog');

const saved = storage.load();
let state = saved.state ?? newGame();
let best = saved.best ?? 0;
let busy = false;

boardEl.innerHTML = Array.from({ length: SIZE * SIZE }, () => '<div class="cell"></div>').join('');
const cells = [...boardEl.children];

const pieceHtml = (piece) => {
  const rows = Math.max(...piece.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) + 1;
  return `<div class="piece" style="--rows:${rows};--cols:${cols}">${piece.cells
    .map(([r, c]) => `<i class="c${piece.color}" style="grid-area:${r + 1}/${c + 1}"></i>`)
    .join('')}</div>`;
};

function render() {
  cells.forEach((el, i) => (el.className = `cell${state.board[i] ? ` c${state.board[i]}` : ''}`));
  trayEl.innerHTML = state.tray
    .map((p, k) => `<div class="slot${p && !fitsAnywhere(state.board, p) ? ' stuck' : ''}" data-slot="${k}">${p ? pieceHtml(p) : ''}</div>`)
    .join('');
  scoreEl.textContent = state.score;
  bestEl.textContent = `최고 ${best}`;
}

function persist() {
  best = Math.max(best, state.score);
  storage.save({ state: state.over ? null : state, best });
}

function showOver() {
  dialog.querySelector('.final').textContent = state.score;
  dialog.querySelector('.final-best').textContent = state.score >= best && state.score > 0 ? '최고 기록!' : `최고 ${best}`;
  dialog.showModal();
}

function restart() {
  dialog.close();
  state = newGame();
  persist();
  render();
}

function showCombo(lines, streak) {
  comboEl.textContent = streak > 1 ? `콤보 ×${streak}` : lines > 1 ? `${lines}줄!` : '';
  comboEl.classList.remove('pop');
  void comboEl.offsetWidth; // restart the animation
  if (comboEl.textContent) comboEl.classList.add('pop');
}

function commit(slot, row, col) {
  const placed = state.tray[slot];
  const result = play(state, slot, row, col);
  if (!result) return;
  // The board as it looks right after the drop, before lines vanish.
  const dropped = [...state.board];
  for (const [dr, dc] of placed.cells) dropped[(row + dr) * SIZE + col + dc] = placed.color;
  state = result.state;
  persist();
  render();
  if (result.cleared.size === 0) {
    if (state.over) setTimeout(showOver, CLEAR_MS);
    return;
  }
  busy = true;
  cells.forEach((el, i) => {
    el.className = `cell${dropped[i] ? ` c${dropped[i]}` : ''}${result.cleared.has(i) ? ' clearing' : ''}`;
  });
  showCombo(result.lines, state.streak);
  setTimeout(() => {
    busy = false;
    render();
    if (state.over) showOver();
  }, CLEAR_MS);
}

// Drag and drop with pointer events (mouse, touch, pen).
trayEl.addEventListener('pointerdown', (e) => {
  const slotEl = e.target.closest('.slot');
  const slot = Number(slotEl?.dataset.slot);
  const piece = state.tray[slot];
  if (busy || state.over || !piece) return;
  e.preventDefault();

  const cellSize = boardEl.getBoundingClientRect().width / SIZE;
  const rows = Math.max(...piece.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...piece.cells.map(([, c]) => c)) + 1;
  const floating = document.createElement('div');
  floating.className = 'floating';
  floating.style.setProperty('--cell', `${cellSize - 3}px`); // minus the board gap: same pitch as the board
  floating.innerHTML = pieceHtml(piece);
  document.body.append(floating);
  slotEl.classList.add('dragging');

  let target = null;
  const preview = new Set();

  function move(x, y) {
    const left = x - (cols * cellSize) / 2;
    const top = y - (rows + LIFT) * cellSize;
    floating.style.transform = `translate(${left}px, ${top}px)`;
    const rect = boardEl.getBoundingClientRect();
    const row = Math.round((top - rect.top) / cellSize);
    const col = Math.round((left - rect.left) / cellSize);
    target = fits(state.board, piece, row, col) ? [row, col] : null;

    preview.forEach((i) => cells[i].classList.remove('ghost', 'will-clear'));
    preview.clear();
    if (!target) return;
    const board = [...state.board];
    for (const [dr, dc] of piece.cells) {
      const i = (row + dr) * SIZE + col + dc;
      board[i] = piece.color;
      cells[i].classList.add('ghost');
      preview.add(i);
    }
    for (const i of fullLineCells(board).cells) {
      cells[i].classList.add('will-clear');
      preview.add(i);
    }
  }

  const listening = new AbortController();
  function end() {
    listening.abort();
    preview.forEach((i) => cells[i].classList.remove('ghost', 'will-clear'));
    floating.remove();
    slotEl.classList.remove('dragging');
    if (target) commit(slot, ...target);
  }

  const { signal } = listening;
  slotEl.setPointerCapture(e.pointerId);
  slotEl.addEventListener('pointermove', (ev) => move(ev.clientX, ev.clientY), { signal });
  slotEl.addEventListener('pointerup', end, { signal });
  slotEl.addEventListener('pointercancel', () => ((target = null), end()), { signal });
  move(e.clientX, e.clientY);
});

document.querySelector('.restart').addEventListener('click', restart);
dialog.querySelector('.again').addEventListener('click', restart);

render();
if (state.over) showOver();
