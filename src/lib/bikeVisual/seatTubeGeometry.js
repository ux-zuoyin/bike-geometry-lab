export const ALL_ROUND_SEAT_TUBE_TOP_SOURCE_HALF_WIDTH_PX = 10.5;
export const ALL_ROUND_SEAT_TUBE_BOTTOM_SOURCE_HALF_WIDTH_PX = 13;

const difference = (end, start) => ({ x: end.x - start.x, y: end.y - start.y });
const dot = (first, second) => first.x * second.x + first.y * second.y;

const addScaled = (point, vector, scale) => ({
  x: point.x + vector.x * scale,
  y: point.y + vector.y * scale,
});

const pathPoint = (point) => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;

export function getAllRoundSeatTubeShape({
  bottomBracket,
  seatTubeTop,
  towardPoint,
  topHalfWidthPx,
  bottomHalfWidthPx,
}) {
  const axis = difference(seatTubeTop, bottomBracket);
  const length = Math.hypot(axis.x, axis.y) || 1;
  const direction = { x: axis.x / length, y: axis.y / length };
  let headwardNormal = { x: -direction.y, y: direction.x };
  if (dot(headwardNormal, difference(towardPoint, seatTubeTop)) < 0) {
    headwardNormal = { x: -headwardNormal.x, y: -headwardNormal.y };
  }
  const headwardBottom = addScaled(bottomBracket, headwardNormal, bottomHalfWidthPx);
  const headwardTop = addScaled(seatTubeTop, headwardNormal, topHalfWidthPx);
  const rearwardTop = addScaled(seatTubeTop, headwardNormal, -topHalfWidthPx);
  const rearwardBottom = addScaled(bottomBracket, headwardNormal, -bottomHalfWidthPx);
  const points = [headwardBottom, headwardTop, rearwardTop, rearwardBottom];

  return {
    direction,
    headwardNormal,
    headwardBottom,
    headwardTop,
    rearwardTop,
    rearwardBottom,
    points,
    path: `M${points.map(pathPoint).join("L")}Z`,
  };
}

/**
 * Produces a tube body around a live axis with rounded cap transitions.
 *
 * The returned headward boundary remains a straight, anchor-derived side of
 * the tube so neighbouring tube shapes can intersect it deterministically.
 * Rounding is applied only at the four visual corners, rather than by scaling
 * an exported SVG or perturbing Geometry anchors.
 */
export function getRoundedTubeShape({
  bottomBracket,
  seatTubeTop,
  towardPoint,
  topHalfWidthPx,
  bottomHalfWidthPx = topHalfWidthPx,
  cornerRadiusPx,
}) {
  const axis = difference(seatTubeTop, bottomBracket);
  const length = Math.hypot(axis.x, axis.y) || 1;
  const direction = { x: axis.x / length, y: axis.y / length };
  let headwardNormal = { x: -direction.y, y: direction.x };
  if (dot(headwardNormal, difference(towardPoint, seatTubeTop)) < 0) {
    headwardNormal = { x: -headwardNormal.x, y: -headwardNormal.y };
  }

  const radius = Math.max(0, Math.min(
    cornerRadiusPx,
    topHalfWidthPx * 0.78,
    bottomHalfWidthPx * 0.78,
    length * 0.18,
  ));
  // These outer endpoints stay on the full tube sides. Neighbouring tubes use
  // them as stable intersection boundaries; only the painted cap is inset.
  const headwardBottom = addScaled(bottomBracket, headwardNormal, bottomHalfWidthPx);
  const headwardTop = addScaled(seatTubeTop, headwardNormal, topHalfWidthPx);
  const rearwardTop = addScaled(seatTubeTop, headwardNormal, -topHalfWidthPx);
  const rearwardBottom = addScaled(bottomBracket, headwardNormal, -bottomHalfWidthPx);
  const headwardBottomCapStart = addScaled(headwardBottom, direction, radius);
  const headwardTopCapEnd = addScaled(headwardTop, direction, -radius);
  const rearwardTopCapStart = addScaled(rearwardTop, direction, -radius);
  const rearwardBottomCapEnd = addScaled(rearwardBottom, direction, radius);

  const topHeadwardShoulder = addScaled(seatTubeTop, headwardNormal, topHalfWidthPx - radius);
  const topRearwardShoulder = addScaled(seatTubeTop, headwardNormal, -topHalfWidthPx + radius);
  const bottomRearwardShoulder = addScaled(bottomBracket, headwardNormal, -bottomHalfWidthPx + radius);
  const bottomHeadwardShoulder = addScaled(bottomBracket, headwardNormal, bottomHalfWidthPx - radius);
  const topHeadwardCorner = addScaled(seatTubeTop, headwardNormal, topHalfWidthPx);
  const topRearwardCorner = addScaled(seatTubeTop, headwardNormal, -topHalfWidthPx);
  const bottomRearwardCorner = addScaled(bottomBracket, headwardNormal, -bottomHalfWidthPx);
  const bottomHeadwardCorner = addScaled(bottomBracket, headwardNormal, bottomHalfWidthPx);
  const points = [headwardBottom, headwardTop, rearwardTop, rearwardBottom];

  return {
    direction,
    headwardNormal,
    headwardBottom,
    headwardTop,
    rearwardTop,
    rearwardBottom,
    cornerRadiusPx: radius,
    points,
    path: [
      `M${pathPoint(headwardBottomCapStart)}`,
      `L${pathPoint(headwardTopCapEnd)}`,
      `Q${pathPoint(topHeadwardCorner)} ${pathPoint(topHeadwardShoulder)}`,
      `L${pathPoint(topRearwardShoulder)}`,
      `Q${pathPoint(topRearwardCorner)} ${pathPoint(rearwardTopCapStart)}`,
      `L${pathPoint(rearwardBottomCapEnd)}`,
      `Q${pathPoint(bottomRearwardCorner)} ${pathPoint(bottomRearwardShoulder)}`,
      `L${pathPoint(bottomHeadwardShoulder)}`,
      `Q${pathPoint(bottomHeadwardCorner)} ${pathPoint(headwardBottomCapStart)}`,
      "Z",
    ].join(""),
  };
}
