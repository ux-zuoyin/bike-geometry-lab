import { FIGMA_AERO_TEMPLATE } from "./figmaAeroTemplate.js";

const { anchors: sourceAnchors } = FIGMA_AERO_TEMPLATE;

const difference = (end, start) => ({ x: end.x - start.x, y: end.y - start.y });
const dot = (first, second) => first.x * second.x + first.y * second.y;
const cross = (first, second) => first.x * second.y - first.y * second.x;

const lerpPoint = (start, end, ratio) => ({
  x: start.x + (end.x - start.x) * ratio,
  y: start.y + (end.y - start.y) * ratio,
});

const axisRatio = (point, start, end) => {
  const axis = difference(end, start);
  const denominator = dot(axis, axis) || 1;
  return dot(difference(point, start), axis) / denominator;
};

const intersectInfiniteLines = (firstStart, firstEnd, secondStart, secondEnd) => {
  const firstDirection = difference(firstEnd, firstStart);
  const secondDirection = difference(secondEnd, secondStart);
  const denominator = cross(firstDirection, secondDirection);
  if (Math.abs(denominator) < 1e-9) return null;
  const ratio = cross(difference(secondStart, firstStart), secondDirection) / denominator;
  return {
    x: firstStart.x + firstDirection.x * ratio,
    y: firstStart.y + firstDirection.y * ratio,
  };
};

const sourceTopTubeDelta = difference(
  sourceAnchors.topTubeHeadJoint,
  sourceAnchors.topTubeSeatJoint,
);

