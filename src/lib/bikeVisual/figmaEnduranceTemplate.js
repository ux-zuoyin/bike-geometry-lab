export const FIGMA_ENDURANCE_TEMPLATE = {
  source: "Figma / 耐力架 / 1:823",
  canvas: { width: 1920, height: 1080 },
  anchors: {
    bottomBracket: { x: 880, y: 788 },
    rearAxle: { x: 578, y: 732 },
    frontAxle: { x: 1328, y: 732 },
    seatTubeTop: { x: 786, y: 467 },
    seatpostSocketAnchor: { x: 786, y: 467 },
    headTubeBottom: { x: 1201, y: 461 },
    headTubeTop: { x: 1176, y: 376 },
    saddleAnchor: { x: 706, y: 262 },
    handlebarAnchor: { x: 1348, y: 319 },
    drivePedal: { x: 1004, y: 788 },
    nonDrivePedal: { x: 756, y: 788 },
  },
  layers: {
    frameDownTube: { nodeId: "2:895", x: 858.616089, y: 407, width: 358.364258, height: 387.408783 },
    frameTopTube: { nodeId: "2:886", x: 782.500025, y: 372.000023, width: 394.471497, height: 117.5 },
    frameHeadTube: { nodeId: "2:885", x: 1154.999756, y: 361.156433, width: 66.535416, height: 115.539024 },
    frameChainstay: { nodeId: "2:931", x: 559.297699, y: 708.00354, width: 291.347687, height: 93.99707 },
    frameSeatstay: { nodeId: "2:922", x: 566.910034, y: 488, width: 221.589966, height: 237.5 },
    frameSeatTube: { nodeId: "2:909", x: 559.297913, y: 361.157166, width: 662.237671, height: 447.528931 },
    frameBottomBracket: { nodeId: "2:902", x: 824.999878, y: 719.834595, width: 113.089844, height: 88.851913 },
    frontRotor: { nodeId: "1:247", x: 1278, y: 682, width: 100, height: 100 },
    rearRotor: { nodeId: "1:256", x: 528, y: 682, width: 100, height: 100 },
    cassette: { nodeId: "1:79", x: 538, y: 692, width: 80, height: 80 },
    rearWheel: { nodeId: "1:217", x: 338, y: 492, width: 480, height: 480 },
    frontWheel: { nodeId: "1:223", x: 1088, y: 492, width: 480, height: 480 },
    seatpost: { nodeId: "1:298", x: 713, y: 272, width: 102, height: 256 },
    saddle: { nodeId: "1:300", x: 629, y: 242, width: 176, height: 40 },
    stem: { nodeId: "1:282", x: 1148, y: 313, width: 127, height: 54 },
    handlebar: { nodeId: "1:295", x: 1221, y: 287, width: 164, height: 162 },
    fork: { nodeId: "1:233", x: 1190, y: 470, width: 160, height: 282 },
    chainring: { nodeId: "1:21", x: 805, y: 713, width: 150, height: 150 },
    driveCrank: { nodeId: "1:40", x: 864, y: 772, width: 156, height: 32 },
    nonDriveCrank: { nodeId: "1:41", x: 740, y: 772, width: 156, height: 32 },
    chain: { nodeId: "1:93", x: 567, y: 713, width: 313, height: 149.136 },
    derailleur: { nodeId: "1:88", x: 543, y: 746, width: 62, height: 110 },
  },
  assetAnchors: {
    // Midpoints of the two tangent points that define the seatpost SVG center axis.
    seatpostTop: { layer: "seatpost", x: 13.5, y: 12.5 },
    seatpostBottom: { layer: "seatpost", x: 86.5, y: 243.5 },
    // Midpoint of the stem's steerer interface and center of its handlebar clamp cap.
    stemBase: { layer: "stem", x: 23.532695, y: 49.49415 },
    stemClamp: { layer: "stem", x: 111, y: 16 },
    // Stem clamp location on the original handlebar vector.
    handlebarClamp: { layer: "handlebar", x: 38, y: 41.79 },
    // Midpoint of the fork SVG top edge and center of its axle eye.
    forkTop: { layer: "fork", x: 16.16603, y: 4.0221845 },
    forkAxle: { layer: "fork", x: 138, y: 262 },
  },
};

