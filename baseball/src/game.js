// Number baseball: guess a secret of distinct digits 1–9. A strike is a right digit in the right
// place, a ball a right digit in the wrong place.
export const MAX_TRIES = 10;

export function makeSecret(length, random = Math.random) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length);
}

export function judge(secret, guess) {
  let strike = 0, ball = 0;
  guess.forEach((d, i) => {
    if (secret[i] === d) strike++;
    else if (secret.includes(d)) ball++;
  });
  return { strike, ball };
}

export class Game {
  constructor(length, random) {
    this.length = length;
    this.secret = makeSecret(length, random);
    this.history = []; // { guess, strike, ball }
  }

  get won() {
    return this.history.at(-1)?.strike === this.length;
  }

  get over() {
    return this.won || this.history.length >= MAX_TRIES;
  }

  guess(digits) {
    if (this.over || digits.length !== this.length || new Set(digits).size !== digits.length) return null;
    const result = { guess: digits, ...judge(this.secret, digits) };
    this.history.push(result);
    return result;
  }
}
