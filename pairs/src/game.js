// Memory: cards lie face down in pairs; open two at a time, matching pairs stay open.

export class Board {
  constructor(pairs, random = Math.random) {
    const ids = Array.from({ length: pairs * 2 }, (_, i) => i >> 1);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    this.cards = ids.map((id) => ({ id, open: false, matched: false }));
    this.first = -1; // index of the single open card waiting for its partner
    this.miss = []; // two unmatched cards left open for a moment
    this.moves = 0; // pairs tried
  }

  get done() {
    return this.cards.every((c) => c.matched);
  }

  // Closes a pending mismatch; called after a short delay, or by the next flip.
  hideMiss() {
    for (const i of this.miss) this.cards[i].open = false;
    this.miss = [];
  }

  // Returns 'ignored', 'first', 'match' or 'miss'.
  flip(i) {
    const card = this.cards[i];
    if (card.open || card.matched) return 'ignored';
    this.hideMiss();
    card.open = true;
    if (this.first === -1) {
      this.first = i;
      return 'first';
    }
    const other = this.cards[this.first];
    this.moves++;
    if (other.id === card.id) {
      other.matched = card.matched = true;
      this.first = -1;
      return 'match';
    }
    this.miss = [this.first, i];
    this.first = -1;
    return 'miss';
  }
}
