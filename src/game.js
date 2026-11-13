// Game state for one puzzle: entries, pencil notes, undo history. No DOM.
import { PEERS, parse } from './sudoku.js';

export class Game {
  #givens;
  #answer;
  #history = [];

  constructor(puzzle, solution, save) {
    this.#givens = parse(puzzle);
    this.#answer = parse(solution);
    this.values = save ? [...save.values] : [...this.#givens];
    this.notes = save ? [...save.notes] : Array(81).fill(0); // bit d set = note d
    this.elapsed = save?.elapsed ?? 0;
  }

  isGiven = (i) => this.#givens[i] !== 0;
  isWrong = (i) => this.values[i] !== 0 && this.values[i] !== this.#answer[i];
  hasNote = (i, d) => (this.notes[i] & (1 << d)) !== 0;

  get solved() {
    return this.values.every((v, i) => v === this.#answer[i]);
  }

  /** How many of digit d are still to be placed correctly. */
  remaining(d) {
    return 9 - this.values.filter((v, i) => v === d && v === this.#answer[i]).length;
  }

  get canUndo() {
    return this.#history.length > 0;
  }

  setValue(i, d) {
    if (this.isGiven(i) || this.values[i] === d) return;
    this.#record();
    this.values[i] = d;
    this.notes[i] = 0;
    if (d === this.#answer[i]) for (const j of PEERS[i]) this.notes[j] &= ~(1 << d);
  }

  toggleNote(i, d) {
    if (this.isGiven(i) || this.values[i] !== 0) return;
    this.#record();
    this.notes[i] ^= 1 << d;
  }

  erase(i) {
    if (this.isGiven(i) || (this.values[i] === 0 && this.notes[i] === 0)) return;
    this.#record();
    this.values[i] = 0;
    this.notes[i] = 0;
  }

  /** Fills cell i with its answer, or the first unsolved cell if i is already right. Returns the cell filled. */
  hint(i) {
    const target = i !== null && this.values[i] !== this.#answer[i]
      ? i
      : this.values.findIndex((v, j) => v !== this.#answer[j]);
    this.setValue(target, this.#answer[target]);
    return target;
  }

  undo() {
    const last = this.#history.pop();
    if (!last) return;
    this.values = last.values;
    this.notes = last.notes;
  }

  toSave() {
    return { values: this.values, notes: this.notes, elapsed: this.elapsed };
  }

  #record() {
    this.#history.push({ values: [...this.values], notes: [...this.notes] });
  }
}
