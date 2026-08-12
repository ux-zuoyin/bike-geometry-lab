import { endurancePreset } from "./endurance.js";

export const allRoundPreset = {
  ...endurancePreset,
  id: "allRound",
  calibrated: true,
  label: "All-Round",
  zhLabel: "综合架",
  categoryLabel: "综合型",
  description: "共享 Road Geometry 与 Anchor，使用更平的上管和头端渐缩下管视觉",
  topTubeStyle: "flatter",
  topTubeFigmaNodeId: "32:1257",
  downTubeStyle: "headTapered",
};
