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
