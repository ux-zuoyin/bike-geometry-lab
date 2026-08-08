const radians = (degrees) => (degrees * Math.PI) / 180;

export function getFramePoints(geometry) {
  const headAngle = radians(geometry.headAngle);
  const seatAngle = radians(geometry.seatAngle);
  const rearX = -Math.sqrt(Math.max(0, geometry.chainstay ** 2 - geometry.bbDrop ** 2));

  const points = {
    bb: { x: 0, y: 0 },
    rearAxle: { x: rearX, y: geometry.bbDrop },
    frontAxle: { x: rearX + geometry.wheelbase, y: geometry.bbDrop },
    headTop: { x: geometry.reach, y: geometry.stack },
    seatTop: {
      x: -geometry.seatTube * Math.cos(seatAngle),
      y: geometry.seatTube * Math.sin(seatAngle),
    },
  };

  points.headBottom = {
    x: points.headTop.x + geometry.headTube * Math.cos(headAngle),
    y: points.headTop.y - geometry.headTube * Math.sin(headAngle),
  };

  return points;
}

export const PROJECT_SCALE = 0.41;

export function createProjector({ originX = 430, originY = 420, scale = PROJECT_SCALE } = {}) {
  return ({ x, y }) => ({ x: originX + x * scale, y: originY - y * scale });
}

export const WHEEL_RADIUS = 336;
