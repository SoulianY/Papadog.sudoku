import { PEGS, topOf, canMove, move, same } from './hanoi.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const levels = await (await fetch('levels.json')).json();
const best = loadBest();
let index = 0, pos = [], history = [], held = -1, won = false;

const firstUnsolved = () => { const i = levels.findIndex((_, k) => best[k] === undefined); return i === -1 ? 0 : i; };

function show(id) {
  for (const el of document.querySelectorAll('main')) el.hidden = el.id !== id;
}

function renderHome() {
  const done = Object.keys(best).length;
  $('.progress-text').textContent = `${done} / ${levels.length}`;
  $('.progress-bar span').style.width = `${(done / levels.length) * 100}%`;
  $('.continue').textContent = `${firstUnsolved() + 1}단계 하기`;
  const list = $('.sections');
  list.replaceChildren();
  for (let disks = 3; disks <= 7; disks++) {
    const from = levels.findIndex((l) => l.start.length === disks);
    const count = levels.filter((l) => l.start.length === disks).length;
    const section = document.createElement('section');
    section.innerHTML = `<h2>원판 ${disks}개 <small>${from + 1}–${from + count}단계</small></h2><div class="stages"></div>`;
    for (let i = from; i < from + count; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      if (best[i] !== undefined) btn.className = best[i] <= levels[i].moves ? 'done perfect' : 'done';
      btn.addEventListener('click', () => openLevel(i));
      section.querySelector('.stages').appendChild(btn);
    }
    list.appendChild(section);
  }
}

function openLevel(i) {
  index = i;
  pos = levels[i].start.slice();
  history = [];
  held = -1;
  won = false;
  $('.stage-title').textContent = `${i + 1}단계`;
  $('.stage-sub').textContent = `원판 ${pos.length}개 · 최소 ${levels[i].moves}수`;
  $('.win').hidden = true;
  drawPegs($('.target'), levels[i].target, -1);
  render();
  show('play');
}

// Pegs as columns of disks; disk widths scale with size. `lifted` is the peg whose top disk is held.
function drawPegs(container, arrangement, lifted) {
  const n = arrangement.length;
  container.style.setProperty('--disks', n);
  container.replaceChildren(...Array.from({ length: PEGS }, (_, peg) => {
    const col = document.createElement('button');
    col.className = `peg${peg === lifted ? ' lifted' : ''}`;
    col.dataset.peg = peg;
    col.innerHTML = '<span class="rod"></span>';
    for (let d = n - 1; d >= 0; d--) {
      if (arrangement[d] !== peg) continue;
      const disk = document.createElement('span');
      disk.className = `disk d${d}`;
      disk.style.width = `${30 + (70 * (d + 1)) / n}%`;
      col.appendChild(disk);
    }
    return col;
  }));
}

function render() {
  drawPegs($('.pegs'), pos, held);
  $('.moves').textContent = history.length;
}

function shake(peg) {
  const el = $(`.pegs .peg[data-peg="${peg}"]`);
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  navigator.vibrate?.(30);
}

$('.pegs').addEventListener('click', (e) => {
  const peg = e.target.closest('.peg');
  if (!peg || won) return;
  const p = Number(peg.dataset.peg);
  if (held === -1) {
    if (topOf(pos, p) === -1) return;
    held = p;
  } else if (held === p) {
    held = -1;
  } else if (canMove(pos, held, p)) {
    history.push(pos);
    pos = move(pos, held, p);
    held = -1;
  } else {
    shake(p);
    return;
  }
  render();
  if (same(pos, levels[index].target)) win();
});

function win() {
  won = true;
  const used = history.length;
  if (best[index] === undefined || used < best[index]) {
    best[index] = used;
    saveBest(best);
  }
  navigator.vibrate?.(60);
  $('.win-moves').textContent = `${used}수`;
  $('.win-note').textContent = used <= levels[index].moves ? '최소 수로 옮겼어요!' : `최소 ${levels[index].moves}수로도 옮길 수 있어요`;
  $('.next').hidden = index >= levels.length - 1;
  // Moves happen on click, so the finger is already up; a short pause shows the last move first.
  setTimeout(() => { $('.win').hidden = false; }, 400);
}

$('.undo').addEventListener('click', () => {
  if (won || !history.length) return;
  pos = history.pop();
  held = -1;
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
