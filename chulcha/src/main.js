import { SIZE, startOffsets, slideRange, solved } from './board.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const levels = await (await fetch('levels.json')).json();
const best = loadBest();
const COLORS = 8; // piece colour classes c1..c8; the key piece has its own

let index = 0;
let pieces = [];
let offsets = [];
let history = [];
let won = false;

const firstUnsolved = () => { const i = levels.findIndex((_, k) => best[k] === undefined); return i === -1 ? 0 : i; };

function show(id) {
  for (const el of document.querySelectorAll('main')) el.hidden = el.id !== id;
}

function renderHome() {
  const done = Object.keys(best).length;
  $('.progress-text').textContent = `${done} / ${levels.length}`;
  $('.progress-bar span').style.width = `${(done / levels.length) * 100}%`;
  $('.continue').textContent = `${firstUnsolved() + 1}단계 하기`;
  const list = $('.levels');
  list.replaceChildren(...levels.map((level, i) => {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    if (best[i] !== undefined) btn.className = best[i] <= level.moves ? 'done perfect' : 'done';
    btn.addEventListener('click', () => openLevel(i));
    return btn;
  }));
}

function openLevel(i) {
  index = i;
  const level = levels[i];
  pieces = level.pieces.map(([r, c, len, v]) => [r, c, len, Boolean(v)]);
  offsets = startOffsets(pieces);
  history = [];
  won = false;
  $('.level-title').textContent = `${i + 1}단계`;
  $('.level-sub').textContent = `최소 ${level.moves}수`;
  $('.win').hidden = true;
  const board = $('.board');
  board.querySelectorAll('.piece').forEach((p) => p.remove());
  pieces.forEach(([, , len, vertical], k) => {
    const el = document.createElement('div');
    el.className = `piece ${k === 0 ? 'key' : `c${(k % COLORS) + 1}`}`;
    el.dataset.index = k;
    el.style.setProperty('--w', vertical ? 1 : len);
    el.style.setProperty('--h', vertical ? len : 1);
    board.appendChild(el);
  });
  render();
  show('play');
}

function place(el, k, offset) {
  const [r, c, , vertical] = pieces[k];
  el.style.setProperty('--x', vertical ? c : offset);
  el.style.setProperty('--y', vertical ? offset : r);
}

function render() {
  for (const el of document.querySelectorAll('.piece')) place(el, Number(el.dataset.index), offsets[el.dataset.index]);
  $('.moves').textContent = history.length;
}

// Dragging: the piece follows the finger along its axis within the free range, then snaps.
let drag = null;
$('.board').addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.piece');
  if (!el || won || drag) return;
  const k = Number(el.dataset.index);
  const vertical = pieces[k][3];
  const [lo, hi] = slideRange(pieces, offsets, k);
  const cellPx = $('.board').getBoundingClientRect().width / SIZE;
  el.setPointerCapture(e.pointerId);
  el.classList.add('dragging');
  drag = { el, k, vertical, lo, hi, cellPx, id: e.pointerId, from: offsets[k], start: vertical ? e.clientY : e.clientX, pos: offsets[k] };
});

$('.board').addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const delta = ((drag.vertical ? e.clientY : e.clientX) - drag.start) / drag.cellPx;
  drag.pos = Math.min(drag.hi, Math.max(drag.lo, drag.from + delta));
  place(drag.el, drag.k, drag.pos);
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { el, k, from } = drag;
  const to = Math.round(drag.pos);
  el.classList.remove('dragging');
  drag = null;
  if (to !== from) {
    offsets[k] = to;
    history.push([k, from]);
  }
  render();
  if (solved(offsets)) win();
}
$('.board').addEventListener('pointerup', endDrag);
$('.board').addEventListener('pointercancel', endDrag);

function win() {
  won = true;
  const used = history.length;
  const level = levels[index];
  if (best[index] === undefined || used < best[index]) {
    best[index] = used;
    saveBest(best);
  }
  $('.board .key').classList.add('leaving');
  navigator.vibrate?.(60);
  $('.win-moves').textContent = `${used}수`;
  $('.win-note').textContent = used <= level.moves ? '최소 수로 풀었어요!' : `최소 ${level.moves}수로도 풀 수 있어요`;
  $('.next').hidden = index >= levels.length - 1;
  // Wait out the slide-out animation; this also keeps the lift-off click off the result buttons.
  setTimeout(() => { $('.win').hidden = false; }, 600);
}

$('.undo').addEventListener('click', () => {
  if (won || !history.length) return;
  const [k, from] = history.pop();
  offsets[k] = from;
  render();
});
$('.reset').addEventListener('click', () => { if (!won) openLevel(index); });
$('.continue').addEventListener('click', () => openLevel(firstUnsolved()));
$('.back').addEventListener('click', () => { renderHome(); show('home'); });
$('.next').addEventListener('click', () => openLevel(index + 1));
$('.again').addEventListener('click', () => openLevel(index));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
