export const allRoundPreset = {
  id: "allRound",
  calibrated: false,
  label: "All-Round",
  zhLabel: "综合架",
  description: "Template not calibrated · 等待综合架参考资料",
  tubes: {
    top: [12, 14],
    down: [19, 24],
    seat: [16, 19],
    head: [18, 21],
  },
  fork: { crownWidth: 19, axleWidth: 8, curve: 0.08 },
  stays: { seatWidth: 7, chainWidth: 9, attachRatio: 0.16 },
  seatpost: { width: 10, aero: 0.12 },
  cockpit: { stemWidth: 8, barWidth: 7.5, hoodScale: 1, dropExtension: 20 },
  wheel: { rimDepth: 10, spokes: 18 },
  detailLevel: 0.92,
};
