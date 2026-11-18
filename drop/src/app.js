import * as engine from './engine.js';
import { drawField, drawPreview, readColors } from './render.js';
import { bindGestures, bindKeys } from './input.js';
import { loadBest, saveBest } from './storage.js';

const $ = (sel) => document.querySelector(sel);
const field = $('.field');
const fieldCanvas = $('canvas.board');
const holdCanvas = $('canvas.hold');
const nextCanvas = $('canvas.next');
const startDialog = $('dialog.start');
const pauseDialog = $('dialog.pause');
const overDialog = $('dialog.over');

let s = null;
let running = false;
let last = 0;
let best = loadBest();

function render() {
  drawField(fieldCanvas, s);
  drawPreview(holdCanvas, [s.hold], !s.canHold);
  drawPreview(nextCanvas, engine.upcoming(s, 3));
  $('.score').textContent = s.score.toLocaleString();
  $('.level').textContent = s.level;
  $('.lines').textContent = s.lines;
}

function frame(t) {
  if (!running) return;
  engine.update(s, Math.min(t - last, 100));
  last = t;
  afterAction();
  if (running) requestAnimationFrame(frame);
}

function afterAction() {
  render();
  if (s.over) finish();
}

function start() {
  s = engine.newGame();
  resume();
}

function resume() {
  running = true;
  last = performance.now();
  requestAnimationFrame(frame);
}

function pause() {
  if (!running) return;
  running = false;
  pauseDialog.showModal();
}

function finish() {
  running = false;
  if (s.score > best) {
    best = s.score;
    saveBest(best);
  }
  $('.final').textContent = `${s.score.toLocaleString()}점`;
  $('.final-best').textContent = `최고 ${best.toLocaleString()}점`;
  overDialog.showModal();
}

let linesBefore = 0;
function act(action) {
  if (action === 'pause') return pause();
  if (!running) return;
  linesBefore = s.lines;
  switch (action) {
    case 'left': engine.move(s, -1); break;
    case 'right': engine.move(s, 1); break;
    case 'rotate': engine.rotate(s, 1); break;
    case 'rotateBack': engine.rotate(s, -1); break;
    case 'soft': engine.softDrop(s); break;
    case 'drop': engine.hardDrop(s); break;
    case 'hold': engine.hold(s); break;
  }
  if (s.lines > linesBefore) navigator.vibrate?.(30);
  afterAction();
}

bindGestures(field, () => fieldCanvas.getBoundingClientRect().width / engine.COLS, act);
bindKeys(act);

$('.pause-btn').addEventListener('click', pause);
$('.hold-box').addEventListener('click', () => act('hold'));
$('.begin').addEventListener('click', () => { startDialog.close(); start(); });
$('.continue').addEventListener('click', () => { pauseDialog.close(); resume(); });
$('.restart').addEventListener('click', () => { pauseDialog.close(); start(); });
$('.again').addEventListener('click', () => { overDialog.close(); start(); });
for (const d of [startDialog, pauseDialog, overDialog]) d.addEventListener('cancel', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); if (s) render(); });

readColors();
$('.start-best').textContent = best ? `최고 ${best.toLocaleString()}점` : '';
startDialog.showModal();
navigator.serviceWorker?.register('../sw.js').catch(() => {});
