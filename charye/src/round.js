// One play of a stage: numbers 1..size² are scattered on the board; tapping the next number
// empties its cell, which is refilled with the next number not yet shown until `max` is out.

export class Round {
  constructor(size, max, random = Math.random) {
    this.size = size;
    this.max = max;
    const numbers = Array.from({ length: size * size }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    this.cells = numbers; // number, or null for an emptied cell
    this.next = 1;
    this.nextFill = size * size + 1;
  }

  get done() {
    return this.next > this.max;
  }

  // Returns 'ok', 'wrong', or 'done' (the last number was tapped).
  tap(index) {
    if (this.done || this.cells[index] !== this.next) return 'wrong';
    this.next++;
    this.cells[index] = this.nextFill <= this.max ? this.nextFill++ : null;
    return this.done ? 'done' : 'ok';
  }
}
