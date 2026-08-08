import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  bikeCatalog,
  bikeGeometryByModel,
  defaultFit,
  geometrySizes,
  getTrekDomaneSize,
  moduleItems,
  toBikeGeometry,
  trekDomane,
} from "../src/data/bikes.js";
import {
  DEFAULT_WHEELSET_ID,
  WHEELSET_CENTER,
  getWheelset,
  wheelsets,
} from "../src/config/wheelsets.js";
import { buildBikeGeometry } from "../src/lib/geometry/index.js";
import { bikeArchetypes } from "../src/config/bikeArchetypes.js";
import { taperedTubePath } from "../src/lib/bikeVisual/pathGeometry.js";
import {
  ENDURANCE_VISUAL_BASE_GEOMETRY,
  ENDURANCE_VISUAL_BASE_SIZE,
  enduranceGeometrySizes,
  getEnduranceVisualDelta,
} from "../src/data/enduranceGeometry.js";
import {
  FIGMA_ENDURANCE_TEMPLATE,
  affineFromThreePoints,
  applyMatrix,
  orientedSegmentTransform,
  resolveAssetAnchor,
} from "../src/lib/bikeVisual/figmaEnduranceTemplate.js";
import { getSeatpostVisualAnchors } from "../src/lib/bikeVisual/seatpostGeometry.js";
import {
  PREVIEW_MOTION_CONFIG,
  getRotationAnimation,
  oppositePointAround,
} from "../src/lib/bikeVisual/previewMotion.js";

const identityMatrixError = (matrix) => Math.max(
  Math.abs(matrix.a - 1),
  Math.abs(matrix.b),
  Math.abs(matrix.c),
  Math.abs(matrix.d - 1),
  Math.abs(matrix.e),
  Math.abs(matrix.f),
);

const enduranceTemplateSource = readFileSync(
  new URL("../src/components/bike/templates/EnduranceBikeTemplate.jsx", import.meta.url),
  "utf8",
);
const bikeVisualizerSource = readFileSync(
  new URL("../src/components/visualizer/BikeVisualizer.jsx", import.meta.url),
  "utf8",
);
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const controlPanelSource = readFileSync(
  new URL("../src/components/controls/ControlPanel.jsx", import.meta.url),
  "utf8",
);
const wheelsetVisualsSource = readFileSync(
  new URL("../src/config/wheelsetVisuals.js", import.meta.url),
  "utf8",
);

test("frame points respect stack and reach", () => {
  const geometry = enduranceGeometrySizes[56];
  const bike = buildBikeGeometry(geometry, defaultFit);
  assert.equal(bike.frame.headTop.x, geometry.reach);
  assert.equal(bike.frame.headTop.y, geometry.stack);
  assert.equal(bike.frame.rearAxle.y, geometry.bbDrop);
  assert.equal(bike.frame.frontAxle.y, geometry.bbDrop);
  assert.ok(bike.frame.bb.y < bike.frame.rearAxle.y, "BB drop places the bottom bracket below the axle line");
  assert.ok(bike.frame.headBottom.x > bike.frame.headTop.x, "road head tube slopes rearward toward its top");
  assert.ok(bike.frame.headBottom.y < bike.frame.headTop.y, "head tube bottom remains below its top in geometry coordinates");
});

test("cockpit setting moves handlebar contact point", () => {
  const geometry = enduranceGeometrySizes[56];
  const short = buildBikeGeometry(geometry, { ...defaultFit, stemLength: 90 });
  const long = buildBikeGeometry(geometry, { ...defaultFit, stemLength: 120 });
  assert.ok(long.contacts.handlebar.x > short.contacts.handlebar.x + 20);
});

test("crank length changes pedal without moving bottom bracket", () => {
  const geometry = enduranceGeometrySizes[56];
  const short = buildBikeGeometry(geometry, { ...defaultFit, crankLength: 165 });
  const long = buildBikeGeometry(geometry, { ...defaultFit, crankLength: 175 });
  assert.deepEqual(short.frame.bb, long.frame.bb);
  assert.notDeepEqual(short.contacts.pedal, long.contacts.pedal);
});

test("the runtime exposes Endurance as its only visual archetype", () => {
  assert.deepEqual(Object.keys(bikeArchetypes), ["endurance"]);
  assert.equal(bikeArchetypes.endurance.label, "Endurance");
});

