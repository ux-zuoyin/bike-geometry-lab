const MOCK_GEOMETRY_SIZES = Object.freeze({
  49: Object.freeze({
    stack: 540, reach: 368, effectiveTopTube: 516, seatTubeLength: 440,
    seatTubeAngle: 74.6, headTubeLength: 123, headTubeAngle: 70.8,
    chainstay: 425, wheelbase: 1001, bbDrop: 80, forkOffset: 53,
  }),
  52: Object.freeze({
    stack: 561, reach: 371, effectiveTopTube: 530, seatTubeLength: 475,
    seatTubeAngle: 74.2, headTubeLength: 145, headTubeAngle: 71.3,
    chainstay: 420, wheelbase: 1003, bbDrop: 80, forkOffset: 53,
  }),
  54: Object.freeze({
    stack: 575, reach: 374, effectiveTopTube: 542, seatTubeLength: 500,
    seatTubeAngle: 73.7, headTubeLength: 160, headTubeAngle: 71.3,
    chainstay: 420, wheelbase: 1010, bbDrop: 80, forkOffset: 53,
  }),
  56: Object.freeze({
    stack: 591, reach: 377, effectiveTopTube: 554, seatTubeLength: 525,
    seatTubeAngle: 73.3, headTubeLength: 175, headTubeAngle: 71.9,
    chainstay: 420, wheelbase: 1018, bbDrop: 78, forkOffset: 48,
  }),
});

export function createMockGeometryImportDraft() {
  return {
    brand: "",
    model: "",
    category: "endurance",
    sizes: Object.fromEntries(
      Object.entries(MOCK_GEOMETRY_SIZES).map(([size, geometry]) => [size, { ...geometry }]),
    ),
    selectedSize: "54",
  };
}
