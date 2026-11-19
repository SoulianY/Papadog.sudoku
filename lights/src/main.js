import { press, allOff, solve } from './lights.js';
import { stageBoard, TOTAL, PER_SIZE, MIN_SIZE, MAX_SIZE } from './stages.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const best = loadBest();
let stage = 1, size = 4, cells = [], start = [], moves = 0, minimum = 0, won = false;

const firstOpen = () => { let s = 1; while (s < TOTAL && best[s] !== undefined) s++; return s; };

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
  for (let n = MIN_SIZE; n <= MAX_SIZE; n++) {
    const from = (n - MIN_SIZE) * PER_SIZE + 1;
    const section = document.createElement('section');
    section.innerHTML = `<h2>${n}×${n} <small>${from}–${from + PER_SIZE - 1}단계</small></h2><div class="stages"></div>`;
    for (let s = from; s < from + PER_SIZE; s++) {
      const btn = document.createElement('button');
      btn.textContent = s;
      if (best[s] !== undefined) btn.className = 'done';
      btn.addEventListener('click', () => openStage(s));
      section.querySelector('.stages').appendChild(btn);
    }
    list.appendChild(section);
  }
}

function openStage(s) {
  stage = s;
  ({ size, cells: start } = stageBoard(s));
  cells = start.slice();
  moves = 0;
  won = false;
  minimum = solve(cells, size).length;
  $('.stage-title').textContent = `${s}단계`;
  $('.stage-sub').textContent = `${size}×${size} · 최소 ${minimum}번`;
  $('.win').hidden = true;
  const board = $('.board');
  board.style.setProperty('--size', size);
  board.replaceChildren(...cells.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'light';
    b.dataset.index = i;
    b.setAttribute('aria-label', `${Math.floor(i / size) + 1}행 ${(i % size) + 1}열`);
    return b;
  }));
  render();
  show('play');
}

function render() {
  for (const b of $('.board').children) {
    b.classList.toggle('on', cells[b.dataset.index] === 1);
    b.classList.remove('hint');
  }
  $('.moves').textContent = moves;
  $('.lit').textContent = cells.filter(Boolean).length;
}

$('.board').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.light');
  if (!b || won) return;
  press(cells, size, Number(b.dataset.index));
  moves++;
  render();
  if (allOff(cells)) win();
});

function win() {
  won = true;
  if (best[stage] === undefined || moves < best[stage]) {
    best[stage] = moves;
    saveBest(best);
  }
  navigator.vibrate?.(60);
  $('.win-moves').textContent = `${moves}번`;
  $('.win-note').textContent = moves <= minimum ? '최소로 껐어요!' : `최소 ${minimum}번으로도 끌 수 있어요`;
  $('.next').hidden = stage >= TOTAL;
  // Show after the finger lifts so the lift-off click doesn't land on a result button.
  addEventListener('pointerup', () => setTimeout(() => { $('.win').hidden = false; }, 400), { once: true });
}

$('.hint-btn').addEventListener('click', () => {
  if (won) return;
  const [cell] = solve(cells, size);
  $('.board').children[cell].classList.add('hint');
});
$('.reset').addEventListener('click', () => { if (!won) openStage(stage); });
$('.continue').addEventListener('click', () => openStage(firstOpen()));
$('.back').addEventListener('click', () => { renderHome(); show('home'); });
$('.next').addEventListener('click', () => openStage(stage + 1));
$('.again').addEventListener('click', () => openStage(stage));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
