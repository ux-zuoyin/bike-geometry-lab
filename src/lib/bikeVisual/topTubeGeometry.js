export const TOP_TUBE_VISUAL_REFERENCES = Object.freeze({
  endurance: Object.freeze({
    centerlineSlope: -0.2083948153886393,
    centerlineAngleDeg: -11.771665019483962,
    sourceSeatCenter: Object.freeze({ x: 2.25, y: 94.5 }),
    sourceHeadCenter: Object.freeze({ x: 389.7357482910156, y: 13.749979019165039 }),
  }),
  allRound: Object.freeze({
    centerlineSlope: -0.156780013842495,
    centerlineAngleDeg: -8.910300581574058,
    sourceSeatCenter: Object.freeze({ x: 3, y: 94.25 }),
    sourceHeadCenter: Object.freeze({ x: 389.25, y: 28.25 }),
  }),
});

export const ALL_ROUND_TOP_TUBE_HEAD_JOINT_RATIO = 0.82;
export const ALL_ROUND_HEAD_TUBE_SOURCE_HALF_WIDTH_PX = 20;
export const ALL_ROUND_TOP_TUBE_SEAT_SOURCE_HALF_WIDTH_PX = 9.75;
export const ALL_ROUND_TOP_TUBE_HEAD_SOURCE_HALF_WIDTH_PX = 11.25;

const difference = (end, start) => ({ x: end.x - start.x, y: end.y - start.y });
const cross = (first, second) => first.x * second.y - first.y * second.x;

export function intersectInfiniteLines(firstStart, firstEnd, secondStart, secondEnd) {
  const firstDirection = difference(firstEnd, firstStart);
  const secondDirection = difference(secondEnd, secondStart);
  const denominator = cross(firstDirection, secondDirection);
  if (Math.abs(denominator) < 1e-9) return null;
  const firstRatio = cross(difference(secondStart, firstStart), secondDirection) / denominator;
  return {
    x: firstStart.x + firstDirection.x * firstRatio,
    y: firstStart.y + firstDirection.y * firstRatio,
  };
}

export function pointLineDistance(point, lineStart, lineEnd) {
  const line = difference(lineEnd, lineStart);
  const length = Math.hypot(line.x, line.y) || 1;
  return Math.abs(cross(difference(point, lineStart), line)) / length;
}

const lerpPoint = (start, end, ratio) => ({
  x: start.x + (end.x - start.x) * ratio,
  y: start.y + (end.y - start.y) * ratio,
});

const addScaled = (point, vector, scale) => ({
  x: point.x + vector.x * scale,
  y: point.y + vector.y * scale,
});

const unitDirection = (start, end) => {
  const vector = difference(end, start);
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
};

const dot = (first, second) => first.x * second.x + first.y * second.y;

const axisRatio = (point, start, end) => {
  const axis = difference(end, start);
  const denominator = dot(axis, axis) || 1;
  return dot(difference(point, start), axis) / denominator;
};

const pathPoint = (point) => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;

