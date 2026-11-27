import { byId, rotate, flip, normalize } from './pieces.js';
import { loadStats, saveStats } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const cards = await (await fetch('boards.json')).json();
const MODES = { easy: { name: '초급', pieces: 3 }, hard: { name: '상급', pieces: 4 } };
const LIMIT = 30000;
const SNAP = 1.6; // a drop snaps to a free spot at most this many cells away
const DOUBLE_TAP = 300;
const SLOT = 4; // tray slots are 4×4 cells, two per row
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const unpack = (n) => [Math.floor(n / 10), n % 10];
const stats = loadStats();

let mode = 'easy';
let card, face, pieces = [], board = [], boardSet = new Set(), rows = 0, cols = 0;
let S = 36, boardLeft = 0, trayTop = 0;
let running = false, startedAt = 0, frame = 0, rollTimer = 0;
let drag = null, lastTap = null, hiddenAt = 0;

const size = (shape) => [Math.max(...shape.map(([r]) => r)) + 1, Math.max(...shape.map(([, c]) => c)) + 1];
const randInt = (n) => Math.floor(Math.random() * n);

function show(id) {
  for (const el of document.querySelectorAll('main')) el.hidden = el.id !== id;
}

function statText(m) {
  const s = stats[m] ?? { won: 0, lost: 0, totalMs: 0 };
  const avg = s.won ? `${(s.totalMs / s.won / 1000).toFixed(1)}초` : '-';
  return { won: s.won, lost: s.lost, avg };
}

function renderHome() {
  for (const m of Object.keys(MODES)) {
    const { won, lost, avg } = statText(m);
    $(`.mode-card[data-mode="${m}"] .mode-stats`).innerHTML = `성공 <b>${won}</b> · 실패 <b>${lost}</b> · 평균 <b>${avg}</b>`;
  }
}

function renderStats() {
  const { won, lost, avg } = statText(mode);
  $('.play-stats').innerHTML = `성공 <b>${won}</b> · 실패 <b>${lost}</b> · 평균 <b>${avg}</b>`;
}

// ---------- round ----------

function newRound() {
  cancelAnimationFrame(frame);
  clearInterval(rollTimer);
  running = false;
  lastTap = null;
  $('.result').hidden = true;
  $('.give-up').disabled = true;
  card = cards[mode][randInt(cards[mode].length)];
  board = card.board.map(unpack);
  boardSet = new Set(card.board);
  rows = Math.max(...board.map(([r]) => r)) + 1;
  cols = Math.max(...board.map(([, c]) => c)) + 1;
  face = 1 + randInt(6);
  pieces = card.faces[face - 1].pieces.map((id, slot) => ({ id, shape: normalize(byId[id].cells), at: null, slot }));
  setHourglass(0);
  $('.seconds').textContent = '30';
  buildArea();
  rollDie();
}

// The die tumbles through random faces, then lands on this round's face and the pieces appear.
function rollDie() {
  const die = $('.die');
  die.classList.add('rolling');
  $('.area').classList.add('waiting');
  let ticks = 0;
  rollTimer = setInterval(() => {
    drawDie(++ticks < 10 ? 1 + randInt(6) : face);
    if (ticks < 10) return;
    clearInterval(rollTimer);
    die.classList.remove('rolling');
    $('.area').classList.remove('waiting');
    running = true;
    startedAt = performance.now();
    $('.give-up').disabled = false;
    tick();
  }, 70);
}

function drawDie(n) {
  $('.die').replaceChildren(...Array.from({ length: 9 }, (_, i) => {
    const pip = document.createElement('span');
    if (PIPS[n].includes(i)) pip.className = 'pip';
    return pip;
  }));
}

// Sand runs from the top bulb (y 6–32) into the bottom one (y 32–58); the glass shape clips it.
function setHourglass(frac) {
  $('.sand-top').setAttribute('y', 6 + 26 * frac);
  $('.sand-top').setAttribute('height', 26 * (1 - frac));
  $('.sand-bottom').setAttribute('y', 58 - 26 * frac);
  $('.sand-bottom').setAttribute('height', 26 * frac);
}