test("Trek Domane is the only catalog model and stores all seven sizes in millimetres", () => {
  assert.deepEqual(Object.keys(bikeCatalog), ["trek-domane"]);
  assert.equal(bikeCatalog["trek-domane"], trekDomane);
  assert.deepEqual(geometrySizes, ["44", "49", "52", "54", "56", "58", "61"]);
  assert.deepEqual(Object.keys(bikeGeometryByModel), ["trek-domane"]);
  assert.equal(trekDomane.sizes.length, 7);
  assert.equal(trekDomane.sourceNote, "Extracted from Trek Domane geometry chart provided by user; original length values shown in cm and converted to mm.");

  const size56 = getTrekDomaneSize("56");
  assert.equal(size56.seatTubeLengthMm, 525);
  assert.equal(size56.headTubeLengthMm, 175);
  assert.equal(size56.stackMm, 591);
  assert.equal(size56.seatTubeAngleDeg, 73.3);
  assert.equal(size56.wheelSize, "700c");
});

test("Bike Components exposes three paired 700C wheelsets with a shared explicit center anchor", () => {
  assert.equal(DEFAULT_WHEELSET_ID, "midProfile");
  assert.deepEqual(WHEELSET_CENTER, { x: 240, y: 240 });
  assert.deepEqual(wheelsets.map(({ id, name, wheelSize }) => [id, name, wheelSize]), [
    ["lowProfile", "低框轮组", "700c"],
    ["midProfile", "中框轮组", "700c"],
    ["deepProfile", "高框轮组", "700c"],
  ]);
  assert.equal(getWheelset("unknown").id, DEFAULT_WHEELSET_ID);
  assert.deepEqual(wheelsets.map(({ figma }) => figma.groupNodeId), ["2:948", "2:979", "2:994"]);
  assert.ok(moduleItems.some(({ id, label }) => id === "components" && label === "车身配件"));
});

