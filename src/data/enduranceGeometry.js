import {
  TREK_DOMANE_VISUAL_BASE_SIZE,
  getTrekDomaneSize,
  geometrySizes,
  toBikeGeometry,
} from "./trekDomaneGeometry.js";

export const enduranceGeometrySizes = Object.fromEntries(
  geometrySizes.map((size) => [size, toBikeGeometry(getTrekDomaneSize(size))]),
);

export const ENDURANCE_VISUAL_BASE_SIZE = TREK_DOMANE_VISUAL_BASE_SIZE;
export const ENDURANCE_VISUAL_BASE_GEOMETRY = enduranceGeometrySizes[ENDURANCE_VISUAL_BASE_SIZE];

export function getEnduranceVisualDelta(targetGeometry) {
  const base = ENDURANCE_VISUAL_BASE_GEOMETRY;
  return {
    stack: targetGeometry.stack - base.stack,
    reach: targetGeometry.reach - base.reach,
    headTube: targetGeometry.headTube - base.headTube,
    headAngle: targetGeometry.headAngle - base.headAngle,
    seatTube: targetGeometry.seatTube - base.seatTube,
    seatAngle: targetGeometry.seatAngle - base.seatAngle,
    effectiveTopTube: targetGeometry.effectiveTopTube - base.effectiveTopTube,
    wheelbase: targetGeometry.wheelbase - base.wheelbase,
    chainstay: targetGeometry.chainstay - base.chainstay,
    bbDrop: targetGeometry.bbDrop - base.bbDrop,
    forkRake: targetGeometry.forkRake - base.forkRake,
    trail: targetGeometry.trail - base.trail,
    standover: targetGeometry.standover - base.standover,
    headTubeScale: targetGeometry.headTube / base.headTube,
  };
}
