import { buildEdges, degrees, solved, blocked } from './bridges.js';
import { loadDone, saveDone } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const NS = 'http://www.w3.org/2000/svg';
const CELL = 100;
const SIZES = [7, 8, 9, 10];
const levels = await (await fetch('levels.json')).json();
const done = loadDone();

let index = 0, level, edges, counts, history, won;

function svg(name, attrs, parent) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent?.appendChild(node);
  return node;
}

const firstOpen = () => { const i = levels.findIndex((_, k) => !done.has(k)); return i === -1 ? 0 : i; };

function show(id) {
  for (const el of document.querySelectorAll('main')) el.hidden = el.id !== id;
}

function renderHome() {
  $('.progress-text').textContent = `${done.size} / ${levels.length}`;
  $('.progress-bar span').style.width = `${(done.size / levels.length) * 100}%`;
  $('.continue').textContent = `${firstOpen() + 1}단계 하기`;
  const list = $('.sections');
  list.replaceChildren();
  for (const size of SIZES) {
    const from = levels.findIndex((l) => l.size === size);
    const count = levels.filter((l) => l.size === size).length;
    const section = document.createElement('section');
    section.innerHTML = `<h2>${size}×${size} <small>${from + 1}–${from + count}단계</small></h2><div class="stages"></div>`;
    for (let i = from; i < from + count; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      if (done.has(i)) btn.className = 'done';
      btn.addEventListener('click', () => openLevel(i));
      section.querySelector('.stages').appendChild(btn);
    }
    list.appendChild(section);
  }
}

function openLevel(i) {
  index = i;
  level = levels[i];
  edges = buildEdges(level.islands);
  counts = new Array(edges.length).fill(0);
  history = [];
  won = false;
  $('.stage-title').textContent = `${i + 1}단계`;
  $('.stage-sub').textContent = `${level.size}×${level.size} · 섬 ${level.islands.length}개`;
  $('.win').hidden = true;
  $('.board').setAttribute('viewBox', `0 0 ${level.size * CELL} ${level.size * CELL}`);
  render();
  show('play');
}

const center = (i) => [level.islands[i][1] * CELL + CELL / 2, level.islands[i][0] * CELL + CELL / 2];

function render() {
  const board = $('.board');
  board.replaceChildren();
  const dots = svg('g', { class: 'dots' }, board);
  for (let r = 0; r < level.size; r++) {
    for (let c = 0; c < level.size; c++) svg('circle', { cx: c * CELL + CELL / 2, cy: r * CELL + CELL / 2, r: 3 }, dots);
  }
  const lines = svg('g', { class: 'bridges' }, board);
  edges.forEach((e, k) => {
    if (!counts[k]) return;
    const [x1, y1] = center(e.a), [x2, y2] = center(e.b);
    const offsets = counts[k] === 1 ? [0] : [-11, 11];
    for (const o of offsets) {
      svg('line', e.horizontal ? { x1, y1: y1 + o, x2, y2: y2 + o } : { x1: x1 + o, y1, x2: x2 + o, y2 }, lines);
    }
  });
  const deg = degrees(level.islands, edges, counts);
  level.islands.forEach(([, , n], i) => {
    const [x, y] = center(i);
    const g = svg('g', { class: `island${deg[i] === n ? ' full' : deg[i] > n ? ' over' : ''}` }, board);
    svg('circle', { cx: x, cy: y, r: 36 }, g);
    svg('text', { x, y, dy: '0.35em' }, g).textContent = n;
  });
  const left = level.islands.reduce((sum, [, , n], i) => sum + Math.max(0, n - deg[i]), 0) / 2;
  $('.left').textContent = Math.ceil(left);
}

function cycle(k) {
  const next = (counts[k] + 1) % 3;
  if (next > 0 && blocked(edges, counts, k)) {
    navigator.vibrate?.(30);
    $('.board').classList.remove('shake');
    void $('.board').getBoundingClientRect();
    $('.board').classList.add('shake');
    return;
  }
  history.push([k, counts[k]]);
  counts[k] = next;
  render();
  if (solved(level.islands, edges, counts)) win();
}

// Board coordinates of a pointer event, in cells.
function toCell(e) {
  const rect = $('.board').getBoundingClientRect();
  return [((e.clientY - rect.top) / rect.height) * level.size, ((e.clientX - rect.left) / rect.width) * level.size];
}

let press = null;
$('.board').addEventListener('pointerdown', (e) => {
  if (won) return;
  $('.board').setPointerCapture(e.pointerId);
  press = { id: e.pointerId, at: toCell(e) };
});

$('.board').addEventListener('pointerup', (e) => {
  if (!press || e.pointerId !== press.id) return;
  const [r0, c0] = press.at, [r1, c1] = toCell(e);
  press = null;
  const cellR = Math.floor(r0), cellC = Math.floor(c0);
  const island = level.islands.findIndex(([r, c]) => r === cellR && c === cellC);
  const dr = r1 - r0, dc = c1 - c0;
  if (island !== -1 && Math.hypot(dr, dc) > 0.35) {
    // Dragged off an island: the edge leaving it in the drag's main direction.
    const horizontal = Math.abs(dc) > Math.abs(dr);
    const forward = horizontal ? dc > 0 : dr > 0;
    const k = edges.findIndex((ed) => ed.horizontal === horizontal && (forward ? ed.a === island : ed.b === island));
    if (k !== -1) cycle(k);
    return;
  }
  if (island === -1 && Math.hypot(dr, dc) < 0.5) {
    // Tapped between islands: the edge passing through that cell, preferring one with bridges.
    const through = edges.map((ed, k) => [ed, k]).filter(([ed]) =>
      ed.horizontal ? ed.line === cellR && cellC > ed.from && cellC < ed.to : ed.line === cellC && cellR > ed.from && cellR < ed.to);
    through.sort(([, a], [, b]) => counts[b] - counts[a]);
    if (through.length) cycle(through[0][1]);
  }
});

function win() {
  won = true;
  done.add(index);
  saveDone(done);
  navigator.vibrate?.(60);
  $('.next').hidden = index >= levels.length - 1;
  addEventListener('pointerup', () => setTimeout(() => { $('.win').hidden = false; }, 400), { once: true });
}

$('.undo').addEventListener('click', () => {
  if (won || !history.length) return;
  const [k, v] = history.pop();
  counts[k] = v;
  render();
});
$('.reset').addEventListener('click', () => { if (!won) openLevel(index); });
$('.continue').addEventListener('click', () => openLevel(firstOpen()));
$('.back').addEventListener('click', () => { renderHome(); show('home'); });
$('.next').addEventListener('click', () => openLevel(index + 1));
$('.to-list').addEventListener('click', () => $('.back').click());

renderHome();
show('home');
navigator.serviceWorker?.register('../sw.js').catch(() => {});
