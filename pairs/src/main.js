import { Board } from './game.js';
import { stageInfo, TOTAL, LAYOUTS, PER_LAYOUT } from './stages.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const MISS_DELAY = 800;
const best = loadBest();
let stage = 1, info, board, startedAt = 0, timerId = 0, missTimer = 0, previewTimer = 0, peeking = false;

const firstOpen = () => { let s = 1; while (s < TOTAL && best[s] !== undefined) s++; return s; };
const formatTime = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

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
  LAYOUTS.forEach(({ pairs }, k) => {
    const from = k * PER_LAYOUT + 1;
    const section = document.createElement('section');
    section.innerHTML = `<h2>카드 ${pairs * 2}장 <small>${from}–${from + PER_LAYOUT - 1}단계</small></h2><div class="stages"></div>`;
    for (let s = from; s < from + PER_LAYOUT; s++) {
      const btn = document.createElement('button');
      btn.textContent = s;
      if (best[s] !== undefined) btn.className = best[s] <= pairs ? 'done perfect' : 'done';
      btn.addEventListener('click', () => openStage(s));
      section.querySelector('.stages').appendChild(btn);
    }
    list.appendChild(section);
  });
}

function openStage(s) {
  stage = s;
  info = stageInfo(s);
  board = new Board(info.pairs);
  clearInterval(timerId);
  clearTimeout(missTimer);
  clearTimeout(previewTimer);
  startedAt = 0;
  $('.stage-title').textContent = `${s}단계`;
  $('.stage-sub').textContent = `카드 ${info.pairs * 2}장${best[s] !== undefined ? ` · 최소 ${best[s]}번` : ''}`;
  $('.timer').textContent = '0:00';
  $('.win').hidden = true;
  const grid = $('.cards');
  grid.style.setProperty('--cols', info.cols);
  grid.style.setProperty('--rows', Math.ceil((info.pairs * 2) / info.cols));
  grid.replaceChildren(...board.cards.map((card, i) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.dataset.index = i;
    b.innerHTML = `<span class="back"></span><span class="face">${info.symbols[card.id]}</span>`;
    return b;
  }));
  // Show every card face up for a moment, then turn them over and start.
  peeking = true;
  const bar = $('.preview');
  bar.hidden = false;
  bar.style.setProperty('--ms', `${info.preview}ms`);
  bar.classList.remove('run');
  void bar.offsetWidth; // restart the countdown animation
  bar.classList.add('run');
  previewTimer = setTimeout(() => {
    peeking = false;
    bar.hidden = true;
    render();
  }, info.preview);
  render();
  show('play');
}

function render() {
  for (const b of $('.cards').children) {
    const card = board.cards[b.dataset.index];
    b.classList.toggle('open', card.open || peeking);
    b.classList.toggle('matched', card.matched);
  }
  $('.moves').textContent = board.moves;
}

$('.cards').addEventListener('click', (e) => {
  const b = e.target.closest('.card');
  if (!b || board.done || peeking) return;
  clearTimeout(missTimer);
  const result = board.flip(Number(b.dataset.index));
  if (result === 'ignored') return;
  if (!startedAt) {
    startedAt = performance.now();
    timerId = setInterval(() => { $('.timer').textContent = formatTime(performance.now() - startedAt); }, 250);
  }
  if (result === 'miss') missTimer = setTimeout(() => { board.hideMiss(); render(); }, MISS_DELAY);
  if (result === 'match') navigator.vibrate?.(20);
  render();
  if (board.done) win();
});

function win() {
  clearInterval(timerId);
  const ms = performance.now() - startedAt;
  const record = best[stage] === undefined || board.moves < best[stage];
  if (record) {
    best[stage] = board.moves;
    saveBest(best);
  }
  $('.win-moves').textContent = `${board.moves}번 · ${formatTime(ms)}`;
  $('.win-note').textContent = board.moves === info.pairs ? '한 번도 틀리지 않았어요!' : record ? '최소 기록!' : `최소 ${best[stage]}번`;
  $('.next').hidden = stage >= TOTAL;
  // The win comes from a click, so the finger is already up; wait out the last flip.
  setTimeout(() => { $('.win').hidden = false; }, 600);
}

$('.reset').addEventListener('click', () => openStage(stage));
$('.continue').addEventListener('click', () => openStage(firstOpen()));
$('.back').addEventListener('click', () => { clearInterval(timerId); clearTimeout(previewTimer); renderHome(); show('home'); });
$('.next').addEventListener('click', () => openStage(stage + 1));
$('.again').addEventListener('click', () => openStage(stage));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
