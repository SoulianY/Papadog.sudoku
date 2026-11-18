// Touch gestures and keys → game actions.
//   tap: rotate · drag sideways: move a column per cell width · drag down: soft drop
//   flick down: hard drop · flick up: hold
const TAP_SLOP = 10; // px a finger may wander and still count as a tap
const FLICK_SPEED = 0.6; // px per ms over the last moments of a gesture (a slow drag is ~0.1–0.3)

export function bindGestures(area, cellSize, act) {
  let g = null;

  area.addEventListener('pointerdown', (e) => {
    area.setPointerCapture(e.pointerId);
    g = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null, stepsX: 0, stepsY: 0, samples: [] };
  });

  area.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    g.samples.push({ y: e.clientY, t: e.timeStamp });
    if (g.samples.length > 8) g.samples.shift();
    if (!g.axis) {
      if (Math.hypot(dx, dy) < TAP_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : dy > 0 ? 'down' : 'up';
    }
    const cell = cellSize();
    if (g.axis === 'x') {
      const steps = Math.trunc(dx / cell);
      while (g.stepsX < steps) { act('right'); g.stepsX++; }
      while (g.stepsX > steps) { act('left'); g.stepsX--; }
    } else if (g.axis === 'down') {
      const steps = Math.trunc(dy / cell);
      while (g.stepsY < steps) { act('soft'); g.stepsY++; }
    }
  });

  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const first = g.samples.find((s) => e.timeStamp - s.t < 120) ?? g.samples[0];
    const speed = first ? (e.clientY - first.y) / Math.max(1, e.timeStamp - first.t) : 0;
    if (!g.axis) act('rotate');
    else if (g.axis === 'down' && speed > FLICK_SPEED) act('drop');
    else if (g.axis === 'up' && speed < -FLICK_SPEED) act('hold');
    g = null;
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', () => { g = null; });
}

const KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', ArrowUp: 'rotate', x: 'rotate', X: 'rotate',
  z: 'rotateBack', Z: 'rotateBack', ' ': 'drop', c: 'hold', C: 'hold', Shift: 'hold', p: 'pause', P: 'pause', Escape: 'pause',
};

export function bindKeys(act) {
  addEventListener('keydown', (e) => {
    const action = KEYS[e.key];
    if (!action) return;
    e.preventDefault();
    act(action);
  });
}
