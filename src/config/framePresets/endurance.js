export const endurancePreset = {
  id: "endurance",
  calibrated: true,
  label: "Endurance",
  zhLabel: "耐力架",
  description: "高头管、短前伸、稳定舒展的长距离姿态",
  tubes: {
    top: [11, 13],
    down: [18, 22],
    seat: [15, 18],
    head: [19, 22],
  },
  fork: { crownWidth: 20, axleWidth: 8, curve: 0.16 },
  stays: { seatWidth: 7, chainWidth: 9, attachRatio: 0.08 },
  seatpost: { width: 10, aero: 0.04 },
  cockpit: { stemWidth: 8, barWidth: 7.2, hoodScale: 0.98, dropExtension: 18 },
  wheel: { rimDepth: 7, spokes: 18 },
  detailLevel: 0.9,
};
