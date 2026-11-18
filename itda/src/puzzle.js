// Pure game rules: one path from clue 1 through every cell, visiting clues in order, ending on the last clue.

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export class Puzzle {
  constructor(level) {
    this.size = level.size;
    this.total = level.size * level.size;
    this.clues = level.clues;
    this.walls = new Set(level.walls.map(([a, b]) => edgeKey(a, b)));
    this.clueAt = new Map(level.clues.map((cell, i) => [cell, i]));
    this.reset();
  }

  reset() {
    this.path = [this.clues[0]];
  }

  get head() {
    return this.path[this.path.length - 1];
  }

  get solved() {
    return this.path.length === this.total && this.head === this.clues[this.clues.length - 1];
  }

  connected(a, b) {
    const ra = Math.floor(a / this.size), rb = Math.floor(b / this.size);
    const adjacent = (ra === rb && Math.abs(a - b) === 1) || Math.abs(a - b) === this.size;
    return adjacent && !this.walls.has(edgeKey(a, b));
  }

  // Index of the next clue the path must reach.
  nextClue() {
    let next = 0;
    for (const cell of this.path) if (this.clueAt.get(cell) === next) next++;
    return next;
  }

  canExtend(cell) {
    if (this.path.includes(cell) || !this.connected(this.head, cell)) return false;
    if (this.head === this.clues[this.clues.length - 1]) return false;
    const clue = this.clueAt.get(cell);
    return clue === undefined || clue === this.nextClue();
  }

  // Moves the path end toward `cell`: backtracks if it is on the path, otherwise extends
  // step by step along a straight line (pointer events can skip cells on fast drags).
  moveTo(cell) {
    const i = this.path.indexOf(cell);
    if (i !== -1) {
      if (i === this.path.length - 1) return false;
      this.path.length = i + 1;
      return true;
    }
    const steps = this.straightLine(this.head, cell);
    if (!steps) return false;
    let changed = false;
    for (const step of steps) {
      if (!this.canExtend(step)) break;
      this.path.push(step);
      changed = true;
    }
    return changed;
  }

  straightLine(from, to) {
    const fr = Math.floor(from / this.size), fc = from % this.size;
    const tr = Math.floor(to / this.size), tc = to % this.size;
    if (fr !== tr && fc !== tc) return null;
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    const steps = [];
    for (let r = fr + dr, c = fc + dc; ; r += dr, c += dc) {
      steps.push(r * this.size + c);
      if (r === tr && c === tc) return steps;
    }
  }

  undo() {
    if (this.path.length > 1) this.path.pop();
  }
}