export const AERO_VISUAL_CONFIG = Object.freeze({
  seatStayJointRatio: axisRatio(
    sourceAnchors.seatStayAeroConnection,
    sourceAnchors.bottomBracket,
    sourceAnchors.seatCluster,
  ),
  topTubeHeadJointRatio: axisRatio(
    sourceAnchors.topTubeHeadJoint,
    sourceAnchors.headBottom,
    sourceAnchors.headTop,
  ),
  downTubeHeadJointRatio: axisRatio(
    sourceAnchors.downTubeHeadJoint,
    sourceAnchors.headBottom,
    sourceAnchors.headTop,
  ),
  topTubeCenterlineSlope: sourceTopTubeDelta.y / (sourceTopTubeDelta.x || 1),
  seatTubeTopHalfWidthSourcePx: 17,
  seatTubeBottomHalfWidthSourcePx: 16.5,
  topTubeSeatHalfWidthSourcePx: 12.75,
  topTubeHeadHalfWidthSourcePx: 11.25,
  headTubeHalfWidthSourcePx: 25,
  downTubeBbHalfWidthSourcePx: 23.5,
  downTubeHeadHalfWidthSourcePx: 14,
  seatTubeTopJointOverlapPx: 4,
  headTubeJunctionOverlapPx: 3,
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

const pathPoint = (point) => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;

export function getAeroSeatTubeVisualTop({
  bottomBracket,
  geometrySeatTubeTop,
  topTubeSeatJoint,
  overlapPx = AERO_VISUAL_CONFIG.seatTubeTopJointOverlapPx,
}) {
  const geometryAxis = difference(geometrySeatTubeTop, bottomBracket);
  const geometryLength = Math.hypot(geometryAxis.x, geometryAxis.y) || 1;
  const direction = {
    x: geometryAxis.x / geometryLength,
    y: geometryAxis.y / geometryLength,
  };
  const jointDistance = dot(difference(topTubeSeatJoint, bottomBracket), direction);
  const visualLength = Math.max(geometryLength, jointDistance + overlapPx);

  return {
    point: {
      x: bottomBracket.x + direction.x * visualLength,
      y: bottomBracket.y + direction.y * visualLength,
    },
    direction,
    geometryLength,
    jointDistance,
    visualLength,
    extensionPx: visualLength - geometryLength,
    jointOverlapPx: visualLength - jointDistance,
  };
}

export function getAeroDownTubeShape({
  bottomBracket,
  downTubeHeadJoint,
  headBottom,
  headTop,
  headTubeSeatwardBoundaryStart,
  headTubeSeatwardBoundaryEnd,
  bbHalfWidthPx,
  headHalfWidthPx,
  seamOverlapPx = AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx,
  headCapInsetPx = AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx,
  maximumBoundaryRatio = 1,
}) {
  const headDirection = unitDirection(headBottom, headTop);
  const boundaryDirection = difference(
    headTubeSeatwardBoundaryEnd,
    headTubeSeatwardBoundaryStart,
  );
  const boundaryLength = Math.hypot(boundaryDirection.x, boundaryDirection.y) || 1;
  const minimumBoundaryRatio = headCapInsetPx / boundaryLength;
  let fittedHeadJoint = { ...downTubeHeadJoint };
  let bbUpper = null;
  let bbLower = null;
  let upperBoundaryIntersection = null;
  let lowerBoundaryIntersection = null;
  let upperBoundaryRatio = 0;
  let lowerBoundaryRatio = 0;
  let totalAdjustmentPx = 0;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const downDirection = unitDirection(bottomBracket, fittedHeadJoint);
    const upperNormal = { x: downDirection.y, y: -downDirection.x };
    bbUpper = addScaled(bottomBracket, upperNormal, bbHalfWidthPx);
    bbLower = addScaled(bottomBracket, upperNormal, -bbHalfWidthPx);
    const headUpper = addScaled(fittedHeadJoint, upperNormal, headHalfWidthPx);
    const headLower = addScaled(fittedHeadJoint, upperNormal, -headHalfWidthPx);
    upperBoundaryIntersection = intersectInfiniteLines(
      bbUpper,
      headUpper,
      headTubeSeatwardBoundaryStart,
      headTubeSeatwardBoundaryEnd,
    ) ?? headUpper;
    lowerBoundaryIntersection = intersectInfiniteLines(
      bbLower,
      headLower,
      headTubeSeatwardBoundaryStart,
      headTubeSeatwardBoundaryEnd,
    ) ?? headLower;
    upperBoundaryRatio = axisRatio(
      upperBoundaryIntersection,
      headTubeSeatwardBoundaryStart,
      headTubeSeatwardBoundaryEnd,
    );
    lowerBoundaryRatio = axisRatio(
      lowerBoundaryIntersection,
      headTubeSeatwardBoundaryStart,
      headTubeSeatwardBoundaryEnd,
    );
    const bottomUnderrunRatio = minimumBoundaryRatio - Math.min(
      upperBoundaryRatio,
      lowerBoundaryRatio,
    );
    const topOverrunRatio = Math.max(
      upperBoundaryRatio,
      lowerBoundaryRatio,
    ) - maximumBoundaryRatio;
    if (bottomUnderrunRatio <= 1e-9 && topOverrunRatio <= 1e-9) break;
    const signedAdjustmentPx = bottomUnderrunRatio > 0
      ? bottomUnderrunRatio * boundaryLength
      : -topOverrunRatio * boundaryLength;
    fittedHeadJoint = addScaled(fittedHeadJoint, headDirection, signedAdjustmentPx);
    totalAdjustmentPx += signedAdjustmentPx;
  }

  const inwardDirection = unitDirection(
    headTubeSeatwardBoundaryStart,
    headBottom,
  );
  const insetBoundaryStart = addScaled(
    headTubeSeatwardBoundaryStart,
    inwardDirection,
    seamOverlapPx,
  );
  const insetBoundaryEnd = addScaled(
    headTubeSeatwardBoundaryEnd,
    inwardDirection,
    seamOverlapPx,
  );
  const downDirection = unitDirection(bottomBracket, fittedHeadJoint);
  const upperNormal = { x: downDirection.y, y: -downDirection.x };
  bbUpper = addScaled(bottomBracket, upperNormal, bbHalfWidthPx);
  bbLower = addScaled(bottomBracket, upperNormal, -bbHalfWidthPx);
  const headUpperReference = addScaled(fittedHeadJoint, upperNormal, headHalfWidthPx);
  const headLowerReference = addScaled(fittedHeadJoint, upperNormal, -headHalfWidthPx);
  const upperHeadIntersection = intersectInfiniteLines(
    bbUpper,
    headUpperReference,
    insetBoundaryStart,
    insetBoundaryEnd,
  ) ?? headUpperReference;
  const lowerHeadIntersection = intersectInfiniteLines(
    bbLower,
    headLowerReference,
    insetBoundaryStart,
    insetBoundaryEnd,
  ) ?? headLowerReference;
  const points = [bbUpper, upperHeadIntersection, lowerHeadIntersection, bbLower];

  return {
    fittedHeadJoint,
    bbUpper,
    bbLower,
    upperBoundaryIntersection,
    lowerBoundaryIntersection,
    upperHeadIntersection,
    lowerHeadIntersection,
    upperBoundaryRatio,
    lowerBoundaryRatio,
    minimumBoundaryRatio,
    maximumBoundaryRatio,
    adjustmentPx: totalAdjustmentPx,
    seamOverlapPx,
    headCapInsetPx,
    insetBoundaryStart,
    insetBoundaryEnd,
    points,
    path: `M${points.map(pathPoint).join("L")}Z`,
  };
}

/**
 * Aero V1 Stable keeps the universal Geometry anchors intact and derives only
 * visual joints from the frozen Figma template. There is no split seat tube,
 * wheel cutout, secondary seat axis, or BB-driven deformation in this model.
 */
export function getAeroVisualAnchors({
  bottomBracket,
  rearAxle,
  seatCluster,
  headTop,
  headBottom,
}) {
  const seatStayJoint = lerpPoint(
    bottomBracket,
    seatCluster,
    AERO_VISUAL_CONFIG.seatStayJointRatio,
  );
  const topTubeHeadJoint = lerpPoint(
    headBottom,
    headTop,
    AERO_VISUAL_CONFIG.topTubeHeadJointRatio,
  );
  const topTubeSeatwardPoint = {
    x: topTubeHeadJoint.x - 100,
    y: topTubeHeadJoint.y - AERO_VISUAL_CONFIG.topTubeCenterlineSlope * 100,
  };
  const topTubeSeatJoint = intersectInfiniteLines(
    topTubeHeadJoint,
    topTubeSeatwardPoint,
    bottomBracket,
    seatCluster,
  ) ?? { ...seatCluster };
  const downTubeHeadJoint = lerpPoint(
    headBottom,
    headTop,
    AERO_VISUAL_CONFIG.downTubeHeadJointRatio,
  );

  return {
    bottomBracket: { ...bottomBracket },
    rearAxle: { ...rearAxle },
    seatCluster: { ...seatCluster },
    seatTubeTop: { ...seatCluster },
    seatStayJoint,
    topTubeSeatJoint,
    topTubeHeadJoint,
    downTubeHeadJoint,
  };
}
