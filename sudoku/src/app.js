// UI: hash routes  (none) levels  ·  #easy  puzzle list  ·  #easy-12  play
import { PUZZLES } from './puzzles.js';
import { Game } from './game.js';
import { PEERS, row, col, box } from './sudoku.js';
import * as progress from './storage.js';

const LEVELS = [
  { key: 'easy', name: '초급' },
  { key: 'medium', name: '중급' },
  { key: 'hard', name: '상급' },
  { key: 'expert', name: '최상급' },
];
const levelName = (key) => LEVELS.find((l) => l.key === key).name;

const app = document.getElementById('app');
let active = null; // running game screen: { save(), stop() }

const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function route() {
  active?.stop();
  active = null;
  const [level, n] = location.hash.slice(1).split('-');
  const index = Number(n);
  if (PUZZLES[level] && index >= 1 && index <= PUZZLES[level].length) showGame(level, index);
  else if (PUZZLES[level]) showList(level);
  else showLevels();
}

function showLevels() {
  app.innerHTML = `
    <header class="bar"><a class="back" href="../" aria-label="게임 목록">‹</a><h1>스도쿠</h1></header>
    <main class="levels">
      ${LEVELS.map(({ key, name }) => {
        const solved = progress.countSolved(PUZZLES[key]);
        return `
          <a class="level level-${key}" href="#${key}">
            <span class="level-name">${name}</span>
            <span class="level-count">${solved} / ${PUZZLES[key].length}</span>
            <span class="level-meter"><span style="width:${solved}%"></span></span>
          </a>`;
      }).join('')}
    </main>`;
}

function showList(level) {
  app.innerHTML = `
    <header class="bar">
      <a class="back" href="#" aria-label="뒤로">‹</a>
      <h1>${levelName(level)}</h1>
      <span class="bar-side">${progress.countSolved(PUZZLES[level])} / ${PUZZLES[level].length}</span>
    </header>
    <main class="puzzles">
      ${PUZZLES[level].map(([puzzle], k) => {
        const state = progress.getSolvedTime(puzzle) !== undefined ? 'solved' : progress.getSave(puzzle) ? 'started' : '';
        return `<a class="puzzle ${state}" href="#${level}-${k + 1}">${k + 1}</a>`;
      }).join('')}
    </main>`;
}

