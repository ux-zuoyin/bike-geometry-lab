export const aeroPreset = {
  id: "aero",
  calibrated: false,
  label: "Aero",
  zhLabel: "破风架",
  description: "Template not calibrated · 等待破风架参考资料",
  tubes: {
    top: [17, 21],
    down: [25, 31],
    seat: [22, 27],
    head: [22, 26],
  },
  fork: { crownWidth: 24, axleWidth: 10, curve: 0.03 },
  stays: { seatWidth: 9, chainWidth: 12, attachRatio: 0.42 },
  seatpost: { width: 15, aero: 0.85 },
  cockpit: { stemWidth: 11, barWidth: 8.5, hoodScale: 1.04, dropExtension: 24 },
  wheel: { rimDepth: 18, spokes: 14 },
  detailLevel: 0.76,
};
