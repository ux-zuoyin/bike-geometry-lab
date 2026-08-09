export const PEDAL_BASE_ANGLE_DEG = -43.8;

export function getPedalPoint(fit) {
  const angle = (PEDAL_BASE_ANGLE_DEG * Math.PI) / 180;
  return {
    x: fit.crankLength * Math.cos(angle),
    y: fit.crankLength * Math.sin(angle),
  };
}

export function pointDelta(a, b) {
  return { x: Math.round(a.x - b.x), y: Math.round(a.y - b.y) };
}
