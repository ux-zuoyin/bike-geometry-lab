export const DEFAULT_WHEELSET_ID = "midProfile";

export const WHEELSET_CENTER = Object.freeze({ x: 240, y: 240 });

export const wheelsets = Object.freeze([
  {
    id: "lowProfile",
    name: "低框轮组",
    description: "偏轻量 / 简洁",
    wheelSize: "700c",
    figma: {
      groupNodeId: "2:948",
      frontNodeId: "2:940",
      rearNodeId: "2:933",
    },
  },
  {
    id: "midProfile",
    name: "中框轮组",
    description: "均衡视觉",
    wheelSize: "700c",
    figma: {
      groupNodeId: "2:979",
      frontNodeId: "2:987",
      rearNodeId: "2:980",
    },
  },
  {
    id: "deepProfile",
    name: "高框轮组",
    description: "更强空气动力学视觉",
    wheelSize: "700c",
    figma: {
      groupNodeId: "2:994",
      frontNodeId: "2:1002",
      rearNodeId: "2:995",
    },
  },
]);

export const wheelsetById = Object.freeze(
  Object.fromEntries(wheelsets.map((wheelset) => [wheelset.id, wheelset])),
);

export function getWheelset(id) {
  return wheelsetById[id] ?? wheelsetById[DEFAULT_WHEELSET_ID];
}
