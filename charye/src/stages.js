// Stage layout: 50 stages per board size, 5×5 up to 10×10. Within a size the highest number
// grows by one each stage, starting from size² (a full board with no refills).
export const PER_SIZE = 50;
export const MIN_SIZE = 5;
export const MAX_SIZE = 10;
export const TOTAL = PER_SIZE * (MAX_SIZE - MIN_SIZE + 1);

// stage is 1-based.
export function stageInfo(stage) {
  const block = Math.floor((stage - 1) / PER_SIZE);
  const size = MIN_SIZE + block;
  const step = (stage - 1) % PER_SIZE;
  return { size, max: size * size + step, step: step + 1 };
}
