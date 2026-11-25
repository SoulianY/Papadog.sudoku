import { SIDES, turn, watered, solved } from './pipes.js';
import { stageBoard, TOTAL, SIZES } from './stages.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const best = loadBest();
let stage = 1, board, turns = [], taps = 0, won = false;

const firstOpen = () => { let s = 1; while (s < TOTAL && best[s] !== undefined) s++; return s; };
const current = () => board.solution.map((m, i) => turn(m, turns[i]));

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
  for (const { size, from, count } of SIZES) {
    const section = document.createElement('section');
    section.innerHTML = `<h2>${size}×${size} <small>${from}–${from + count - 1}단계</small></h2><div class="stages"></div>`;
    for (let s = from; s < from + count; s++) {
      const btn = document.createElement('button');
      btn.textContent = s;
      if (best[s] !== undefined) btn.className = 'done';
      btn.addEventListener('click', () => openStage(s));
      section.querySelector('.stages').appendChild(btn);
    }
    list.appendChild(section);
  }
}

// The pipe is drawn in its solved orientation and the tile is rotated on screen, so turning animates.
function pipeSvg(mask, i) {
  const arms = SIDES.filter((s) => mask & s.bit)
    .map((s) => `<line x1="50" y1="50" x2="${50 + s.dc * 50}" y2="${50 + s.dr * 50}"/>`).join('');
  const ends = SIDES.filter((s) => mask & s.bit).length;
  const knob = i === board.source ? '<circle class="source" cx="50" cy="50" r="24"/>' : ends === 1 ? '<circle class="end" cx="50" cy="50" r="16"/>' : '<circle cx="50" cy="50" r="9"/>';
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${arms}${knob}</svg>`;
}

function openStage(s) {
  stage = s;
  board = stageBoard(s);
  turns = board.turns.slice();
  taps = 0;
  won = false;
  $('.stage-title').textContent = `${s}단계`;
  $('.stage-sub').textContent = `${board.size}×${board.size}`;
  $('.win').hidden = true;
  const grid = $('.grid');
  grid.style.setProperty('--size', board.size);
  grid.replaceChildren(...board.solution.map((mask, i) => {
    const b = document.createElement('button');
    b.className = 'tile';
    b.dataset.index = i;
    b.innerHTML = pipeSvg(mask, i);
    return b;
  }));
  render();
  show('play');
}

function render() {
  const masks = current();
  const wet = watered(masks, board.size, board.source);
  for (const b of $('.grid').children) {
    const i = Number(b.dataset.index);
    b.style.setProperty('--turn', `${turns[i] * 90}deg`);
    b.classList.toggle('wet', wet.has(i));
  }
  $('.taps').textContent = taps;
  $('.wet-count').textContent = `${wet.size} / ${masks.length}`;
}

$('.grid').addEventListener('click', (e) => {
  const b = e.target.closest('.tile');
  if (!b || won) return;
  turns[b.dataset.index]++;
  taps++;
  render();
  if (solved(current(), board.size, board.source)) win();
});

function win() {
  won = true;
  if (best[stage] === undefined || taps < best[stage]) {
    best[stage] = taps;
    saveBest(best);
  }
  navigator.vibrate?.(60);
  $('.grid').classList.add('done');
  $('.win-taps').textContent = `${taps}번 돌려 완성`;
  $('.next').hidden = stage >= TOTAL;
  // Taps act on click, so the finger is already up; let the last turn and the water show first.
  setTimeout(() => { $('.win').hidden = false; $('.grid').classList.remove('done'); }, 700);
}

$('.reset').addEventListener('click', () => { if (!won) openStage(stage); });
$('.continue').addEventListener('click', () => openStage(firstOpen()));
$('.back').addEventListener('click', () => { renderHome(); show('home'); });
$('.next').addEventListener('click', () => openStage(stage + 1));
$('.again').addEventListener('click', () => openStage(stage));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