const orientedNormal = (axisStart, axisEnd, towardPoint) => {
  const direction = unitDirection(axisStart, axisEnd);
  let normal = { x: -direction.y, y: direction.x };
  if (dot(normal, difference(towardPoint, axisStart)) < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  return { direction, normal };
};

const intersectEdgeWithBoundary = (edgeStart, edgeEnd, boundaryPoint, boundaryDirection) => (
  intersectInfiniteLines(
    edgeStart,
    edgeEnd,
    boundaryPoint,
    addScaled(boundaryPoint, boundaryDirection, 100),
  )
);

export function fitTopTubeJointsToHeadTubeBoundary({
  bottomBracket,
  seatCluster,
  headBottom,
  headTop,
  topTubeSeatJoint,
  topTubeHeadJoint,
  headTubeBoundaryStart,
  headTubeBoundaryEnd,
  topTubeSeatHalfWidthPx,
  topTubeHeadHalfWidthPx,
  headTubeEndInsetPx = 0,
}) {
  const topTubeDirection = unitDirection(topTubeSeatJoint, topTubeHeadJoint);
  const headTubeDirection = unitDirection(headBottom, headTop);
  const headTubeBoundaryLength = Math.hypot(
    headTubeBoundaryEnd.x - headTubeBoundaryStart.x,
    headTubeBoundaryEnd.y - headTubeBoundaryStart.y,
  ) || 1;
  let fittedHeadJoint = { ...topTubeHeadJoint };
  let fittedSeatJoint = { ...topTubeSeatJoint };
  let upperHeadIntersection = null;
  let lowerHeadIntersection = null;
  let upperBoundaryRatio = 0;
  let lowerBoundaryRatio = 0;
  let totalAdjustmentPx = 0;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const seatwardPoint = addScaled(fittedHeadJoint, topTubeDirection, -100);
    fittedSeatJoint = intersectInfiniteLines(
      fittedHeadJoint,
      seatwardPoint,
      bottomBracket,
      seatCluster,
    ) ?? { ...topTubeSeatJoint };
    const fittedDirection = unitDirection(fittedSeatJoint, fittedHeadJoint);
    const upperNormal = { x: fittedDirection.y, y: -fittedDirection.x };
    const upperSeatReference = addScaled(fittedSeatJoint, upperNormal, topTubeSeatHalfWidthPx);
    const upperHeadReference = addScaled(fittedHeadJoint, upperNormal, topTubeHeadHalfWidthPx);
    const lowerSeatReference = addScaled(fittedSeatJoint, upperNormal, -topTubeSeatHalfWidthPx);
    const lowerHeadReference = addScaled(fittedHeadJoint, upperNormal, -topTubeHeadHalfWidthPx);
    const boundaryDirection = difference(headTubeBoundaryEnd, headTubeBoundaryStart);
    upperHeadIntersection = intersectEdgeWithBoundary(
      upperSeatReference,
      upperHeadReference,
      headTubeBoundaryStart,
      boundaryDirection,
    ) ?? upperHeadReference;
    lowerHeadIntersection = intersectEdgeWithBoundary(
      lowerSeatReference,
      lowerHeadReference,
      headTubeBoundaryStart,
      boundaryDirection,
    ) ?? lowerHeadReference;
    upperBoundaryRatio = axisRatio(upperHeadIntersection, headTubeBoundaryStart, headTubeBoundaryEnd);
    lowerBoundaryRatio = axisRatio(lowerHeadIntersection, headTubeBoundaryStart, headTubeBoundaryEnd);
    const maximumBoundaryRatio = 1 - headTubeEndInsetPx / headTubeBoundaryLength;
    const topOverrunRatio = Math.max(upperBoundaryRatio, lowerBoundaryRatio) - maximumBoundaryRatio;
    if (topOverrunRatio <= 1e-9) break;
    const adjustmentPx = topOverrunRatio * headTubeBoundaryLength;
    fittedHeadJoint = addScaled(fittedHeadJoint, headTubeDirection, -adjustmentPx);
    totalAdjustmentPx += adjustmentPx;
  }

  return {
    topTubeSeatJoint: fittedSeatJoint,
    topTubeHeadJoint: fittedHeadJoint,
    upperHeadIntersection,
    lowerHeadIntersection,
    upperBoundaryRatio,
    lowerBoundaryRatio,
    headTubeEndInsetPx,
    adjustmentPx: totalAdjustmentPx,
  };
}