test("wheelset visuals replace only the paired Figma wheel assets and stay axle-driven", () => {
  for (const assetName of [
    "wheel-low-profile.svg",
    "wheel-mid-profile.svg",
    "wheel-deep-profile-front.svg",
    "wheel-deep-profile-rear.svg",
  ]) {
    const source = readFileSync(
      new URL(`../src/assets/bikeTemplates/endurance/${assetName}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /viewBox="0 0 480 480"/);
  }
  assert.match(wheelsetVisualsSource, /lowProfile: \{[\s\S]*front: lowProfileWheel,[\s\S]*rear: lowProfileWheel/);
  assert.match(wheelsetVisualsSource, /midProfile: \{[\s\S]*front: midProfileWheel,[\s\S]*rear: midProfileWheel/);
  assert.match(wheelsetVisualsSource, /deepProfile: \{[\s\S]*front: deepProfileFrontWheel,[\s\S]*rear: deepProfileRearWheel/);
  assert.match(enduranceTemplateSource, /const center = project\(axle\)/);
  assert.match(enduranceTemplateSource, /data-wheel-center-source="geometry-axle"/);
  assert.match(enduranceTemplateSource, /asset=\{wheelVisual\.rear\}/);
  assert.match(enduranceTemplateSource, /asset=\{wheelVisual\.front\}/);
  assert.match(enduranceTemplateSource, /asset=\{frontRotor\}/);
  assert.match(enduranceTemplateSource, /asset=\{rearRotor\}/);
});

test("wheelset Bike Setup state is independent from Domane size state", () => {
  assert.match(appSource, /useState\(\{ wheelset: DEFAULT_WHEELSET_ID \}\)/);
  assert.match(appSource, /useState\(trekDomane\.visualBaseSize\)/);
  assert.match(appSource, /<BikeVisualizer bike=\{bike\} fit=\{fit\} wheelset=\{wheelset\} \/>/);
  assert.match(controlPanelSource, /role="radiogroup" aria-label="轮组类型"/);
  assert.match(controlPanelSource, /updateBikeSetup\("wheelset", wheelset\.id\)/);
  assert.doesNotMatch(appSource, /setBikeSetup\([^\n]*selectedSize/);
});

test("all Trek Domane source rows preserve the supplied normalized geometry fields", () => {
  const expected = {
    44: ["700c", 390, 74.6, 95, 70.3, 507, 80, 420, 53, 66, 983, 657, 360, 510],
    49: ["700c", 440, 74.6, 123, 70.8, 516, 80, 425, 53, 66, 1001, 717, 368, 540],
    52: ["700c", 475, 74.2, 145, 71.3, 530, 80, 420, 53, 59, 1003, 735, 371, 561],
    54: ["700c", 500, 73.7, 160, 71.3, 542, 80, 420, 53, 59, 1010, 754, 374, 575],
    56: ["700c", 525, 73.3, 175, 71.9, 554, 78, 420, 48, 61, 1018, 776, 377, 591],
    58: ["700c", 548, 73, 195, 72, 567, 78, 425, 48, 60, 1022, 796, 380, 611],
    61: ["700c", 576, 72.7, 235, 72.1, 586, 75, 425, 48, 63, 1038, 842, 385, 646],
  };

  for (const size of geometrySizes) {
    const row = getTrekDomaneSize(size);
    assert.deepEqual([
      row.wheelSize,
      row.seatTubeLengthMm,
      row.seatTubeAngleDeg,
      row.headTubeLengthMm,
      row.headTubeAngleDeg,
      row.effectiveTopTubeMm,
      row.bbDropMm,
      row.chainstayMm,
      row.forkOffsetMm,
      row.trailMm,
      row.wheelbaseMm,
      row.standoverMm,
      row.reachMm,
      row.stackMm,
    ], expected[size]);
  }
});

test("the product schema adapter drives the geometry layer without leaking unitless storage fields", () => {
  assert.deepEqual(Object.keys(enduranceGeometrySizes), geometrySizes);
  const geometry = toBikeGeometry(getTrekDomaneSize("54"));
  const bike = buildBikeGeometry(geometry, defaultFit);
  assert.deepEqual(bike.frame.headTop, { x: 374, y: 575 });
  assert.equal(geometry.chainstay, 420);
  assert.equal(geometry.forkRake, 53);
  assert.equal(geometry.trail, 59);
  assert.deepEqual(bike.anchors.headTubeTop, { x: 374, y: 575 });
  assert.deepEqual(bike.anchors.bottomBracket, { x: 0, y: 0 });
});

test("Endurance visual deltas are explicitly calibrated against size 56", () => {
  assert.equal(ENDURANCE_VISUAL_BASE_SIZE, "56");
  assert.equal(ENDURANCE_VISUAL_BASE_GEOMETRY.stack, 591);
  assert.equal(ENDURANCE_VISUAL_BASE_GEOMETRY.reach, 377);
  assert.equal(ENDURANCE_VISUAL_BASE_GEOMETRY.headTube, 175);
  assert.equal(ENDURANCE_VISUAL_BASE_GEOMETRY.headAngle, 71.9);
  assert.equal(ENDURANCE_VISUAL_BASE_GEOMETRY.wheelbase, 1018);

  const expected = {
    44: { stack: -81, reach: -17, headTube: -80, headAngle: -1.6, wheelbase: -35, scale: 95 / 175 },
    49: { stack: -51, reach: -9, headTube: -52, headAngle: -1.1, wheelbase: -17, scale: 123 / 175 },
    52: { stack: -30, reach: -6, headTube: -30, headAngle: -0.6, wheelbase: -15, scale: 145 / 175 },
    54: { stack: -16, reach: -3, headTube: -15, headAngle: -0.6, wheelbase: -8, scale: 160 / 175 },
    56: { stack: 0, reach: 0, headTube: 0, headAngle: 0, wheelbase: 0, scale: 1 },
    58: { stack: 20, reach: 3, headTube: 20, headAngle: 0.1, wheelbase: 4, scale: 195 / 175 },
    61: { stack: 55, reach: 8, headTube: 60, headAngle: 0.2, wheelbase: 20, scale: 235 / 175 },
  };
  for (const size of geometrySizes) {
    const delta = getEnduranceVisualDelta(enduranceGeometrySizes[size]);
    assert.equal(delta.stack, expected[size].stack);
    assert.equal(delta.reach, expected[size].reach);
    assert.equal(delta.headTube, expected[size].headTube);
    assert.ok(Math.abs(delta.headAngle - expected[size].headAngle) < 1e-9);
    assert.equal(delta.wheelbase, expected[size].wheelbase);
    assert.ok(Math.abs(delta.headTubeScale - expected[size].scale) < 1e-9);
  }
});

test("size 56 produces identity local delta transforms for every split frame part", () => {
  const bike = buildBikeGeometry(ENDURANCE_VISUAL_BASE_GEOMETRY, defaultFit);
  const projected = Object.fromEntries(
    Object.entries(bike.anchors).map(([key, point]) => [key, { x: 430 + point.x * 0.41, y: 420 - point.y * 0.41 }]),
  );
  const bodyDelta = affineFromThreePoints(
    [projected.bottomBracket, projected.rearAxle, projected.seatTubeTop],
    [projected.bottomBracket, projected.rearAxle, projected.seatTubeTop],
  );
  const tubeDeltas = [
    orientedSegmentTransform(projected.headTubeTop, projected.headTubeBottom, projected.headTubeTop, projected.headTubeBottom, 1),
    orientedSegmentTransform(projected.seatTubeTop, projected.headTubeTop, projected.seatTubeTop, projected.headTubeTop, 1),
    orientedSegmentTransform(projected.bottomBracket, projected.headTubeBottom, projected.bottomBracket, projected.headTubeBottom, 1),
  ];
  assert.ok(identityMatrixError(bodyDelta) < 1e-9);
  for (const matrix of tubeDeltas) assert.ok(identityMatrixError(matrix) < 1e-9);
});

test("endurance head tube anchors use each size's real length and angle", () => {
  const expected = {
    44: { stack: 510, reach: 360, length: 95, angle: 70.3 },
    49: { stack: 540, reach: 368, length: 123, angle: 70.8 },
    52: { stack: 561, reach: 371, length: 145, angle: 71.3 },
    54: { stack: 575, reach: 374, length: 160, angle: 71.3 },
    56: { stack: 591, reach: 377, length: 175, angle: 71.9 },
    58: { stack: 611, reach: 380, length: 195, angle: 72 },
    61: { stack: 646, reach: 385, length: 235, angle: 72.1 },
  };
  for (const size of geometrySizes) {
    const bike = buildBikeGeometry(enduranceGeometrySizes[size], defaultFit);
    const { headTop, headBottom } = bike.frame;
    const length = Math.hypot(headBottom.x - headTop.x, headBottom.y - headTop.y);
    const angle = Math.atan2(headTop.y - headBottom.y, headBottom.x - headTop.x) * 180 / Math.PI;
    assert.deepEqual(headTop, { x: expected[size].reach, y: expected[size].stack });
    assert.ok(Math.abs(length - expected[size].length) < 1e-9);
    assert.ok(Math.abs(angle - expected[size].angle) < 1e-9);
  }
});

test("Figma split frame body mapping keeps BB, rear axle and seat cluster authoritative", () => {
  const geometry = enduranceGeometrySizes[54];
  const bike = buildBikeGeometry(geometry, defaultFit);
  const projected = Object.fromEntries(Object.entries(bike.anchors).map(([key, point]) => [key, { x: 430 + point.x * 0.41, y: 420 - point.y * 0.41 }]));
  const source = FIGMA_ENDURANCE_TEMPLATE.anchors;
  const matrix = affineFromThreePoints(
    [source.bottomBracket, source.rearAxle, source.seatTubeTop],
    [projected.bottomBracket, projected.rearAxle, projected.seatTubeTop],
  );
  for (const [sourcePoint, targetPoint] of [
    [source.bottomBracket, projected.bottomBracket],
    [source.rearAxle, projected.rearAxle],
    [source.seatTubeTop, projected.seatTubeTop],
  ]) {
    const mapped = applyMatrix(matrix, sourcePoint);
    assert.ok(Math.abs(mapped.x - targetPoint.x) < 1e-9);
    assert.ok(Math.abs(mapped.y - targetPoint.y) < 1e-9);
  }
});

test("Figma endurance frame uses the new semantic split nodes", () => {
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.source, "Figma / 耐力架 / 1:823");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameHeadTube.nodeId, "2:885");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameTopTube.nodeId, "2:886");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameDownTube.nodeId, "2:895");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameSeatTube.nodeId, "2:909");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameSeatstay.nodeId, "2:922");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameChainstay.nodeId, "2:931");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frameBottomBracket.nodeId, "2:902");
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.frame, undefined);
});

test("Endurance SVG keeps the chainring and drive crank above every production part", () => {
  const renderOrderTokens = [
    'renderLayer="front-rotor"',
    'renderLayer="rear-rotor"',
    'renderLayer="cassette"',
    'renderLayer="non-drive-crank"',
    'renderLayer="rear-wheel"',
    'renderLayer="front-wheel"',
    'renderLayer="seatpost"',
    'renderLayer="saddle"',
    'data-render-layer="cockpit"',
    'renderLayer="fork"',
    'data-render-layer="frame"',
    'renderLayer="chain"',
    'renderLayer="derailleur"',
    'renderLayer="chainring"',
    'renderLayer="drive-crank"',
    "{showFigmaAnchors && (",
  ];
  let previousIndex = -1;
  for (const token of renderOrderTokens) {
    const index = enduranceTemplateSource.indexOf(token);
    assert.ok(index > previousIndex, `${token} must render after the preceding Figma layer`);
    previousIndex = index;
  }
  assert.match(enduranceTemplateSource, /user-prioritized chainring and drive crank render above all production parts\./);
});

test("preview motion is permanently enabled, infinitely looping, and based on 50 RPM cadence", () => {
  assert.equal(PREVIEW_MOTION_CONFIG.cadenceRpm, 50);
  assert.equal(PREVIEW_MOTION_CONFIG.wheelRpm, 62.5);
  assert.equal(PREVIEW_MOTION_CONFIG.wheelDurationSeconds, 0.96);
  assert.equal(PREVIEW_MOTION_CONFIG.crankDurationSeconds, 1.2);
  assert.equal(PREVIEW_MOTION_CONFIG.crankDurationSeconds, 60 / PREVIEW_MOTION_CONFIG.cadenceRpm);
  assert.ok(PREVIEW_MOTION_CONFIG.wheelDurationSeconds < PREVIEW_MOTION_CONFIG.crankDurationSeconds);
  assert.deepEqual(getRotationAnimation({ x: 430, y: 420 }), {
    from: "0 430 420",
    to: "360 430 420",
  });
  assert.match(enduranceTemplateSource, /data-preview-motion="always-on"/);
  assert.match(enduranceTemplateSource, /repeatCount="indefinite"/);
  assert.doesNotMatch(enduranceTemplateSource, /motionEnabled/);
  assert.doesNotMatch(bikeVisualizerSource, /Preview Motion/);
});

test("non-drive crank starts exactly opposite the drive crank and shares its rotation cycle", () => {
  const bb = { x: 430, y: 420 };
  const drivePedal = { x: 492, y: 471 };
  const nonDrivePedal = oppositePointAround(bb, drivePedal);
  assert.deepEqual(nonDrivePedal, { x: 368, y: 369 });
  assert.equal(drivePedal.x - bb.x, -(nonDrivePedal.x - bb.x));
  assert.equal(drivePedal.y - bb.y, -(nonDrivePedal.y - bb.y));
  assert.match(enduranceTemplateSource, /phaseOffset=\{180\} renderLayer="non-drive-crank" syncGroup="crankset"/);
});

test("Figma component connection anchors remain exact for all seven Domane sizes", () => {
  const visualScale = (336 * 2 * 0.41) / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width;
  const asset = Object.fromEntries(
    Object.keys(FIGMA_ENDURANCE_TEMPLATE.assetAnchors).map((name) => [
      name,
      resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, name),
    ]),
  );

  for (const size of geometrySizes) {
    const bike = buildBikeGeometry(enduranceGeometrySizes[size], defaultFit);
    const projected = Object.fromEntries(
      Object.entries(bike.anchors).map(([key, point]) => [key, { x: 430 + point.x * 0.41, y: 420 - point.y * 0.41 }]),
    );
    const sourceFrame = FIGMA_ENDURANCE_TEMPLATE.anchors;
    const frameBodyMatrix = affineFromThreePoints(
      [sourceFrame.bottomBracket, sourceFrame.rearAxle, sourceFrame.seatTubeTop],
      [projected.bottomBracket, projected.rearAxle, projected.seatTubeTop],
    );
    const parent = {
      bottomBracket: applyMatrix(frameBodyMatrix, sourceFrame.bottomBracket),
      seatpostSocketAnchor: applyMatrix(frameBodyMatrix, sourceFrame.seatpostSocketAnchor),
      headTop: projected.headTubeTop,
      headBottom: projected.headTubeBottom,
    };
    const seatpostAnchors = getSeatpostVisualAnchors({
      bottomBracket: parent.bottomBracket,
      socketAnchor: parent.seatpostSocketAnchor,
      saddleClampReference: projected.saddleClampAnchor,
      saddleVisualReference: projected.saddleVisualAnchor,
      saddleContactReference: projected.saddleContactPoint,
    });
    const mappings = [
      {
        sourceStart: asset.seatpostBottom,
        sourceEnd: asset.seatpostTop,
        targetStart: parent.seatpostSocketAnchor,
        targetEnd: seatpostAnchors.seatpostTop,
      },
      {
        sourceStart: asset.stemBase,
        sourceEnd: asset.stemClamp,
        targetStart: parent.headTop,
        targetEnd: projected.stemEnd,
      },
      {
        sourceStart: asset.forkTop,
        sourceEnd: asset.forkAxle,
        targetStart: parent.headBottom,
        targetEnd: projected.frontAxle,
      },
      {
        sourceStart: sourceFrame.headTubeTop,
        sourceEnd: sourceFrame.headTubeBottom,
        targetStart: parent.headTop,
        targetEnd: parent.headBottom,
      },
      {
        sourceStart: sourceFrame.seatTubeTop,
        sourceEnd: sourceFrame.headTubeTop,
        targetStart: parent.seatpostSocketAnchor,
        targetEnd: parent.headTop,
      },
      {
        sourceStart: sourceFrame.bottomBracket,
        sourceEnd: sourceFrame.headTubeBottom,
        targetStart: parent.bottomBracket,
        targetEnd: parent.headBottom,
      },
    ];

    for (const mapping of mappings) {
      const matrix = orientedSegmentTransform(
        mapping.sourceStart,
        mapping.sourceEnd,
        mapping.targetStart,
        mapping.targetEnd,
        visualScale,
      );
      const mappedStart = applyMatrix(matrix, mapping.sourceStart);
      const mappedEnd = applyMatrix(matrix, mapping.sourceEnd);
      assert.ok(Math.hypot(mappedStart.x - mapping.targetStart.x, mappedStart.y - mapping.targetStart.y) < 1e-9);
      assert.ok(Math.hypot(mappedEnd.x - mapping.targetEnd.x, mappedEnd.y - mapping.targetEnd.y) < 1e-9);
    }
    assert.ok(seatpostAnchors.axisError < 1e-9);
    assert.ok(seatpostAnchors.exposedLength > 0);
  }
});

test("saddle clamp follows the frame seat tube and exposed seatpost changes by size", () => {
  const bikes = geometrySizes.map((size) => buildBikeGeometry(enduranceGeometrySizes[size], defaultFit));
  for (const bike of bikes) {
    const seatAxis = {
      x: bike.anchors.seatTubeTop.x - bike.anchors.bottomBracket.x,
      y: bike.anchors.seatTubeTop.y - bike.anchors.bottomBracket.y,
    };
    const clampAxis = {
      x: bike.anchors.saddleClampAnchor.x - bike.anchors.bottomBracket.x,
      y: bike.anchors.saddleClampAnchor.y - bike.anchors.bottomBracket.y,
    };
    const cross = seatAxis.x * clampAxis.y - seatAxis.y * clampAxis.x;
    assert.ok(Math.abs(cross) < 1e-9);
    assert.ok(Math.abs(Math.hypot(clampAxis.x, clampAxis.y) - defaultFit.saddleHeight) < 1e-9);
  }

  const exposedLengths = bikes.map((bike) => Math.hypot(
    bike.anchors.saddleClampAnchor.x - bike.anchors.seatTubeTop.x,
    bike.anchors.saddleClampAnchor.y - bike.anchors.seatTubeTop.y,
  ));
  for (let index = 1; index < exposedLengths.length; index += 1) {
    assert.ok(exposedLengths[index - 1] > exposedLengths[index]);
  }
});

test("saddle setback moves the saddle relative to its clamp without rotating the seatpost axis", () => {
  const geometry = enduranceGeometrySizes[54];
  const forward = buildBikeGeometry(geometry, { ...defaultFit, saddleSetback: 0 });
  const rearward = buildBikeGeometry(geometry, { ...defaultFit, saddleSetback: 40 });
  assert.deepEqual(forward.anchors.saddleClampAnchor, rearward.anchors.saddleClampAnchor);
  assert.equal(rearward.anchors.saddleVisualAnchor.x, forward.anchors.saddleVisualAnchor.x - 40);
  assert.equal(rearward.anchors.saddleContactPoint.x, forward.anchors.saddleContactPoint.x - 40);
  assert.equal(rearward.anchors.saddleContactPoint.y, forward.anchors.saddleContactPoint.y);
});

test("visual tube helper builds a closed tapered outline", () => {
  const path = taperedTubePath({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 20);
  assert.match(path, /^M /);
  assert.match(path, / Z$/);
  assert.ok(path.includes("100 10"));
});