function tick() {
  if (!running) return;
  const elapsed = performance.now() - startedAt;
  setHourglass(Math.min(1, elapsed / LIMIT));
  $('.seconds').textContent = Math.max(0, Math.ceil((LIMIT - elapsed) / 1000));
  if (elapsed >= LIMIT) return finish(false, '시간 끝');
  frame = requestAnimationFrame(tick);
}

function finish(success, failTitle) {
  running = false;
  cancelAnimationFrame(frame);
  const ms = performance.now() - startedAt;
  const s = (stats[mode] ??= { won: 0, lost: 0, totalMs: 0 });
  if (success) { s.won++; s.totalMs += ms; } else s.lost++;
  saveStats(stats);
  renderStats();
  $('.give-up').disabled = true;
  if (!success) {
    // Show the answer: every piece moves to its place in the stored solution.
    for (const { id, cells } of card.faces[face - 1].solution) {
      const p = pieces.find((x) => x.id === id);
      const pts = cells.map(unpack);
      const r0 = Math.min(...pts.map(([r]) => r)), c0 = Math.min(...pts.map(([, c]) => c));
      p.shape = normalize(pts);
      p.at = [r0, c0];
    }
    layout();
  } else {
    navigator.vibrate?.(60);
    $('.area').classList.add('cleared');
  }
  $('.result-title').textContent = success ? '성공!' : failTitle;
  $('.result-time').textContent = success ? `${(ms / 1000).toFixed(1)}초` : '정답 배치를 확인하세요';
  // Wait for the last drop's lift-off click (and the answer animation) before showing buttons.
  setTimeout(() => { $('.result').hidden = false; $('.area').classList.remove('cleared'); }, success ? 600 : 1400);
}

// ---------- layout ----------

function buildArea() {
  const area = $('.area');
  area.replaceChildren();
  for (const [r, c] of board) {
    const cell = document.createElement('div');
    cell.className = 'slot';
    cell.dataset.r = r;
    cell.dataset.c = c;
    area.appendChild(cell);
  }
  pieces.forEach((p, k) => {
    const el = document.createElement('div');
    el.className = `piece p-${p.id}`;
    el.dataset.k = k;
    area.appendChild(el);
    p.el = el;
  });
  layout();
}

// Cell size fits the board plus two rows of tray slots into the width and the height left on screen.
function measure() {
  const area = $('.area');
  const width = area.clientWidth;
  const height = window.innerHeight - area.getBoundingClientRect().top - 12;
  S = Math.floor(Math.min(width / (SLOT * 2 + 1), height / (rows + 1 + SLOT * 2), 52));
  boardLeft = Math.round((width - cols * S) / 2);
  trayTop = (rows + 1) * S;
  area.style.height = `${trayTop + SLOT * 2 * S}px`;
  return width;
}

