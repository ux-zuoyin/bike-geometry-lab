export const TREK_DOMANE_MODEL_ID = "trek-domane";
export const TREK_DOMANE_VISUAL_BASE_SIZE = "54";

const SOURCE_NOTE = "Extracted from Trek Domane geometry chart provided by user; original length values shown in cm and converted to mm.";

export const trekDomane = {
  id: TREK_DOMANE_MODEL_ID,
  brand: "Trek",
  model: "Domane",
  category: "endurance",
  categoryLabel: "耐力型",
  visualBaseSize: TREK_DOMANE_VISUAL_BASE_SIZE,
  wheelSize: "700c",
  sourceNote: SOURCE_NOTE,
  sizes: [
    {
      size: "44",
      wheelSize: "700c",
      seatTubeLengthMm: 390,
      seatTubeAngleDeg: 74.6,
      headTubeLengthMm: 95,
      headTubeAngleDeg: 70.3,
      effectiveTopTubeMm: 507,
      bbDropMm: 80,
      chainstayMm: 420,
      forkOffsetMm: 53,
      trailMm: 66,
      wheelbaseMm: 983,
      standoverMm: 657,
      reachMm: 360,
      stackMm: 510,
    },
    {
      size: "49",
      wheelSize: "700c",
      seatTubeLengthMm: 440,
      seatTubeAngleDeg: 74.6,
      headTubeLengthMm: 123,
      headTubeAngleDeg: 70.8,
      effectiveTopTubeMm: 516,
      bbDropMm: 80,
      chainstayMm: 425,
      forkOffsetMm: 53,
      trailMm: 66,
      wheelbaseMm: 1001,
      standoverMm: 717,
      reachMm: 368,
      stackMm: 540,
    },
    {
      size: "52",
      wheelSize: "700c",
      seatTubeLengthMm: 475,
      seatTubeAngleDeg: 74.2,
      headTubeLengthMm: 145,
      headTubeAngleDeg: 71.3,
      effectiveTopTubeMm: 530,
      bbDropMm: 80,
      chainstayMm: 420,
      forkOffsetMm: 53,
      trailMm: 59,
      wheelbaseMm: 1003,
      standoverMm: 735,
      reachMm: 371,
      stackMm: 561,
    },
    {
      size: "54",
      wheelSize: "700c",
      seatTubeLengthMm: 500,
      seatTubeAngleDeg: 73.7,
      headTubeLengthMm: 160,
      headTubeAngleDeg: 71.3,
      effectiveTopTubeMm: 542,
      bbDropMm: 80,
      chainstayMm: 420,
      forkOffsetMm: 53,
      trailMm: 59,
      wheelbaseMm: 1010,
      standoverMm: 754,
      reachMm: 374,
      stackMm: 575,
    },
    {
      size: "56",
      wheelSize: "700c",
      seatTubeLengthMm: 525,
      seatTubeAngleDeg: 73.3,
      headTubeLengthMm: 175,
      headTubeAngleDeg: 71.9,
      effectiveTopTubeMm: 554,
      bbDropMm: 78,
      chainstayMm: 420,
      forkOffsetMm: 48,
      trailMm: 61,
      wheelbaseMm: 1018,
      standoverMm: 776,
      reachMm: 377,
      stackMm: 591,
    },
    {
      size: "58",
      wheelSize: "700c",
      seatTubeLengthMm: 548,
      seatTubeAngleDeg: 73,
      headTubeLengthMm: 195,
      headTubeAngleDeg: 72,
      effectiveTopTubeMm: 567,
      bbDropMm: 78,
      chainstayMm: 425,
      forkOffsetMm: 48,
      trailMm: 60,
      wheelbaseMm: 1022,
      standoverMm: 796,
      reachMm: 380,
      stackMm: 611,
    },
    {
      size: "61",
      wheelSize: "700c",
      seatTubeLengthMm: 576,
      seatTubeAngleDeg: 72.7,
      headTubeLengthMm: 235,
      headTubeAngleDeg: 72.1,
      effectiveTopTubeMm: 586,
      bbDropMm: 75,
      chainstayMm: 425,
      forkOffsetMm: 48,
      trailMm: 63,
      wheelbaseMm: 1038,
      standoverMm: 842,
      reachMm: 385,
      stackMm: 646,
    },
  ],
};

export const geometrySizes = trekDomane.sizes.map(({ size }) => size);

export const trekDomaneGeometryBySize = Object.fromEntries(
  trekDomane.sizes.map((geometry) => [geometry.size, geometry]),
);

export const bikeCatalog = {
  [TREK_DOMANE_MODEL_ID]: trekDomane,
};

export const bikeGeometryByModel = {
  [TREK_DOMANE_MODEL_ID]: trekDomaneGeometryBySize,
};

// The visualizer still speaks the compact geometry vocabulary used by the
// calculation layer. Product data stays in the explicit, unit-bearing schema
// above and crosses this adapter at one boundary.
export function toBikeGeometry(geometry) {
  const renderGeometry = geometry.renderGeometry;
  if (renderGeometry) {
    return {
      wheel: geometry.wheelSize ?? "700c",
      seatTube: renderGeometry.seatTubeLength,
      seatAngle: renderGeometry.seatTubeAngle,
      headTube: renderGeometry.headTubeLength,
      headAngle: renderGeometry.headTubeAngle,
      effectiveTopTube: renderGeometry.effectiveTopTube,
      bbDrop: renderGeometry.bbDrop,
      chainstay: renderGeometry.chainstay,
      forkRake: renderGeometry.forkOffset,
      trail: geometry.extendedGeometry?.trail ?? geometry.trailMm ?? null,
      wheelbase: renderGeometry.wheelbase,
      standover: geometry.extendedGeometry?.standover ?? geometry.standoverMm ?? null,
      reach: renderGeometry.reach,
      stack: renderGeometry.stack,
    };
  }
  return {
    wheel: geometry.wheelSize,
    seatTube: geometry.seatTubeLengthMm,
    seatAngle: geometry.seatTubeAngleDeg,
    headTube: geometry.headTubeLengthMm,
    headAngle: geometry.headTubeAngleDeg,
    effectiveTopTube: geometry.effectiveTopTubeMm,
    bbDrop: geometry.bbDropMm,
    chainstay: geometry.chainstayMm,
    forkRake: geometry.forkOffsetMm,
    trail: geometry.trailMm,
    wheelbase: geometry.wheelbaseMm,
    standover: geometry.standoverMm,
    reach: geometry.reachMm,
    stack: geometry.stackMm,
  };
}

export function getTrekDomaneSize(size) {
  return trekDomaneGeometryBySize[String(size)];
}
