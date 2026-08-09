const QUICK_SIZES = ["430", "460", "490", "520", "550"];

const QUICK_GEOMETRY = Object.freeze({
  "430": Object.freeze({
    seatTubeLength: 430, effectiveTopTube: 516, seatTubeAngle: 74.8,
    headTubeAngle: 70.8, headTubeLength: 120, chainstay: 415,
    wheelbase: 986, forkOffset: 45, bbDrop: 75, reach: 370.8, stack: 532.8,
  }),
  "460": Object.freeze({
    seatTubeLength: 460, effectiveTopTube: 530, seatTubeAngle: 74.3,
    headTubeAngle: 71.7, headTubeLength: 138, chainstay: 415,
    wheelbase: 988, forkOffset: 45, bbDrop: 75, reach: 374.2, stack: 553.1,
  }),
  "490": Object.freeze({
    seatTubeLength: 490, effectiveTopTube: 546, seatTubeAngle: 73.9,
    headTubeAngle: 72, headTubeLength: 157, chainstay: 415,
    wheelbase: 998.5, forkOffset: 45, bbDrop: 73, reach: 380.8, stack: 571.2,
  }),
  "520": Object.freeze({
    seatTubeLength: 520, effectiveTopTube: 560, seatTubeAngle: 73.5,
    headTubeAngle: 73, headTubeLength: 172.6, chainstay: 415,
    wheelbase: 999, forkOffset: 45, bbDrop: 73, reach: 385, stack: 589.3,
  }),
  "550": Object.freeze({
    seatTubeLength: 550, effectiveTopTube: 580, seatTubeAngle: 73,
    headTubeAngle: 73, headTubeLength: 195, chainstay: 415,
    wheelbase: 1013, forkOffset: 45, bbDrop: 73, reach: 392.9, stack: 610.6,
  }),
});

export function createQuickGeometryParserFixture() {
  const fieldKeys = Object.keys(QUICK_GEOMETRY["430"]);
  return {
    detectedSizeCount: QUICK_SIZES.length,
    detectedSizes: [...QUICK_SIZES],
    fieldColumnCounts: Object.fromEntries(fieldKeys.map((field) => [field, QUICK_SIZES.length])),
    sizes: QUICK_SIZES.map((size) => ({ size, geometry: { ...QUICK_GEOMETRY[size] } })),
    warnings: [],
    unrecognizedFields: [],
  };
}

export { QUICK_SIZES, QUICK_GEOMETRY };

