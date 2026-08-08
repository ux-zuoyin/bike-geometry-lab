export const PREVIEW_MOTION_CONFIG = Object.freeze({
  wheelDurationSeconds: 4.2,
  crankDurationSeconds: 6.4,
});

export function getRotationAnimation(center) {
  return {
    from: `0 ${center.x} ${center.y}`,
    to: `360 ${center.x} ${center.y}`,
  };
}

export function oppositePointAround(center, point) {
  return {
    x: center.x * 2 - point.x,
    y: center.y * 2 - point.y,
  };
}
