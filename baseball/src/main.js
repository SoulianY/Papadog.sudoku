import { Game, MAX_TRIES } from './game.js';
import { loadStats, saveStats } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const stats = loadStats();
let length = 3;
let game;
let input = [];
let memo = {}; // digit → 'out' | 'in'

function newGame() {
  game = new Game(length);
  input = [];
  memo = {};
  $('.result').hidden = true;
  render();
}

function renderStats() {
  const s = stats[length] ?? { played: 0, won: 0 };
  $('.stats').textContent = s.played ? `${s.won}승 / ${s.played}판 · 최소 ${s.best ?? '-'}번` : '';
}

function render() {
  for (const tab of document.querySelectorAll('.mode button')) tab.setAttribute('aria-pressed', Number(tab.dataset.length) === length);
  $('.tries').textContent = `${game.history.length} / ${MAX_TRIES}`;
  $('.history').replaceChildren(...game.history.map(({ guess, strike, ball }, i) => {
    const row = document.createElement('li');
    const verdict = strike || ball ? `${strike ? `<b class="s">${strike}S</b>` : ''}${ball ? `<b class="b">${ball}B</b>` : ''}` : '<b class="o">OUT</b>';
    row.innerHTML = `<span class="n">${i + 1}</span><span class="g">${guess.join(' ')}</span><span class="v">${verdict}</span>`;
    return row;
  }));
  $('.history').scrollTop = $('.history').scrollHeight;
  $('.slots').replaceChildren(...Array.from({ length }, (_, i) => {
    const slot = document.createElement('span');
    slot.textContent = input[i] ?? '';
    return slot;
  }));
  for (const key of document.querySelectorAll('.pad [data-digit]')) {
    const d = Number(key.dataset.digit);
    key.disabled = input.includes(d) || input.length >= length;
    key.dataset.memo = memo[d] ?? '';
  }
  for (const m of document.querySelectorAll('.memo button')) m.dataset.state = memo[m.dataset.digit] ?? '';
  $('.submit').disabled = input.length !== length;
  $('.erase').disabled = !input.length;
  renderStats();
}

function finish() {
  const s = (stats[length] ??= { played: 0, won: 0 });
  s.played++;
  if (game.won) {
    s.won++;
    s.best = Math.min(s.best ?? Infinity, game.history.length);
  }
  saveStats(stats);
  $('.result-title').textContent = game.won ? '정답!' : '아쉬워요';
  $('.result-text').textContent = game.won ? `${game.history.length}번 만에 맞혔어요` : `정답은 ${game.secret.join(' ')}`;
  // Keys act on click, so the finger is already up; a short pause lets the last row show first.
  setTimeout(() => { $('.result').hidden = false; }, 300);
}

$('.pad').addEventListener('click', (e) => {
  const key = e.target.closest('button');
  if (!key || key.disabled || game.over) return;
  if (key.dataset.digit) input.push(Number(key.dataset.digit));
  else if (key.classList.contains('erase')) input.pop();
  else if (key.classList.contains('submit')) {
    game.guess(input);
    input = [];
    if (game.over) finish();
  }
  render();
});

$('.memo').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const d = btn.dataset.digit;
  memo[d] = { '': 'out', out: 'in', in: '' }[memo[d] ?? ''];
  if (!memo[d]) delete memo[d];
  render();
});

$('.mode').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || Number(btn.dataset.length) === length) return;
  length = Number(btn.dataset.length);
  newGame();
});
$('.again').addEventListener('click', newGame);
$('.restart').addEventListener('click', newGame);

newGame();
navigator.serviceWorker?.register('../sw.js').catch(() => {});
