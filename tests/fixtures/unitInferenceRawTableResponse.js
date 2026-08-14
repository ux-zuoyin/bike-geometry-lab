const BASE_LABELS = Object.freeze([
  ["Seat Tube", "seatTubeLength"],
  ["Effective Top Tube", "effectiveTopTube"],
  ["Head Tube", "headTubeLength"],
  ["Chainstay", "chainstay"],
  ["Wheelbase", "wheelbase"],
  ["BB Drop", "bbDrop"],
  ["Fork Offset", "forkOffset"],
  ["Reach", "reach"],
  ["Stack", "stack"],
]);

function createNoUnitFixture(values) {
  return {
    inputClassification: {
      type: "road_bike_geometry",
      confidence: 0.95,
      detectedBikeType: "road bike",
      reason: "The image contains a complete road-bike geometry table without a unit note.",
    },
    measurementContext: { defaultLengthUnit: "unknown" },
    detectedSizeCount: 1,
    detectedSizes: ["ML"],
    rawRows: [
      ...BASE_LABELS.map(([label, field]) => ({ label, unit: null, unitSource: "unknown", values: [values[field]] })),
      { label: "Seat Tube Angle", unit: "°", unitSource: "explicit_row", values: [73.3] },
      { label: "Head Tube Angle", unit: "°", unitSource: "explicit_row", values: [71.9] },
    ],
  };
}

export function createNoUnitCmGeometryFixture() {
  return createNoUnitFixture({
    seatTubeLength: 53.3,
    effectiveTopTube: 55.3,
    headTubeLength: 17,
    chainstay: 42,
    wheelbase: 101,
    bbDrop: 7.8,
    forkOffset: 4.8,
    reach: 37.7,
    stack: 59.6,
  });
}

export function createNoUnitMmGeometryFixture() {
  return createNoUnitFixture({
    seatTubeLength: 525,
    effectiveTopTube: 554,
    headTubeLength: 175,
    chainstay: 420,
    wheelbase: 1018,
    bbDrop: 78,
    forkOffset: 48,
    reach: 377,
    stack: 591,
  });
}

export function createNoUnitMmDecimalGeometryFixture() {
  return createNoUnitFixture({
    seatTubeLength: 525.6,
    effectiveTopTube: 554.2,
    headTubeLength: 175.1,
    chainstay: 420.4,
    wheelbase: 998.5,
    bbDrop: 78.3,
    forkOffset: 48.2,
    reach: 380.8,
    stack: 571.2,
  });
}

export function createAmbiguousNoUnitGeometryFixture() {
  return {
    inputClassification: {
      type: "road_bike_geometry",
      confidence: 0.71,
      detectedBikeType: "road bike",
      reason: "Only a partial geometry table is visible without unit context.",
    },
    measurementContext: { defaultLengthUnit: "unknown" },
    detectedSizeCount: 1,
    detectedSizes: ["M"],
    rawRows: [
      { label: "Reach", unit: null, unitSource: "unknown", values: [120] },
      { label: "Stack", unit: null, unitSource: "unknown", values: [180] },
    ],
  };
}
