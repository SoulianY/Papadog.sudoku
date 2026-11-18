import { Puzzle } from './puzzle.js';
import { Board } from './board.js';
import { loadProgress, recordSolve } from './storage.js';

const DIFFICULTY_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };

const $ = (id) => document.getElementById(id);
const screens = { home: $('home'), game: $('game') };

let levels = [];
let progress = loadProgress();
let current = -1;
let puzzle;
let startedAt = 0;
let timerId = 0;
let filter = 'all';

const board = new Board($('board'), onBoardChange);

function show(name) {
  for (const [key, node] of Object.entries(screens)) node.hidden = key !== name;
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function firstUnsolved() {
  const i = levels.findIndex((_, idx) => progress[idx] === undefined);
  return i === -1 ? 0 : i;
}

function renderHome() {
  const solvedCount = Object.keys(progress).length;
  $('progress-text').textContent = `${solvedCount} / ${levels.length} 완료`;
  $('progress-bar').style.width = `${(solvedCount / levels.length) * 100}%`;
  $('continue').textContent = `${firstUnsolved() + 1}단계 이어하기`;

  const list = $('level-list');
  list.replaceChildren();
  levels.forEach((level, i) => {
    if (filter !== 'all' && level.difficulty !== filter) return;
    const btn = document.createElement('button');
    btn.className = `level ${level.difficulty}`;
    if (progress[i] !== undefined) btn.classList.add('done');
    btn.textContent = i + 1;
    btn.setAttribute('aria-label', `${i + 1}단계, ${DIFFICULTY_LABEL[level.difficulty]}`);
    btn.addEventListener('click', () => openLevel(i));
    list.appendChild(btn);
  });
}

function openLevel(i) {
  current = i;
  const level = levels[i];
  puzzle = new Puzzle(level);
  board.load(puzzle);
  $('level-title').textContent = `${i + 1}단계`;
  const badge = $('level-badge');
  badge.textContent = `${DIFFICULTY_LABEL[level.difficulty]} · ${level.size}×${level.size}`;
  badge.className = `badge ${level.difficulty}`;
  const best = progress[i];
  $('best').textContent = best === undefined ? '' : `최고 ${formatTime(best)}`;
  $('win').hidden = true;
  updateCount();
  startTimer();
  show('game');
}

function startTimer() {
  clearInterval(timerId);
  startedAt = Date.now();
  $('timer').textContent = '00:00';
  timerId = setInterval(() => { $('timer').textContent = formatTime(Date.now() - startedAt); }, 250);
}

function updateCount() {
  $('count').textContent = `${puzzle.path.length} / ${puzzle.total}`;
}

function onBoardChange() {
  updateCount();
  if (!puzzle.solved) return;
  clearInterval(timerId);
  const ms = Date.now() - startedAt;
  recordSolve(progress, current, ms);
  navigator.vibrate?.(60);
  $('win-time').textContent = formatTime(ms);
  $('next').hidden = current >= levels.length - 1;
  setTimeout(() => { $('win').hidden = false; }, 350);
}

$('continue').addEventListener('click', () => openLevel(firstUnsolved()));
$('back').addEventListener('click', () => { clearInterval(timerId); renderHome(); show('home'); });
$('undo').addEventListener('click', () => {
  puzzle.undo(); board.render(); updateCount();
});
$('reset').addEventListener('click', () => {
  if (puzzle.solved) return;
  puzzle.reset(); board.render(); updateCount();
});
$('next').addEventListener('click', () => openLevel(current + 1));
$('win-home').addEventListener('click', () => $('back').click());
$('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const b of $('filters').children) b.setAttribute('aria-pressed', b === btn);
  renderHome();
});

levels = await (await fetch('levels.json')).json();
renderHome();
show('home');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js');
