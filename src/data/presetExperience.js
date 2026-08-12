export const PRESET_EXPERIENCE_IDS = Object.freeze(["zeitpro", "arone", "erone"]);
export const DEFAULT_PRESET_BIKE_ID = "arone";

const createSize = ({
  size,
  seatTubeLengthMm,
  effectiveTopTubeMm,
  seatTubeAngleDeg,
  headTubeAngleDeg,
  headTubeLengthMm,
  chainstayMm,
  wheelbaseMm,
  forkOffsetMm,
  bbDropMm,
  standoverMm,
  reachMm,
  stackMm,
}) => ({
  size: String(size),
  wheelSize: "700c",
  seatTubeLengthMm,
  effectiveTopTubeMm,
  seatTubeAngleDeg,
  headTubeAngleDeg,
  headTubeLengthMm,
  chainstayMm,
  wheelbaseMm,
  forkOffsetMm,
  bbDropMm,
  trailMm: null,
  standoverMm,
  reachMm,
  stackMm,
});

export const presetExperienceCatalog = Object.freeze({
  zeitpro: Object.freeze({
    id: "zeitpro",
    brand: "QUICK",
    model: "ZEIT PRO",
    category: "endurance",
    selectorLabel: "ZEIT PRO · 耐力",
    visualBaseSize: "520",
    sourceUrl: "https://www.quickprousa.com/products/zeit-pro-gen-2-105-di2",
    sizes: Object.freeze([
      createSize({ size: 430, seatTubeLengthMm: 430, effectiveTopTubeMm: 516, seatTubeAngleDeg: 74.8, headTubeAngleDeg: 70.8, headTubeLengthMm: 120, chainstayMm: 415, wheelbaseMm: 986.1, forkOffsetMm: 45, bbDropMm: 75, standoverMm: 698.8, reachMm: 370.8, stackMm: 532.8 }),
      createSize({ size: 460, seatTubeLengthMm: 460, effectiveTopTubeMm: 530, seatTubeAngleDeg: 74.3, headTubeAngleDeg: 71.7, headTubeLengthMm: 138, chainstayMm: 415, wheelbaseMm: 987.8, forkOffsetMm: 45, bbDropMm: 75, standoverMm: 725.5, reachMm: 374.2, stackMm: 553.1 }),
      createSize({ size: 490, seatTubeLengthMm: 490, effectiveTopTubeMm: 546, seatTubeAngleDeg: 73.9, headTubeAngleDeg: 72, headTubeLengthMm: 157, chainstayMm: 415, wheelbaseMm: 998.6, forkOffsetMm: 45, bbDropMm: 73, standoverMm: 760, reachMm: 380.8, stackMm: 571.2 }),
      createSize({ size: 520, seatTubeLengthMm: 520, effectiveTopTubeMm: 560, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73, headTubeLengthMm: 172.6, chainstayMm: 415, wheelbaseMm: 999.4, forkOffsetMm: 45, bbDropMm: 73, standoverMm: 789, reachMm: 385, stackMm: 589.3 }),
      createSize({ size: 550, seatTubeLengthMm: 550, effectiveTopTubeMm: 580, seatTubeAngleDeg: 73, headTubeAngleDeg: 73, headTubeLengthMm: 195, chainstayMm: 415, wheelbaseMm: 1012.9, forkOffsetMm: 45, bbDropMm: 73, standoverMm: 812, reachMm: 392.9, stackMm: 610.6 }),
    ]),
  }),
  arone: Object.freeze({
    id: "arone",
    brand: "QUICK",
    model: "AR:ONE",
    category: "allRound",
    selectorLabel: "AR:ONE · 综合",
    visualBaseSize: "520",
    sourceUrl: "https://www.quickprousa.com/products/ar-one-frame",
    sizes: Object.freeze([
      createSize({ size: 430, seatTubeLengthMm: 430, effectiveTopTubeMm: 510, seatTubeAngleDeg: 75, headTubeAngleDeg: 70, headTubeLengthMm: 105, chainstayMm: 408, wheelbaseMm: 982, forkOffsetMm: 50, bbDropMm: 71.65, standoverMm: 710.5, reachMm: 375.37, stackMm: 503.9 }),
      createSize({ size: 460, seatTubeLengthMm: 460, effectiveTopTubeMm: 525, seatTubeAngleDeg: 74.5, headTubeAngleDeg: 71, headTubeLengthMm: 115, chainstayMm: 408, wheelbaseMm: 984.5, forkOffsetMm: 50, bbDropMm: 71.65, standoverMm: 736, reachMm: 382.17, stackMm: 516.73 }),
      createSize({ size: 490, seatTubeLengthMm: 490, effectiveTopTubeMm: 540, seatTubeAngleDeg: 74, headTubeAngleDeg: 72, headTubeLengthMm: 130, chainstayMm: 408, wheelbaseMm: 986, forkOffsetMm: 45, bbDropMm: 71.65, standoverMm: 761.5, reachMm: 386.71, stackMm: 534.57 }),
      createSize({ size: 520, seatTubeLengthMm: 520, effectiveTopTubeMm: 555, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73, headTubeLengthMm: 145, chainstayMm: 408, wheelbaseMm: 987, forkOffsetMm: 45, bbDropMm: 71.65, standoverMm: 787, reachMm: 391.4, stackMm: 552 }),
      createSize({ size: 550, seatTubeLengthMm: 550, effectiveTopTubeMm: 570, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73, headTubeLengthMm: 160, chainstayMm: 408, wheelbaseMm: 1002, forkOffsetMm: 45, bbDropMm: 71.65, standoverMm: 812.5, reachMm: 402, stackMm: 566.6 }),
      createSize({ size: 580, seatTubeLengthMm: 580, effectiveTopTubeMm: 589, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73.5, headTubeLengthMm: 180, chainstayMm: 408, wheelbaseMm: 1013.7, forkOffsetMm: 45, bbDropMm: 71.65, standoverMm: 837, reachMm: 412.3, stackMm: 587.7 }),
    ]),
  }),
  erone: Object.freeze({
    id: "erone",
    brand: "QUICK",
    model: "ER:ONE",
    category: "aero",
    selectorLabel: "ER:ONE · 破风",
    visualBaseSize: "520",
    sourceUrl: "https://www.quickprousa.com/products/er-one",
    sizes: Object.freeze([
      createSize({ size: 430, seatTubeLengthMm: 430, effectiveTopTubeMm: 515, seatTubeAngleDeg: 75, headTubeAngleDeg: 70, headTubeLengthMm: 105, chainstayMm: 408, wheelbaseMm: 985, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 746, reachMm: 380, stackMm: 505 }),
      createSize({ size: 460, seatTubeLengthMm: 460, effectiveTopTubeMm: 525, seatTubeAngleDeg: 74.5, headTubeAngleDeg: 71, headTubeLengthMm: 118, chainstayMm: 408, wheelbaseMm: 985, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 762, reachMm: 381, stackMm: 521 }),
      createSize({ size: 490, seatTubeLengthMm: 490, effectiveTopTubeMm: 540, seatTubeAngleDeg: 74, headTubeAngleDeg: 72, headTubeLengthMm: 132, chainstayMm: 408, wheelbaseMm: 987, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 779, reachMm: 386, stackMm: 538 }),
      createSize({ size: 520, seatTubeLengthMm: 520, effectiveTopTubeMm: 558, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73, headTubeLengthMm: 148, chainstayMm: 408, wheelbaseMm: 991, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 797, reachMm: 393, stackMm: 556 }),
      createSize({ size: 550, seatTubeLengthMm: 550, effectiveTopTubeMm: 575, seatTubeAngleDeg: 73.5, headTubeAngleDeg: 73, headTubeLengthMm: 165, chainstayMm: 408, wheelbaseMm: 1008, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 813, reachMm: 406, stackMm: 572 }),
      createSize({ size: 584, seatTubeLengthMm: 584, effectiveTopTubeMm: 596, seatTubeAngleDeg: 73, headTubeAngleDeg: 73.5, headTubeLengthMm: 185, chainstayMm: 408, wheelbaseMm: 1019, forkOffsetMm: 45, bbDropMm: 70, standoverMm: 846, reachMm: 415, stackMm: 593 }),
    ]),
  }),
});

export function getPresetExperienceDefinition(id) {
  return presetExperienceCatalog[id] ?? presetExperienceCatalog[DEFAULT_PRESET_BIKE_ID];
}
