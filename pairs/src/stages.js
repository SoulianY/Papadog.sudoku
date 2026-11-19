// 70 stages: 10 per layout, from 6 cards to 36. The picture set changes from stage to stage.
export const LAYOUTS = [
  { pairs: 3, cols: 3 },
  { pairs: 6, cols: 4 },
  { pairs: 8, cols: 4 },
  { pairs: 10, cols: 4 },
  { pairs: 12, cols: 4 },
  { pairs: 15, cols: 5 },
  { pairs: 18, cols: 6 },
];
export const PER_LAYOUT = 10;
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

export function stageInfo(stage) {
  const layout = LAYOUTS[Math.floor((stage - 1) / PER_LAYOUT)];
  return { ...layout, symbols: SETS[(stage - 1) % SETS.length].slice(0, layout.pairs) };
}