export function getAllRoundTopTubeShape({
  bottomBracket,
  seatCluster,
  seatTubeBoundaryStart,
  seatTubeBoundaryEnd,
  headBottom,
  headTop,
  topTubeSeatJoint,
  topTubeHeadJoint,
  headTubeHalfWidthPx,
  headTubeBoundaryStart,
  headTubeBoundaryEnd,
  headTubeSeamOverlapPx = 0,
  topTubeSeatHalfWidthPx,
  topTubeHeadHalfWidthPx,
}) {
  const topTubeDirection = unitDirection(topTubeSeatJoint, topTubeHeadJoint);
  const topTubeUpperNormal = {
    x: topTubeDirection.y,
    y: -topTubeDirection.x,
  };
  const seatTubeDirection = unitDirection(bottomBracket, seatCluster);
  const seatTubeHeadwardNormal = orientedNormal(
    bottomBracket,
    seatCluster,
    topTubeHeadJoint,
  ).normal;
  const headTube = orientedNormal(
    headBottom,
    headTop,
    topTubeSeatJoint,
  );
  const suppliedHeadTubeBoundary = headTubeBoundaryStart && headTubeBoundaryEnd;
  const headTubeOuterBoundaryPoint = suppliedHeadTubeBoundary
    ? { ...headTubeBoundaryStart }
    : addScaled(topTubeHeadJoint, headTube.normal, headTubeHalfWidthPx);
  const headTubeIntersectionBoundaryStart = addScaled(
    suppliedHeadTubeBoundary ? headTubeBoundaryStart : headTubeOuterBoundaryPoint,
    headTube.normal,
    -headTubeSeamOverlapPx,
  );
  const headTubeIntersectionBoundaryEnd = addScaled(
    suppliedHeadTubeBoundary ? headTubeBoundaryEnd : addScaled(headTubeOuterBoundaryPoint, headTube.direction, 100),
    headTube.normal,
    -headTubeSeamOverlapPx,
  );
  const topTubeUpperSeatReference = addScaled(
    topTubeSeatJoint,
    topTubeUpperNormal,
    topTubeSeatHalfWidthPx,
  );
  const topTubeUpperHeadReference = addScaled(
    topTubeHeadJoint,
    topTubeUpperNormal,
    topTubeHeadHalfWidthPx,
  );
  const topTubeLowerSeatReference = addScaled(
    topTubeSeatJoint,
    topTubeUpperNormal,
    -topTubeSeatHalfWidthPx,
  );
  const topTubeLowerHeadReference = addScaled(
    topTubeHeadJoint,
    topTubeUpperNormal,
    -topTubeHeadHalfWidthPx,
  );
  const upperSeatIntersection = intersectEdgeWithBoundary(
    topTubeUpperSeatReference,
    topTubeUpperHeadReference,
    seatTubeBoundaryStart,
    difference(seatTubeBoundaryEnd, seatTubeBoundaryStart),
  ) ?? topTubeUpperSeatReference;
  const lowerSeatIntersection = intersectEdgeWithBoundary(
    topTubeLowerSeatReference,
    topTubeLowerHeadReference,
    seatTubeBoundaryStart,
    difference(seatTubeBoundaryEnd, seatTubeBoundaryStart),
  ) ?? topTubeLowerSeatReference;
  const upperHeadIntersection = intersectEdgeWithBoundary(
    topTubeUpperSeatReference,
    topTubeUpperHeadReference,
    headTubeIntersectionBoundaryStart,
    difference(headTubeIntersectionBoundaryEnd, headTubeIntersectionBoundaryStart),
  ) ?? topTubeUpperHeadReference;
  const lowerHeadIntersection = intersectEdgeWithBoundary(
    topTubeLowerSeatReference,
    topTubeLowerHeadReference,
    headTubeIntersectionBoundaryStart,
    difference(headTubeIntersectionBoundaryEnd, headTubeIntersectionBoundaryStart),
  ) ?? topTubeLowerHeadReference;
  const points = [
    upperSeatIntersection,
    upperHeadIntersection,
    lowerHeadIntersection,
    lowerSeatIntersection,
  ];

  return {
    seatTubeDirection,
    seatTubeHeadwardNormal,
    headTubeDirection: headTube.direction,
    headTubeSeatwardNormal: headTube.normal,
    topTubeDirection,
    topTubeUpperNormal,
    seatTubeOuterBoundaryStart: seatTubeBoundaryStart,
    seatTubeOuterBoundaryEnd: seatTubeBoundaryEnd,
    headTubeOuterBoundaryPoint,
    headTubeIntersectionBoundaryStart,
    headTubeIntersectionBoundaryEnd,
    headTubeSeamOverlapPx,
    upperSeatIntersection,
    upperHeadIntersection,
    lowerHeadIntersection,
    lowerSeatIntersection,
    points,
    path: `M${points.map(pathPoint).join("L")}Z`,
  };
}

export function getTopTubeVisualJoints({ category, bottomBracket, seatCluster, headTop, headBottom }) {
  if (category !== "allRound") {
    return {
      topTubeSeatJoint: { ...seatCluster },
      topTubeHeadJoint: { ...headTop },
      usedFallback: false,
    };
  }

  const topTubeHeadJoint = lerpPoint(
    headBottom,
    headTop,
    ALL_ROUND_TOP_TUBE_HEAD_JOINT_RATIO,
  );
  const { centerlineSlope } = TOP_TUBE_VISUAL_REFERENCES.allRound;
  const topTubeSeatwardPoint = {
    x: topTubeHeadJoint.x - 100,
    y: topTubeHeadJoint.y - centerlineSlope * 100,
  };
  const intersection = intersectInfiniteLines(
    topTubeHeadJoint,
    topTubeSeatwardPoint,
    bottomBracket,
    seatCluster,
  );

  return {
    topTubeSeatJoint: intersection ?? { ...seatCluster },
    topTubeHeadJoint,
    usedFallback: intersection == null,
  };
}
