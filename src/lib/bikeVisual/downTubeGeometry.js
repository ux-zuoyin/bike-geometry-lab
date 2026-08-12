export const ALL_ROUND_DOWN_TUBE_HEAD_JOINT_RATIO = 0.12;
export const ALL_ROUND_DOWN_TUBE_MAX_HEAD_JOINT_RATIO = 0.38;
export const ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX = 4;
export const ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX = 4;

const ALL_ROUND_DOWN_TUBE_BB_HALF_WIDTH_PX = 26;
const ALL_ROUND_DOWN_TUBE_HEAD_HALF_WIDTH_PX = 10;
const ALL_ROUND_DOWN_TUBE_NARROW_HEAD_HALF_WIDTH_PX = 8;
const CLEARANCE_SAMPLE_COUNT = 64;
const HEAD_JOINT_RATIO_STEP = 0.01;

const lerpPoint = (start, end, ratio) => ({
  x: start.x + (end.x - start.x) * ratio,
  y: start.y + (end.y - start.y) * ratio,
});

const isFinitePoint = (point) => (
  point
  && Number.isFinite(point.x)
  && Number.isFinite(point.y)
);

export function estimateDownTubeWheelClearance({
  bottomBracket,
  headJoint,
  frontAxle,
  frontWheelOuterRadius,
  bbHalfWidthPx = ALL_ROUND_DOWN_TUBE_BB_HALF_WIDTH_PX,
  headHalfWidthPx = ALL_ROUND_DOWN_TUBE_HEAD_HALF_WIDTH_PX,
}) {
  if (!isFinitePoint(frontAxle) || !Number.isFinite(frontWheelOuterRadius)) return Infinity;

  let minimumClearance = Infinity;
  for (let index = 0; index <= CLEARANCE_SAMPLE_COUNT; index += 1) {
    const ratio = index / CLEARANCE_SAMPLE_COUNT;
    const center = lerpPoint(bottomBracket, headJoint, ratio);
    const halfWidth = bbHalfWidthPx + (headHalfWidthPx - bbHalfWidthPx) * ratio;
    const centerDistance = Math.hypot(center.x - frontAxle.x, center.y - frontAxle.y);
    minimumClearance = Math.min(
      minimumClearance,
      centerDistance - frontWheelOuterRadius - halfWidth,
    );
  }
  return minimumClearance;
}

export function resolveAllRoundDownTubeClearance({
  bottomBracket,
  headBottom,
  headTop,
  frontAxle,
  frontWheelOuterRadius,
}) {
  const hasWheelConstraint = isFinitePoint(frontAxle) && Number.isFinite(frontWheelOuterRadius);
  let headJointRatio = ALL_ROUND_DOWN_TUBE_HEAD_JOINT_RATIO;
  let headHalfWidthPx = ALL_ROUND_DOWN_TUBE_HEAD_HALF_WIDTH_PX;
  let headJoint = lerpPoint(headBottom, headTop, headJointRatio);
  let estimatedClearancePx = estimateDownTubeWheelClearance({
    bottomBracket,
    headJoint,
    frontAxle,
    frontWheelOuterRadius,
    headHalfWidthPx,
  });

  if (hasWheelConstraint && estimatedClearancePx < ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX) {
    for (
      let ratio = ALL_ROUND_DOWN_TUBE_HEAD_JOINT_RATIO + HEAD_JOINT_RATIO_STEP;
      ratio <= ALL_ROUND_DOWN_TUBE_MAX_HEAD_JOINT_RATIO + Number.EPSILON;
      ratio += HEAD_JOINT_RATIO_STEP
    ) {
      headJointRatio = Math.min(ratio, ALL_ROUND_DOWN_TUBE_MAX_HEAD_JOINT_RATIO);
      headJoint = lerpPoint(headBottom, headTop, headJointRatio);
      estimatedClearancePx = estimateDownTubeWheelClearance({
        bottomBracket,
        headJoint,
        frontAxle,
        frontWheelOuterRadius,
        headHalfWidthPx,
      });
      if (estimatedClearancePx >= ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX) break;
    }
  }

  if (hasWheelConstraint && estimatedClearancePx < ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX) {
    headHalfWidthPx = ALL_ROUND_DOWN_TUBE_NARROW_HEAD_HALF_WIDTH_PX;
    estimatedClearancePx = estimateDownTubeWheelClearance({
      bottomBracket,
      headJoint,
      frontAxle,
      frontWheelOuterRadius,
      headHalfWidthPx,
    });
  }

  const pathRetreatPx = hasWheelConstraint
    ? Math.max(0, ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX - estimatedClearancePx)
    : 0;

  return {
    downTubeBbJoint: { ...bottomBracket },
    downTubeHeadJoint: headJoint,
    clearance: {
      constrained: hasWheelConstraint,
      headJointRatio,
      headHalfWidthPx,
      estimatedClearancePx,
      effectiveClearancePx: Math.max(estimatedClearancePx, ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX),
      pathRetreatPx,
      maskClearancePx: ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX,
    },
  };
}

export function getDownTubeVisualJoints({
  category,
  bottomBracket,
  headBottom,
  headTop,
  frontAxle,
  frontWheelOuterRadius,
}) {
  if (category === "allRound") {
    return resolveAllRoundDownTubeClearance({
      bottomBracket,
      headBottom,
      headTop,
      frontAxle,
      frontWheelOuterRadius,
    });
  }

  return {
    downTubeBbJoint: { ...bottomBracket },
    downTubeHeadJoint: { ...headBottom },
    clearance: null,
  };
}
