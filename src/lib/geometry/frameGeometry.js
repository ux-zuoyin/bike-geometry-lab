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

export const REFERENCE_WHEEL_OUTER_DIAMETER_MM = 686;
export const RENDERED_WHEEL_DIAMETER_PX = 275.52;
export const PIXELS_PER_MM = RENDERED_WHEEL_DIAMETER_PX / REFERENCE_WHEEL_OUTER_DIAMETER_MM;
export const WHEEL_RADIUS = REFERENCE_WHEEL_OUTER_DIAMETER_MM / 2;

export function createProjector({ originX = 430, originY = 420, scale = PIXELS_PER_MM } = {}) {
  return ({ x, y }) => ({ x: originX + x * scale, y: originY - y * scale });
}

const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export function getPhysicalScaleAudit(frame, geometry, project = createProjector()) {
  const projected = Object.fromEntries(Object.entries(frame).map(([key, point]) => [key, project(point)]));
  const measurements = [
    { key: "Wheelbase", expectedMm: geometry.wheelbase, renderedPx: distance(projected.rearAxle, projected.frontAxle) },
    { key: "Stack", expectedMm: geometry.stack, renderedPx: Math.abs(projected.headTop.y - projected.bb.y) },
    { key: "Reach", expectedMm: geometry.reach, renderedPx: Math.abs(projected.headTop.x - projected.bb.x) },
    { key: "HeadTube", expectedMm: geometry.headTube, renderedPx: distance(projected.headTop, projected.headBottom) },
  ].map((metric) => {
    const renderedMm = metric.renderedPx / PIXELS_PER_MM;
    return Object.freeze({ ...metric, renderedMm, errorMm: renderedMm - metric.expectedMm });
  });

  return Object.freeze({
    referenceWheelDiameterMm: REFERENCE_WHEEL_OUTER_DIAMETER_MM,
    renderedWheelDiameterPx: RENDERED_WHEEL_DIAMETER_PX,
    pixelsPerMm: PIXELS_PER_MM,
    measurements: Object.freeze(measurements),
  });
}
