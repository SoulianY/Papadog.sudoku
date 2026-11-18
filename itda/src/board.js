// SVG board: renders a Puzzle and turns pointer drags into path moves.

const NS = 'http://www.w3.org/2000/svg';
const CELL = 100;
// The path end stays selected until the finger is this fraction of a cell beyond its edges,
// so wobbling across a grid line neither extends nor cuts the path.
const HEAD_REACH = 0.3;

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

export class Board {
  constructor(svg, onChange) {
    this.svg = svg;
    this.onChange = onChange;
    this.dragging = false;
    svg.addEventListener('pointerdown', (e) => this.pointerDown(e));
    svg.addEventListener('pointermove', (e) => this.pointerMove(e));
    for (const type of ['pointerup', 'pointercancel']) svg.addEventListener(type, () => { this.dragging = false; });
  }

  load(puzzle) {
    this.puzzle = puzzle;
    const { size } = puzzle;
    const span = size * CELL;
    const svg = this.svg;
    svg.replaceChildren();
    svg.setAttribute('viewBox', `0 0 ${span} ${span}`);

    const center = (cell) => [(cell % size) * CELL + CELL / 2, Math.floor(cell / size) * CELL + CELL / 2];
    this.center = center;

    this.cellRects = [];
    for (let c = 0; c < puzzle.total; c++) {
      this.cellRects.push(el('rect', {
        x: (c % size) * CELL, y: Math.floor(c / size) * CELL, width: CELL, height: CELL, class: 'cell',
      }, svg));
    }
    const grid = el('g', { class: 'grid' }, svg);
    for (let i = 1; i < size; i++) {
      el('line', { x1: i * CELL, y1: 0, x2: i * CELL, y2: span }, grid);
      el('line', { x1: 0, y1: i * CELL, x2: span, y2: i * CELL }, grid);
    }

    this.trail = el('polyline', { class: 'trail' }, svg);

    const walls = el('g', { class: 'walls' }, svg);
    for (const key of puzzle.walls) {
      const [a, b] = key.split('-').map(Number);
      const [ax, ay] = center(a), [bx, by] = center(b);
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const half = CELL / 2;
      if (ay === by) el('line', { x1: mx, y1: my - half, x2: mx, y2: my + half }, walls);
      else el('line', { x1: mx - half, y1: my, x2: mx + half, y2: my }, walls);
    }

    this.clueNodes = puzzle.clues.map((cell, i) => {
      const [x, y] = center(cell);
      const g = el('g', { class: 'clue' }, svg);
      el('circle', { cx: x, cy: y, r: CELL * 0.32 }, g);
      el('text', { x, y, dy: '0.35em' }, g).textContent = i + 1;
      return g;
    });

    el('rect', { x: 0, y: 0, width: span, height: span, rx: 6, class: 'frame' }, svg);
    this.render();
  }

  render() {
    const { path, solved } = this.puzzle;
    const onPath = new Set(path);
    this.cellRects.forEach((r, c) => r.classList.toggle('filled', onPath.has(c)));
    this.trail.setAttribute('points', path.map((c) => this.center(c).join(',')).join(' '));
    this.clueNodes.forEach((g, i) => g.classList.toggle('reached', onPath.has(this.puzzle.clues[i])));
    this.svg.classList.toggle('solved', solved);
  }

  cellFromEvent(e) {
    const rect = this.svg.getBoundingClientRect();
    const { size } = this.puzzle;
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    if (col < 0 || row < 0 || col >= size || row >= size) return -1;
    return row * size + col;
  }

  // True while the pointer is on the path end or within HEAD_REACH of it.
  nearHead(e) {
    const rect = this.svg.getBoundingClientRect();
    const { size, head } = this.puzzle;
    const x = ((e.clientX - rect.left) / rect.width) * size - (head % size);
    const y = ((e.clientY - rect.top) / rect.height) * size - Math.floor(head / size);
    return x > -HEAD_REACH && x < 1 + HEAD_REACH && y > -HEAD_REACH && y < 1 + HEAD_REACH;
  }

  pointerDown(e) {
    if (!this.puzzle || this.puzzle.solved) return;
    const cell = this.nearHead(e) ? this.puzzle.head : this.cellFromEvent(e);
    if (cell === -1) return;
    const onPath = this.puzzle.path.includes(cell);
    if (!onPath && !this.puzzle.canExtend(cell)) return;
    this.svg.setPointerCapture(e.pointerId);
    this.dragging = true;
    this.apply(cell);
  }

  pointerMove(e) {
    if (!this.dragging || this.nearHead(e)) return;
    const cell = this.cellFromEvent(e);
    if (cell !== -1) this.apply(cell);
  }

  apply(cell) {
    if (!this.puzzle.moveTo(cell)) return;
    this.render();
    this.onChange();
  }
}
