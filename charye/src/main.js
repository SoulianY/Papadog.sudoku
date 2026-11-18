import { stageInfo, TOTAL, PER_SIZE, MIN_SIZE, MAX_SIZE } from './stages.js';
import { Round } from './round.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const best = loadBest();
let stage = 0;
let round = null;
let startedAt = 0;
let timerId = 0;

const cleared = (s) => best[s] !== undefined;
const unlocked = (s) => s === 1 || cleared(s - 1);
const firstOpen = () => { let s = 1; while (s < TOTAL && cleared(s)) s++; return s; };

function formatTime(ms) {
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(2)}초` : `${Math.floor(s / 60)}분 ${(s % 60).toFixed(1)}초`;
}

function show(id) {
  for (const el of document.querySelectorAll('main')) el.hidden = el.id !== id;
}

function renderHome() {
  const done = Object.keys(best).length;
  $('.progress-text').textContent = `${done} / ${TOTAL}`;
  $('.progress-bar span').style.width = `${(done / TOTAL) * 100}%`;
  $('.continue').textContent = `${firstOpen()}단계 하기`;
  const list = $('.sections');
  list.replaceChildren();
  for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
    const from = (size - MIN_SIZE) * PER_SIZE + 1;
    const section = document.createElement('section');
    section.innerHTML = `<h2>${size}×${size} <small>${from}–${from + PER_SIZE - 1}단계</small></h2><div class="stages"></div>`;
    const grid = section.querySelector('.stages');
    for (let s = from; s < from + PER_SIZE; s++) {
      const btn = document.createElement('button');
      btn.textContent = s;
      btn.className = cleared(s) ? 'done' : '';
      btn.disabled = !unlocked(s);
      btn.addEventListener('click', () => openStage(s));
      grid.appendChild(btn);
    }
    list.appendChild(section);
  }
}

function openStage(s) {
  stage = s;
  const { size, max } = stageInfo(s);
  round = new Round(size, max);
  clearInterval(timerId);
  startedAt = 0;
  $('.stage-title').textContent = `${s}단계`;
  $('.stage-sub').textContent = `${size}×${size} · 1–${max}`;
  $('.timer').textContent = '0.00초';
  $('.stage-best').textContent = cleared(s) ? `최고 ${formatTime(best[s])}` : '';
  $('.clear').hidden = true;

  const board = $('.board');
  board.style.setProperty('--size', size);
  board.replaceChildren(...round.cells.map((_, i) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.dataset.index = i;
    return cell;
  }));
  renderBoard();
  show('play');
}

function renderBoard() {
  $('.next-number').textContent = round.done ? '–' : round.next;
  for (const cell of $('.board').children) {
    const value = round.cells[cell.dataset.index];
    cell.textContent = value ?? '';
    cell.classList.toggle('empty', value === null);
    cell.classList.toggle('wide', value >= 100);
  }
}

function flash(cell, cls) {
  cell.classList.remove(cls);
  void cell.offsetWidth; // restart the animation
  cell.classList.add(cls);
}

$('.board').addEventListener('pointerdown', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell || round.done) return;
  const result = round.tap(Number(cell.dataset.index));
  if (result === 'wrong') {
    if (round.cells[cell.dataset.index] !== null) flash(cell, 'wrong');
    navigator.vibrate?.(40);
    return;
  }
  if (!startedAt) {
    startedAt = performance.now();
    timerId = setInterval(() => { $('.timer').textContent = formatTime(performance.now() - startedAt); }, 50);
  }
  renderBoard();
  flash(cell, 'hit');
  if (result === 'done') finish();
});

function finish() {
  clearInterval(timerId);
  const ms = performance.now() - startedAt;
  $('.timer').textContent = formatTime(ms);
  const record = !cleared(stage) || ms < best[stage];
  if (record) {
    best[stage] = Math.round(ms);
    saveBest(best);
  }
  $('.clear-time').textContent = formatTime(ms);
  $('.clear-best').textContent = record ? '최고 기록!' : `최고 ${formatTime(best[stage])}`;
  $('.next').hidden = stage >= TOTAL;
  // Show the result only after the finishing finger lifts, so the click the browser sends on
  // lift-off lands on the board instead of a result button.
  let shown = false;
  const reveal = () => {
    if (shown) return;
    shown = true;
    setTimeout(() => { $('.clear').hidden = false; }, 350);
  };
  addEventListener('pointerup', reveal, { once: true });
  addEventListener('pointercancel', reveal, { once: true });
}

$('.continue').addEventListener('click', () => openStage(firstOpen()));
$('.back').addEventListener('click', () => { clearInterval(timerId); renderHome(); show('home'); });
for (const btn of document.querySelectorAll('.retry, .again')) btn.addEventListener('click', () => openStage(stage));
$('.next').addEventListener('click', () => openStage(stage + 1));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
