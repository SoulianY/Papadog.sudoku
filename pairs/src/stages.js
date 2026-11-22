// 350 stages: 50 per layout, from 6 cards to 36. The picture set changes from stage to stage.
export const LAYOUTS = [
  { pairs: 3, cols: 3 },
  { pairs: 6, cols: 4 },
  { pairs: 8, cols: 4 },
  { pairs: 10, cols: 4 },
  { pairs: 12, cols: 4 },
  { pairs: 15, cols: 5 },
  { pairs: 18, cols: 6 },
];
export const PER_LAYOUT = 50;
export const TOTAL = LAYOUTS.length * PER_LAYOUT;

// Emoji old enough to render the same way on current iPhones and Galaxies.
export const SETS = [
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐙'],
  ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝', '🍅', '🥑', '🥕', '🌽', '🍆', '🥥'],
  ['🍔', '🍟', '🍕', '🌭', '🌮', '🍣', '🍩', '🍪', '🎂', '🍦', '🍫', '🍿', '🥐', '🥨', '🧀', '🍙', '🍜', '🥞'],
  ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎳', '🏒', '🥋', '🎯', '🛹', '🎿'],
  ['🚗', '🚕', '🚌', '🚑', '🚒', '🚓', '🚜', '🚲', '🛵', '🚂', '✈️', '🚀', '🚁', '⛵', '🚤', '🛸', '🚠', '🛶'],
  ['🌸', '🌻', '🌵', '🌲', '🍁', '🍄', '🌈', '⭐', '🌙', '☀️', '⛄', '🔥', '💧', '🌊', '🍀', '🌷', '🌹', '🌴'],
  ['⏰', '📷', '💡', '🔑', '🎁', '🎈', '📚', '✏️', '🎸', '🎺', '🥁', '🎹', '🧸', '👓', '🎩', '👑', '💎', '🔔'],
];

// How long all cards are shown face up before play: 1 s for 6 cards up to 3 s for 36, in 0.1 s steps.
const PREVIEW_MIN = 1000;
const PREVIEW_MAX = 3000;
const fewest = LAYOUTS[0].pairs * 2;
const most = LAYOUTS.at(-1).pairs * 2;
export const previewMs = (cards) => Math.round((PREVIEW_MIN + ((PREVIEW_MAX - PREVIEW_MIN) * (cards - fewest)) / (most - fewest)) / 100) * 100;

export function stageInfo(stage) {
  const layout = LAYOUTS[Math.floor((stage - 1) / PER_LAYOUT)];
  return { ...layout, preview: previewMs(layout.pairs * 2), symbols: SETS[(stage - 1) % SETS.length].slice(0, layout.pairs) };
}