const difference = (end, start) => ({ x: end.x - start.x, y: end.y - start.y });

export function affineFromThreePoints(source, target) {
  const sourceX = difference(source[1], source[0]);
  const sourceY = difference(source[2], source[0]);
  const targetX = difference(target[1], target[0]);
  const targetY = difference(target[2], target[0]);
  const determinant = sourceX.x * sourceY.y - sourceY.x * sourceX.y;

  const a = (targetX.x * sourceY.y - targetY.x * sourceX.y) / determinant;
  const c = (-targetX.x * sourceY.x + targetY.x * sourceX.x) / determinant;
  const b = (targetX.y * sourceY.y - targetY.y * sourceX.y) / determinant;
  const d = (-targetX.y * sourceY.x + targetY.y * sourceX.x) / determinant;
  const e = target[0].x - a * source[0].x - c * source[0].y;
  const f = target[0].y - b * source[0].x - d * source[0].y;

  return { a, b, c, d, e, f };
}

export function similarityFromTwoPoints(sourceStart, sourceEnd, targetStart, targetEnd) {
  const source = difference(sourceEnd, sourceStart);
  const target = difference(targetEnd, targetStart);
  const denominator = source.x ** 2 + source.y ** 2 || 1;
  const a = (target.x * source.x + target.y * source.y) / denominator;
  const b = (target.y * source.x - target.x * source.y) / denominator;
  const c = -b;
  const d = a;
  const e = targetStart.x - a * sourceStart.x - c * sourceStart.y;
  const f = targetStart.y - b * sourceStart.x - d * sourceStart.y;
  return { a, b, c, d, e, f };
}

export function orientedSegmentTransform(sourceStart, sourceEnd, targetStart, targetEnd, lateralScale) {
  const source = difference(sourceEnd, sourceStart);
  const target = difference(targetEnd, targetStart);
  const sourceLength = Math.hypot(source.x, source.y) || 1;
  const targetLength = Math.hypot(target.x, target.y) || 1;
  const sourceAxis = { x: source.x / sourceLength, y: source.y / sourceLength };
  const sourceNormal = { x: -sourceAxis.y, y: sourceAxis.x };
  const targetAxis = { x: target.x / targetLength, y: target.y / targetLength };
  const targetNormal = { x: -targetAxis.y, y: targetAxis.x };
  const axialScale = targetLength / sourceLength;

  const a = axialScale * targetAxis.x * sourceAxis.x + lateralScale * targetNormal.x * sourceNormal.x;
  const c = axialScale * targetAxis.x * sourceAxis.y + lateralScale * targetNormal.x * sourceNormal.y;
  const b = axialScale * targetAxis.y * sourceAxis.x + lateralScale * targetNormal.y * sourceNormal.x;
  const d = axialScale * targetAxis.y * sourceAxis.y + lateralScale * targetNormal.y * sourceNormal.y;
  const e = targetStart.x - a * sourceStart.x - c * sourceStart.y;
  const f = targetStart.y - b * sourceStart.x - d * sourceStart.y;
  return { a, b, c, d, e, f };
}

export function resolveAssetAnchor(template, anchorName) {
  const anchor = template.assetAnchors[anchorName];
  const layer = template.layers[anchor.layer];
  return { x: layer.x + anchor.x, y: layer.y + anchor.y };
}

export function uniformAroundPoint(source, target, scale) {
  return {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: target.x - source.x * scale,
    f: target.y - source.y * scale,
  };
}

export function applyMatrix(matrix, point) {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  };
}

export function composeMatrices(outer, inner) {
  return {
    a: outer.a * inner.a + outer.c * inner.b,
    b: outer.b * inner.a + outer.d * inner.b,
    c: outer.a * inner.c + outer.c * inner.d,
    d: outer.b * inner.c + outer.d * inner.d,
    e: outer.a * inner.e + outer.c * inner.f + outer.e,
    f: outer.b * inner.e + outer.d * inner.f + outer.f,
  };
}

export function matrixValue(matrix) {
  return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
}
