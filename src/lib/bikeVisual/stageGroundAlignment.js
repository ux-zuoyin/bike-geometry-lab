export const BIKE_STAGE_VIEWBOX_WIDTH = 980;
export const BIKE_STAGE_VIEWBOX_HEIGHT = 620;

// The unchanged Prism's white platform band sits at this normalized Y position.
// Keeping it stage-relative makes the alignment survive normal/fullscreen layouts.
export const PRISM_GROUND_Y_RATIO = 0.89;

export function getBikeStageGroundAlignment({
  stageWidth,
  stageHeight,
  bikeGroundY,
  viewBoxWidth = BIKE_STAGE_VIEWBOX_WIDTH,
  viewBoxHeight = BIKE_STAGE_VIEWBOX_HEIGHT,
  groundYRatio = PRISM_GROUND_Y_RATIO,
}) {
  const safeWidth = Math.max(1, stageWidth);
  const safeHeight = Math.max(1, stageHeight);
  const stageScale = Math.min(safeWidth / viewBoxWidth, safeHeight / viewBoxHeight);
  const viewBoxOffsetY = (safeHeight - viewBoxHeight * stageScale) / 2;
  const stageGroundYPx = safeHeight * groundYRatio;
  const stageGroundY = (stageGroundYPx - viewBoxOffsetY) / stageScale;

  return Object.freeze({
    stageGroundY,
    stageGroundYPx,
    stageScale,
    viewBoxOffsetY,
    stageTranslateY: stageGroundY - bikeGroundY,
  });
}
