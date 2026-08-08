import {
  TREK_DOMANE_VISUAL_BASE_SIZE,
  getTrekDomaneSize,
  geometrySizes,
  toBikeGeometry,
} from "./trekDomaneGeometry.js";

export const geometryFieldDefinitions = {
  seatTube: { mark: "A", label: "Seat Tube", zhLabel: "座管长度", description: "五通中心到座管上端的距离", unit: "mm" },
  seatAngle: { mark: "B", label: "Seat Angle", zhLabel: "座管角", description: "座管中心线相对地面的角度", unit: "°" },
  headTube: { mark: "C", label: "Head Tube", zhLabel: "头管长度", description: "头管上下端之间的长度", unit: "mm" },
  headAngle: { mark: "D", label: "Head Angle", zhLabel: "头管角", description: "头管中心线相对地面的角度", unit: "°" },
  effectiveTopTube: { mark: "E", label: "Effective Top Tube", zhLabel: "有效上管", description: "座管中心线到头管上端的水平距离", unit: "mm" },
  bbDrop: { mark: "G", label: "BB Drop", zhLabel: "中轴落差", description: "轮轴连线到五通中心的垂直落差", unit: "mm" },
  chainstay: { mark: "H", label: "Chainstay", zhLabel: "后下叉", description: "五通中心到后轮轴心的距离", unit: "mm" },
  forkRake: { mark: "I", label: "Fork Rake", zhLabel: "前叉偏移", description: "前轴相对头管转向轴线的偏移量", unit: "mm" },
  trail: { mark: "J", label: "Trail", zhLabel: "拖曳距", description: "转向轴落地点与前轮接地点之间的距离", unit: "mm" },
  wheelbase: { mark: "K", label: "Wheelbase", zhLabel: "轴距", description: "前后轮轴心之间的水平距离", unit: "mm" },
  standover: { mark: "L", label: "Standover", zhLabel: "跨高", description: "地面到上管指定位置的垂直高度", unit: "mm" },
  reach: { mark: "M", label: "Reach", zhLabel: "前伸量", description: "五通中心到头管上端的水平距离", unit: "mm" },
  stack: { mark: "N", label: "Stack", zhLabel: "堆高", description: "五通中心到头管上端的垂直距离", unit: "mm" },
};

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
    wheelbase: targetGeometry.wheelbase - base.wheelbase,
    headTubeScale: targetGeometry.headTube / base.headTube,
  };
}