function showGame(level, index) {
  const [puzzle, solution] = PUZZLES[level][index - 1];
  const game = new Game(puzzle, solution, progress.getSave(puzzle));
  const best = progress.getSolvedTime(puzzle);
  let selected = null;
  let noteMode = false;

  app.innerHTML = `
    <header class="bar">
      <a class="back" href="#${level}" aria-label="뒤로">‹</a>
      <h1>${levelName(level)} ${index}</h1>
      <span class="bar-side timer"></span>
    </header>
    <main class="play">
      <div class="board" role="grid">
        ${Array.from({ length: 81 }, (_, i) => `<button class="cell" data-i="${i}" data-r="${row(i)}" data-c="${col(i)}"></button>`).join('')}
      </div>
      <div class="tools">
        <button data-tool="undo"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>실행취소</button>
        <button data-tool="erase"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>지우기</button>
        <button data-tool="notes"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/><path d="m15 5 4 4"/></svg>메모 <b class="toggle"></b></button>
        <button data-tool="hint"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>힌트</button>
      </div>
      <div class="pad">
        ${Array.from({ length: 9 }, (_, k) => `<button data-d="${k + 1}">${k + 1}<small></small></button>`).join('')}
      </div>
    </main>
    <dialog class="done">
      <h2>완료!</h2>
      <p class="done-time"></p>
      <div class="done-actions">
        <a class="secondary" href="#${level}">목록</a>
        ${index < PUZZLES[level].length ? `<a href="#${level}-${index + 1}" autofocus>다음 퍼즐</a>` : ''}
      </div>
    </dialog>`;

  const cells = [...app.querySelectorAll('.cell')];
  const padButtons = [...app.querySelectorAll('[data-d]')];
  const timer = app.querySelector('.timer');
  const undoButton = app.querySelector('[data-tool="undo"]');
  const notesButton = app.querySelector('[data-tool="notes"]');
  const dialog = app.querySelector('dialog');

  function render() {
    const focus = selected === null ? 0 : game.values[selected];
    cells.forEach((cell, i) => {
      const v = game.values[i];
      cell.classList.toggle('given', game.isGiven(i));
      cell.classList.toggle('wrong', game.isWrong(i));
      cell.classList.toggle('selected', i === selected);
      cell.classList.toggle('peer', selected !== null && PEERS[selected].includes(i));
      cell.classList.toggle('same', focus !== 0 && v === focus);
      cell.innerHTML = v
        ? String(v)
        : game.notes[i]
          ? `<span class="notes">${Array.from({ length: 9 }, (_, k) =>
              `<span class="${game.hasNote(i, k + 1) ? (k + 1 === focus ? 'on same' : 'on') : ''}">${k + 1}</span>`).join('')}</span>`
          : '';
    });
    padButtons.forEach((b, k) => {
      const left = game.remaining(k + 1);
      b.disabled = left === 0;
      b.querySelector('small').textContent = left;
    });
    undoButton.disabled = !game.canUndo;
    notesButton.classList.toggle('active', noteMode);
    notesButton.querySelector('.toggle').textContent = noteMode ? 'ON' : 'OFF';
    timer.textContent = formatTime(game.elapsed);
  }

  function changed() {
    if (game.solved) {
      progress.markSolved(puzzle, game.elapsed);
      selected = null;
      render();
      clearInterval(ticker);
      const bestNow = Math.min(game.elapsed, best ?? Infinity);
      dialog.querySelector('.done-time').textContent =
        `기록 ${formatTime(game.elapsed)}` + (best !== undefined ? ` · 최고 ${formatTime(bestNow)}` : '');
      dialog.showModal();
      return;
    }
    save();
    render();
  }

  function input(d) {
    if (selected === null) return;
    if (noteMode) game.toggleNote(selected, d);
    else game.setValue(selected, d);
    changed();
  }

  function tool(name) {
    if (name === 'undo') game.undo();
    if (name === 'erase' && selected !== null) game.erase(selected);
    if (name === 'notes') noteMode = !noteMode;
    if (name === 'hint') selected = game.hint(selected);
    changed();
  }

  function move(dr, dc) {
    const i = selected ?? 0;
    selected = ((row(i) + dr + 9) % 9) * 9 + ((col(i) + dc + 9) % 9);
    render();
  }

  app.querySelector('.board').addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    selected = Number(cell.dataset.i);
    render();
  });
  app.querySelector('.pad').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (b) input(Number(b.dataset.d));
  });
  app.querySelector('.tools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]');
    if (b) tool(b.dataset.tool);
  });

  const KEYS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  function onKey(e) {
    if (dialog.open || e.altKey || e.metaKey) return;
    if (e.ctrlKey) {
      if (e.key === 'z') tool('undo');
      return;
    }
    if (/^[1-9]$/.test(e.key)) input(Number(e.key));
    else if (['Backspace', 'Delete', '0'].includes(e.key)) tool('erase');
    else if (e.key === 'n' || e.key === 'N') tool('notes');
    else if (KEYS[e.key]) move(...KEYS[e.key]);
    else return;
    e.preventDefault();
  }
  document.addEventListener('keydown', onKey);

  const ticker = setInterval(() => {
    if (document.hidden || dialog.open) return;
    game.elapsed += 1;
    timer.textContent = formatTime(game.elapsed);
  }, 1000);

  const save = () => game.solved || progress.writeSave(puzzle, game.toSave());
  active = {
    save,
    stop() {
      clearInterval(ticker);
      document.removeEventListener('keydown', onKey);
      save();
    },
  };
  render();
}

// Some hosts (sandboxed previews) refuse service workers; the game works without one.
navigator.serviceWorker?.register('../sw.js').catch(() => {});

addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => document.hidden && active?.save());
route();
