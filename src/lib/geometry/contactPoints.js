export function getPedalPoint(fit) {
  return {
    x: fit.crankLength * 0.72,
    y: -fit.crankLength * 0.69,
  };
}

export function pointDelta(a, b) {
  return { x: Math.round(a.x - b.x), y: Math.round(a.y - b.y) };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