function layout() {
  const width = measure();
  for (const el of $('.area').querySelectorAll('.slot')) {
    Object.assign(el.style, { left: `${boardLeft + el.dataset.c * S}px`, top: `${el.dataset.r * S}px`, width: `${S}px`, height: `${S}px` });
  }
  for (const p of pieces) {
    const [h, w] = size(p.shape);
    const el = p.el;
    el.replaceChildren(...p.shape.map(([r, c]) => {
      const cell = document.createElement('span');
      Object.assign(cell.style, { left: `${c * S}px`, top: `${r * S}px`, width: `${S}px`, height: `${S}px` });
      return cell;
    }));
    el.style.width = `${w * S}px`;
    el.style.height = `${h * S}px`;
    if (drag?.p === p) continue;
    let x, y;
    if (p.at) {
      x = boardLeft + p.at[1] * S;
      y = p.at[0] * S;
    } else {
      const half = width / 2;
      x = (p.slot % 2) * half + (half - w * S) / 2;
      y = trayTop + Math.floor(p.slot / 2) * SLOT * S + ((SLOT - h) * S) / 2;
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.classList.toggle('placed', Boolean(p.at));
  }
}

// ---------- placing ----------

function fits(p, shape, r, c) {
  const taken = new Set();
  for (const q of pieces) if (q !== p && q.at) for (const [dr, dc] of q.shape) taken.add((q.at[0] + dr) * 10 + q.at[1] + dc);
  return shape.every(([dr, dc]) => {
    const k = (r + dr) * 10 + c + dc;
    return r + dr >= 0 && c + dc >= 0 && boardSet.has(k) && !taken.has(k);
  });
}

// Nearest free spot for the shape's top-left to (fr, fc), in cells, or null if none is close.
function snap(p, shape, fr, fc) {
  let best = null, bestD = SNAP * SNAP;
  for (let r = Math.floor(fr) - 2; r <= Math.ceil(fr) + 2; r++) {
    for (let c = Math.floor(fc) - 2; c <= Math.ceil(fc) + 2; c++) {
      const d = (r - fr) ** 2 + (c - fc) ** 2;
      if (d <= bestD && fits(p, shape, r, c)) { best = [r, c]; bestD = d; }
    }
  }
  return best;
}

// After turning a placed piece, keep it centred where it was if it still fits nearby.
function reseat(p, oldShape, oldAt) {
  if (!oldAt) return;
  const [oh, ow] = size(oldShape), [nh, nw] = size(p.shape);
  p.at = snap(p, p.shape, oldAt[0] + (oh - nh) / 2, oldAt[1] + (ow - nw) / 2);
}

function tap(p) {
  const now = performance.now();
  if (lastTap?.p === p && now - lastTap.t < DOUBLE_TAP) {
    // Second tap: undo the turn the first tap made and flip instead.
    p.shape = flip(lastTap.shape);
    p.at = lastTap.at;
    reseat(p, lastTap.shape, lastTap.at);
    lastTap = null;
  } else {
    lastTap = { p, t: now, shape: p.shape, at: p.at };
    p.shape = rotate(p.shape);
    reseat(p, lastTap.shape, lastTap.at);
  }
  layout();
  checkDone();
}

function checkDone() {
  if (running && pieces.every((p) => p.at)) finish(true);
}

$('.area').addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.piece');
  if (!el || !running || drag) return;
  const p = pieces[el.dataset.k];
  el.setPointerCapture(e.pointerId);
  drag = { p, el, id: e.pointerId, x0: e.clientX, y0: e.clientY, left: el.offsetLeft, top: el.offsetTop, moved: false };
  el.classList.add('lifted');
});

$('.area').addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  drag.moved = true;
  drag.p.at = null;
  drag.el.style.left = `${drag.left + dx}px`;
  drag.el.style.top = `${drag.top + dy}px`;
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { p, el, moved } = drag;
  el.classList.remove('lifted');
  if (moved && running) {
    p.at = snap(p, p.shape, el.offsetTop / S, (el.offsetLeft - boardLeft) / S);
    lastTap = null;
  }
  drag = null;
  if (!moved && running) return tap(p);
  layout();
  checkDone();
}
$('.area').addEventListener('pointerup', endDrag);
$('.area').addEventListener('pointercancel', endDrag);

// ---------- screens ----------

for (const btn of document.querySelectorAll('.mode-card')) {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    $('.play-title').textContent = `${MODES[mode].name} · 조각 ${MODES[mode].pieces}개`;
    renderStats();
    show('play');
    newRound();
  });
}
$('.give-up').addEventListener('click', () => { if (running) finish(false, '포기'); });
$('.next').addEventListener('click', newRound);
$('.quit').addEventListener('click', () => { running = false; cancelAnimationFrame(frame); renderHome(); show('home'); });
$('.back').addEventListener('click', () => $('.quit').click());
addEventListener('resize', () => { if (!$('#play').hidden) layout(); });
document.addEventListener('visibilitychange', () => {
  // Time with the app hidden doesn't count: shift the start so the sand picks up where it left off.
  if (document.hidden) hiddenAt = performance.now();
  else if (running) startedAt += performance.now() - hiddenAt;
});

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
