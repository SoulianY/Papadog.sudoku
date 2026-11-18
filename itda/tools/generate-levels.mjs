// Generates levels.json: 500 puzzles with unique solutions.
// Run: node tools/generate-levels.mjs
import { writeFileSync } from 'node:fs';

const LEVEL_COUNT = 500;
const SEED = 20261118;
const SOLVER_NODE_LIMIT = 200000;

// Difficulty profiles: grid sizes and the floor on how many clue numbers remain.
const PROFILES = [
  { name: 'easy', sizes: [5, 6], wallRate: 0.0, clueRatio: 0.28 },
  { name: 'normal', sizes: [6, 7], wallRate: 0.08, clueRatio: 0.16 },
  { name: 'hard', sizes: [7, 8], wallRate: 0.12, clueRatio: 0 },
];

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const randInt = (n) => Math.floor(rng() * n);
const pick = (arr) => arr[randInt(arr.length)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function neighbors(size, c) {
  const r = Math.floor(c / size), col = c % size, out = [];
  if (r > 0) out.push(c - size);
  if (r < size - 1) out.push(c + size);
  if (col > 0) out.push(c - 1);
  if (col < size - 1) out.push(c + 1);
  return out;
}

// Random Hamiltonian path via the backbite algorithm (Mansfield).
function randomHamiltonianPath(size) {
  const path = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) path.push(r * size + (r % 2 ? size - 1 - c : c));
  }
  const steps = size * size * size * 20;
  for (let s = 0; s < steps; s++) {
    if (rng() < 0.5) path.reverse();
    const end = path[path.length - 1];
    const prev = path[path.length - 2];
    const nb = pick(neighbors(size, end).filter((n) => n !== prev));
    if (nb === undefined) continue;
    const i = path.indexOf(nb);
    const tail = path.splice(i + 1).reverse();
    path.push(...tail);
  }
  return path;
}

const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Counts solutions up to 2. Returns 2 if the search exceeds the node limit (treated as ambiguous).
function countSolutions(size, clues, walls) {
  const total = size * size;
  const clueAt = new Int16Array(total).fill(-1);
  clues.forEach((c, i) => { clueAt[c] = i; });
  const last = clues.length - 1;
  const adj = [];
  for (let c = 0; c < total; c++) adj.push(neighbors(size, c).filter((n) => !walls.has(edgeKey(c, n))));
  const visited = new Uint8Array(total);
  const stack = new Int16Array(total);
  let nodes = 0, found = 0;

  function feasible(head, nextClue) {
    // Each unvisited cell needs enough free neighbours; unvisited cells must stay connected to head.
    let deadEnds = 0;
    for (let c = 0; c < total; c++) {
      if (visited[c]) continue;
      let free = 0;
      for (const n of adj[c]) if (!visited[n] || n === head) free++;
      if (free === 0) return false;
      if (free === 1 && c !== clues[last]) { deadEnds++; if (deadEnds > 1) return false; }
    }
    let sp = 0, seen = 1;
    const mark = new Uint8Array(total);
    mark[head] = 1; stack[sp++] = head;
    let remaining = 0;
    for (let c = 0; c < total; c++) if (!visited[c]) remaining++;
    while (sp) {
      const c = stack[--sp];
      for (const n of adj[c]) {
        if (!mark[n] && !visited[n]) { mark[n] = 1; seen++; stack[sp++] = n; }
      }
    }
    return seen - 1 === remaining && (nextClue > last || mark[clues[nextClue]]);
  }

  function dfs(head, depth, nextClue) {
    if (found > 1 || ++nodes > SOLVER_NODE_LIMIT) return;
    if (depth === total) { if (head === clues[last]) found++; return; }
    if (head === clues[last]) return;
    if (!feasible(head, nextClue)) return;
    for (const n of adj[head]) {
      if (visited[n]) continue;
      const k = clueAt[n];
      if (k !== -1 && k !== nextClue) continue;
      visited[n] = 1;
      dfs(n, depth + 1, k === -1 ? nextClue : nextClue + 1);
      visited[n] = 0;
    }
  }

  visited[clues[0]] = 1;
  dfs(clues[0], 1, 1);
  return nodes > SOLVER_NODE_LIMIT ? 2 : found;
}

function makeLevel(profileIndex) {
  const profile = PROFILES[profileIndex];
  const size = pick(profile.sizes);
  const total = size * size;
  const path = randomHamiltonianPath(size);

  const pathEdges = new Set();
  for (let i = 1; i < total; i++) pathEdges.add(edgeKey(path[i - 1], path[i]));
  const walls = new Set();
  for (let c = 0; c < total; c++) {
    for (const n of neighbors(size, c)) {
      if (n > c && !pathEdges.has(edgeKey(c, n)) && rng() < profile.wallRate) walls.add(edgeKey(c, n));
    }
  }

  // Start with every cell as a clue, then remove interior clues while the solution stays unique.
  let kept = path.map((_, i) => i);
  const minClues = Math.max(2, Math.round(total * profile.clueRatio));
  for (const idx of shuffle(kept.slice(1, -1))) {
    if (kept.length <= minClues) break;
    const trial = kept.filter((i) => i !== idx);
    if (countSolutions(size, trial.map((i) => path[i]), walls) === 1) kept = trial;
  }

  return {
    size,
    difficulty: profile.name,
    clues: kept.map((i) => path[i]),
    walls: [...walls].map((k) => k.split('-').map(Number)),
  };
}

const levels = [];
for (let i = 0; i < LEVEL_COUNT; i++) {
  levels.push(makeLevel(randInt(PROFILES.length)));
  if ((i + 1) % 50 === 0) console.log(`${i + 1}/${LEVEL_COUNT}`);
}
writeFileSync(new URL('../levels.json', import.meta.url), JSON.stringify(levels));
const tally = Object.groupBy(levels, (l) => l.difficulty);
console.log(Object.entries(tally).map(([k, v]) => `${k}: ${v.length}`).join(', '));
