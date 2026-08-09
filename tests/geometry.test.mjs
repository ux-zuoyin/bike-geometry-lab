import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  bikeCatalog,
  bikeGeometryByModel,
  defaultFit,
  geometrySizes,
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "../src/data/bikes.js";
import {
  BikeComponents,
  CASSETTE_CENTER_ANCHOR,
  DEFAULT_COMPONENT_SETUP,
  FIGMA_WHEEL_RESOURCE_GROUP,
  WHEEL_CENTER_ANCHOR,
  resolveComponentSetup,
  updateWheelSelection,
  updateWheelSelectionLink,
} from "../src/config/bikeComponents.js";
import { DEFAULT_FIT_SETUP, STEM_ANGLE_OPTIONS, toGeometryFit } from "../src/config/fitSetup.js";
import {
  COLOR_PRESETS,
  DEFAULT_BIKE_COLORS,
  normalizeBikeColor,
} from "../src/config/colorPresets.js";
import {
  BIKE_SETUP_STORAGE_KEY,
  createDefaultBikeSetup,
  parsePersistedBikeSetup,
  persistBikeSetup,
  readPersistedBikeSetup,
} from "../src/config/setupPersistence.js";
import { buildBikeGeometry } from "../src/lib/geometry/index.js";
import { BASE_COCKPIT_STACK_HEIGHT_MM, HEADSET_STACK_HEIGHT, getEffectiveStemPitch } from "../src/lib/geometry/cockpitGeometry.js";
import {
  PIXELS_PER_MM,
  REFERENCE_WHEEL_OUTER_DIAMETER_MM,
  RENDERED_WHEEL_DIAMETER_PX,
  WHEEL_RADIUS,
  createProjector,
  getPhysicalScaleAudit,
} from "../src/lib/geometry/frameGeometry.js";
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
  composeMatrices,
  getHandlebarContactOffsetMm,
  orientedSegmentTransform,
  resolveAssetAnchor,
  uniformAroundPoint,
} from "../src/lib/bikeVisual/figmaEnduranceTemplate.js";
import { getSeatpostVisualAnchors } from "../src/lib/bikeVisual/seatpostGeometry.js";
import {
  PREVIEW_MOTION_CONFIG,
  getRotationAnimation,
  oppositePointAround,
} from "../src/lib/bikeVisual/previewMotion.js";
import {
  PRISM_GROUND_Y_RATIO,
  getBikeStageGroundAlignment,
} from "../src/lib/bikeVisual/stageGroundAlignment.js";
import {
  ACTIVE_BIKES,
  createBikeFromGeometryImport,
  createComparisonBike,
  getRenderableComponentSetup,
  updateBikeSize,
  updateBikeGeometry,
} from "../src/state/dualBikeState.js";
import { getSTRProfile } from "../src/lib/geometry/strProfile.js";
import {
  addGeometryImportDraftSize,
  GEOMETRY_IMPORT_FIELDS,
  GEOMETRY_IMPORT_STATUSES,
  importGeometryToSizeData,
  updateGeometryImportDraftField,
  validateGeometryImportDraft,
} from "../src/state/geometryImportState.js";
import {
  MAX_BIKES,
  addWorkspaceBike,
  deleteWorkspaceBike,
  replaceWorkspaceBike,
} from "../src/state/workspaceBikes.js";
import { createMockGeometryImportDraft } from "../src/data/mockGeometryImport.js";
import { WELCOME_COMPLETED_STORAGE_KEY } from "../src/config/welcomePersistence.js";

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
const fullscreenGeometrySummarySource = readFileSync(
  new URL("../src/components/visualizer/FullscreenGeometrySummary.jsx", import.meta.url),
  "utf8",
);
const roadBikeVisualSource = readFileSync(
  new URL("../src/components/visualizer/bikeParts/RoadBikeVisual.jsx", import.meta.url),
  "utf8",
);
const dualBikeControlsSource = readFileSync(
  new URL("../src/components/comparison/DualBikeControls.jsx", import.meta.url),
  "utf8",
);
const prismSource = readFileSync(
  new URL("../src/components/visualizer/Prism.jsx", import.meta.url),
  "utf8",
);
const prismCssSource = readFileSync(
  new URL("../src/components/visualizer/Prism.css", import.meta.url),
  "utf8",
);
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const frameBottomBracketSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/frame-bottom-bracket.svg", import.meta.url),
  "utf8",
);
const wheelOuterSources = ["low", "mid", "deep", "disc", "wave", "trispoke"].map((name) => readFileSync(
  new URL(`../src/assets/bikeComponents/wheel/${name}.svg`, import.meta.url),
  "utf8",
));
const wheelInnerSources = ["low", "mid", "deep", "disc", "wave", "trispoke"].map((name) => readFileSync(
  new URL(`../src/assets/bikeComponents/wheel/${name}-inner.svg`, import.meta.url),
  "utf8",
));
const forkSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/fork.svg", import.meta.url),
  "utf8",
);
const frameChainstaySource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/frame-chainstay.svg", import.meta.url),
  "utf8",
);
const framePanelSource = readFileSync(
  new URL("../src/components/panels/FrameGeometryPanel.jsx", import.meta.url),
  "utf8",
);
const geometryImportFlowSource = readFileSync(
  new URL("../src/components/import/GeometryImportFlow.jsx", import.meta.url),
  "utf8",
);
const welcomeGateSource = readFileSync(
  new URL("../src/components/import/WelcomeGate.jsx", import.meta.url),
  "utf8",
);
const geometryImageAnalyzerSource = readFileSync(
  new URL("../src/services/geometryImageAnalyzer.js", import.meta.url),
  "utf8",
);
const setupPanelSource = readFileSync(
  new URL("../src/components/panels/BikeSetupPanel.jsx", import.meta.url),
  "utf8",
);
const rangeControlSource = readFileSync(
  new URL("../src/components/ui/RangeControl.jsx", import.meta.url),
  "utf8",
);
const colorPaletteSource = readFileSync(
  new URL("../src/components/ui/ColorPalette.jsx", import.meta.url),
  "utf8",
);
const bikeComponentsSource = readFileSync(
  new URL("../src/config/bikeComponents.js", import.meta.url),
  "utf8",
);
const spacerVisualSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/spacer.svg", import.meta.url),
  "utf8",
);
const seatpostVisualSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/seatpost.svg", import.meta.url),
  "utf8",
);
const handlebarHoodSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/handlebar-hood.svg", import.meta.url),
  "utf8",
);
const handlebarTapeSource = readFileSync(
  new URL("../src/assets/bikeTemplates/endurance/handlebar-tape.svg", import.meta.url),
  "utf8",
);

const readSvgSourcesRecursively = (directoryUrl) => readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
  const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directoryUrl);
  if (entry.isDirectory()) return readSvgSourcesRecursively(entryUrl);
  return entry.name.endsWith(".svg") ? [{ name: entryUrl.pathname, source: readFileSync(entryUrl, "utf8") }] : [];
});

const bicycleSvgSources = [
  ...readSvgSourcesRecursively(new URL("../src/assets/bikeTemplates/endurance/", import.meta.url)),
  ...readSvgSourcesRecursively(new URL("../src/assets/bikeComponents/", import.meta.url)),
];

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

test("700C outer diameter is the single physical scale for every geometry metric", () => {
  const geometry = enduranceGeometrySizes[56];
  const bike = buildBikeGeometry(geometry, defaultFit);
  const audit = getPhysicalScaleAudit(bike.frame, geometry);
  const legacyWheelbaseRatio = geometry.wheelbase / 672;
  const calibratedWheelbaseRatio = (geometry.wheelbase * PIXELS_PER_MM) / RENDERED_WHEEL_DIAMETER_PX;

  assert.equal(REFERENCE_WHEEL_OUTER_DIAMETER_MM, 686);
  assert.equal(RENDERED_WHEEL_DIAMETER_PX, 275.52);
  assert.equal(WHEEL_RADIUS, 343);
  assert.ok(Math.abs(PIXELS_PER_MM - 0.4016326530612245) < 1e-12);
  assert.ok(Math.abs(legacyWheelbaseRatio - 1.5148809523809523) < 1e-12);
  assert.ok(Math.abs(calibratedWheelbaseRatio - 1018 / 686) < 1e-12);
  assert.ok(Math.abs((geometry.stack * PIXELS_PER_MM) / RENDERED_WHEEL_DIAMETER_PX - 591 / 686) < 1e-12);
  assert.ok(Math.abs((geometry.reach * PIXELS_PER_MM) / RENDERED_WHEEL_DIAMETER_PX - 377 / 686) < 1e-12);
  assert.ok(Math.abs((geometry.headTube * PIXELS_PER_MM) / RENDERED_WHEEL_DIAMETER_PX - 175 / 686) < 1e-12);
  for (const metric of audit.measurements) {
    assert.ok(Math.abs(metric.renderedMm - metric.expectedMm) < 1e-9, `${metric.key} must round-trip through the shared scale`);
    assert.ok(Math.abs(metric.errorMm) < 1e-9);
  }

  for (const size of geometrySizes) {
    const sizedGeometry = enduranceGeometrySizes[size];
    const sizedBike = buildBikeGeometry(sizedGeometry, defaultFit);
    const sizedAudit = getPhysicalScaleAudit(sizedBike.frame, sizedGeometry);
    assert.equal(sizedAudit.pixelsPerMm, PIXELS_PER_MM);
  }
});

test("cockpit setting moves handlebar contact point", () => {
  const geometry = enduranceGeometrySizes[56];
  const short = buildBikeGeometry(geometry, { ...defaultFit, stemLength: 90 });
  const long = buildBikeGeometry(geometry, { ...defaultFit, stemLength: 120 });
  assert.ok(long.contacts.handlebar.x > short.contacts.handlebar.x + 20);
});

test("Cockpit Geometry follows the steerer axis and uses nominal stem angle", () => {
  const geometry = enduranceGeometrySizes[56];
  const spacer0 = buildBikeGeometry(geometry, { ...defaultFit, spacer: 0, stemLength: 90, stemAngle: -12 });
  const spacer25 = buildBikeGeometry(geometry, { ...defaultFit, spacer: 25, stemLength: 90, stemAngle: -12 });
  const nearLevel = buildBikeGeometry(geometry, { ...defaultFit, spacer: 0, stemLength: 90, stemAngle: -18 });
  const zeroAngle = buildBikeGeometry(geometry, { ...defaultFit, spacer: 0, stemLength: 90, stemAngle: 0 });

  assert.equal(HEADSET_STACK_HEIGHT, 45);
  assert.equal(BASE_COCKPIT_STACK_HEIGHT_MM, 45);
  assert.deepEqual(DEFAULT_FIT_SETUP, {
    spacerHeight: 15,
    stemLength: 110,
    stemAngle: -12,
    saddleHeight: 738,
    saddleSetback: 8,
    crankLength: 170,
  });
  assert.deepEqual(spacer0.cockpit.spacerHeadtubeAnchor, spacer0.frame.headTop);
  assert.ok(Math.abs(spacer0.cockpit.stemBase.x - (spacer0.frame.headTop.x - 45 * Math.cos(geometry.headAngle * Math.PI / 180))) < 1e-9);
  assert.ok(Math.abs(spacer0.cockpit.stemBase.y - (spacer0.frame.headTop.y + 45 * Math.sin(geometry.headAngle * Math.PI / 180))) < 1e-9);
  assert.deepEqual(spacer0.cockpit.spacerTop, spacer0.cockpit.stemBase);
  assert.deepEqual(spacer0.cockpit.stemSpacerAnchor, spacer0.cockpit.stemBase);
  assert.equal(spacer0.cockpit.baseCockpitStackHeight, 45);
  assert.equal(spacer0.cockpit.totalSpacerStackHeight, 45);
  assert.deepEqual(spacer0.cockpit.stemHandlebarAnchor, spacer0.cockpit.handlebarClampAnchor);
  assert.ok(Math.abs(spacer0.cockpit.effectiveStemPitch - 6.1) < 1e-9);
  assert.ok(Math.abs(nearLevel.cockpit.effectiveStemPitch - 0.1) < 1e-9);
  assert.ok(Math.abs(zeroAngle.cockpit.effectiveStemPitch - 18.1) < 1e-9);

  const expectedSpacerDelta = {
    x: -25 * Math.cos(geometry.headAngle * Math.PI / 180),
    y: 25 * Math.sin(geometry.headAngle * Math.PI / 180),
  };
  const actualBaseDelta = {
    x: spacer25.cockpit.stemBase.x - spacer0.cockpit.stemBase.x,
    y: spacer25.cockpit.stemBase.y - spacer0.cockpit.stemBase.y,
  };
  const actualClampDelta = {
    x: spacer25.cockpit.handlebarClamp.x - spacer0.cockpit.handlebarClamp.x,
    y: spacer25.cockpit.handlebarClamp.y - spacer0.cockpit.handlebarClamp.y,
  };
  assert.ok(Math.abs(actualBaseDelta.x - expectedSpacerDelta.x) < 1e-9);
  assert.ok(Math.abs(actualBaseDelta.y - expectedSpacerDelta.y) < 1e-9);
  assert.deepEqual(actualClampDelta, actualBaseDelta);
  assert.ok(actualBaseDelta.x < 0, "spacer moves StemBase rearward");
  assert.ok(actualBaseDelta.y > 0, "spacer moves StemBase upward");

  const stemDistance = Math.hypot(
    spacer0.cockpit.handlebarClamp.x - spacer0.cockpit.stemBase.x,
    spacer0.cockpit.handlebarClamp.y - spacer0.cockpit.stemBase.y,
  );
  assert.ok(Math.abs(stemDistance - 90) < 1e-9);
  for (const stemLength of [90, 100, 110]) {
    const bike = buildBikeGeometry(geometry, { ...defaultFit, stemLength, stemAngle: -12 });
    const renderedLength = Math.hypot(
      bike.cockpit.handlebarClamp.x - bike.cockpit.stemBase.x,
      bike.cockpit.handlebarClamp.y - bike.cockpit.stemBase.y,
    );
    assert.ok(Math.abs(renderedLength - stemLength) < 1e-9);
  }
  assert.deepEqual(
    [-6, -12, -18].map((stemAngle) => Number(getEffectiveStemPitch(geometry.headAngle, stemAngle).toFixed(1))),
    [12.1, 6.1, 0.1],
  );
  for (const spacer of [0, 10, 25]) {
    const bike = buildBikeGeometry(geometry, { ...defaultFit, spacer, stemLength: 90, stemAngle: -12 });
    assert.deepEqual(bike.cockpit.spacerHeadtubeAnchor, bike.frame.headTop);
    assert.deepEqual(bike.cockpit.spacerTop, bike.cockpit.stemSpacerAnchor);
    assert.deepEqual(bike.cockpit.stemHandlebarAnchor, bike.cockpit.handlebarClampAnchor);
    const totalStack = BASE_COCKPIT_STACK_HEIGHT_MM + spacer;
    assert.equal(bike.cockpit.totalSpacerStackHeight, totalStack);
    assert.ok(Math.abs(bike.cockpit.stemBase.x - (bike.frame.headTop.x - totalStack * Math.cos(geometry.headAngle * Math.PI / 180))) < 1e-9);
    assert.ok(Math.abs(bike.cockpit.stemBase.y - (bike.frame.headTop.y + totalStack * Math.sin(geometry.headAngle * Math.PI / 180))) < 1e-9);
  }
  assert.ok(Math.abs(getEffectiveStemPitch(71.9, -12) - 6.1) < 1e-9);
});

test("the same nominal stem angle uses each size's head tube angle", () => {
  const pitches = geometrySizes.map((size) => {
    const bike = buildBikeGeometry(enduranceGeometrySizes[size], { ...defaultFit, stemAngle: -12 });
    return bike.cockpit.effectiveStemPitch;
  });
  assert.deepEqual(pitches.map((pitch) => Number(pitch.toFixed(1))), [7.7, 7.2, 6.7, 6.7, 6.1, 6, 5.9]);
});

test("the named Cockpit Anchor Contract stays exact for every Domane size", () => {
  for (const size of geometrySizes) {
    const bike = buildBikeGeometry(enduranceGeometrySizes[size], {
      ...defaultFit,
      spacer: 20,
      stemLength: 90,
      stemAngle: -12,
    });
    assert.deepEqual(bike.cockpit.spacerHeadtubeAnchor, bike.frame.headTop);
    assert.deepEqual(bike.cockpit.spacerTop, bike.cockpit.stemSpacerAnchor);
    assert.deepEqual(bike.cockpit.stemHandlebarAnchor, bike.cockpit.handlebarClampAnchor);
    assert.ok(Math.abs(Math.hypot(
      bike.cockpit.stemHandlebarAnchor.x - bike.cockpit.stemSpacerAnchor.x,
      bike.cockpit.stemHandlebarAnchor.y - bike.cockpit.stemSpacerAnchor.y,
    ) - 90) < 1e-9);
  }
});

test("Stem length deformation fixes A and moves only B / HandlebarClamp", () => {
  const geometry = enduranceGeometrySizes[54];
  const project = createProjector();
  const sourceClamp = resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, "handlebarClampAnchor");
  let baselineA;

  for (const stemLength of [120, 90, 60]) {
    const bike = buildBikeGeometry(geometry, {
      ...defaultFit,
      spacer: 0,
      stemLength,
      stemAngle: -12,
    });
    const targetA = project(bike.cockpit.stemSpacerAnchor);
    const targetB = project(bike.cockpit.stemHandlebarAnchor);
    const handlebarMatrix = uniformAroundPoint(sourceClamp, project(bike.cockpit.handlebarClampAnchor), RENDERED_WHEEL_DIAMETER_PX / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width);
    const mappedA = targetA;
    const mappedB = targetB;
    const mappedClamp = applyMatrix(handlebarMatrix, sourceClamp);
    baselineA ??= mappedA;

    assert.ok(Math.hypot(mappedA.x - targetA.x, mappedA.y - targetA.y) < 1e-9);
    assert.ok(Math.hypot(mappedA.x - baselineA.x, mappedA.y - baselineA.y) < 1e-9);
    assert.ok(Math.hypot(mappedB.x - targetB.x, mappedB.y - targetB.y) < 1e-9);
    assert.ok(Math.hypot(mappedClamp.x - mappedB.x, mappedClamp.y - mappedB.y) < 1e-9);
    assert.ok(Math.abs(Math.hypot(mappedB.x - mappedA.x, mappedB.y - mappedA.y) / PIXELS_PER_MM - stemLength) < 1e-9);
  }
});

test("crank length changes pedal without moving bottom bracket", () => {
  const geometry = enduranceGeometrySizes[56];
  const bikes = [165, 170, 172.5, 175].map((crankLength) => ({
    crankLength,
    bike: buildBikeGeometry(geometry, { ...defaultFit, crankLength }),
  }));
  for (const { crankLength, bike } of bikes) {
    assert.deepEqual(bike.frame.bb, { x: 0, y: 0 });
    assert.ok(Math.abs(Math.hypot(
      bike.contacts.pedal.x - bike.frame.bb.x,
      bike.contacts.pedal.y - bike.frame.bb.y,
    ) - crankLength) < 1e-9);

    const crank = BikeComponents.Crank[0];
    const sourceBase = {
      x: crank.sourceBounds.x + crank.visualAnchor.x,
      y: crank.sourceBounds.y + crank.visualAnchor.y,
    };
    const sourcePedal = {
      x: crank.sourceBounds.x + crank.pedalAnchor.x,
      y: crank.sourceBounds.y + crank.pedalAnchor.y,
    };
    const project = createProjector();
    const matrix = orientedSegmentTransform(
      sourceBase,
      sourcePedal,
      project(bike.frame.bb),
      project(bike.contacts.pedal),
      RENDERED_WHEEL_DIAMETER_PX / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width,
    );
    const mappedBase = applyMatrix(matrix, sourceBase);
    const mappedPedal = applyMatrix(matrix, sourcePedal);
    const targetBase = project(bike.frame.bb);
    const targetPedal = project(bike.contacts.pedal);
    assert.ok(Math.hypot(mappedBase.x - targetBase.x, mappedBase.y - targetBase.y) < 1e-9);
    assert.ok(Math.hypot(mappedPedal.x - targetPedal.x, mappedPedal.y - targetPedal.y) < 1e-9);
  }
  assert.notDeepEqual(bikes[0].bike.contacts.pedal, bikes.at(-1).bike.contacts.pedal);
});

test("Bike Setup changes contact points and visuals without mutating Frame Geometry", () => {
  const geometry = enduranceGeometrySizes[54];
  const baseline = buildBikeGeometry(geometry, defaultFit);
  const configured = buildBikeGeometry(geometry, {
    ...defaultFit,
    wheelset: "deepProfile",
    stemLength: 120,
    stemAngle: -6,
    spacer: 25,
    saddleHeight: 780,
    saddleSetback: 30,
    crankLength: 165,
  });
  assert.deepEqual(configured.geometry, baseline.geometry);
  assert.deepEqual(configured.frame, baseline.frame);
  assert.notDeepEqual(configured.contacts.handlebar, baseline.contacts.handlebar);
  assert.notDeepEqual(configured.contacts.saddle, baseline.contacts.saddle);
  assert.notDeepEqual(configured.contacts.pedal, baseline.contacts.pedal);
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

test("Bike Components exposes the targeted Figma-backed registries", () => {
  assert.deepEqual(Object.keys(BikeComponents), ["Wheel", "Tire", "Chainring", "Crank", "Drivetrain", "Cassette"]);
  assert.deepEqual(FIGMA_WHEEL_RESOURCE_GROUP, {
    fileKey: "CbX0nYfNc7VtHgtSkHZdYS",
    nodeId: "4:1035",
    name: "轮组类型",
  });
  assert.deepEqual(DEFAULT_COMPONENT_SETUP, {
    frontWheelId: "lowProfile",
    rearWheelId: "midProfile",
    linkWheelSelection: false,
    tireId: "roadTan",
    chainringVisualId: "sram",
    crankVisualId: "red",
    cassetteId: "sram",
    drivetrainVisualId: "sram",
    frameColor: "#111111",
    forkColor: "#111111",
    barTapeColor: "#111111",
  });
  assert.ok(!("wheelId" in DEFAULT_COMPONENT_SETUP));
  assert.deepEqual(WHEEL_CENTER_ANCHOR, { x: 240, y: 240 });
  assert.deepEqual(CASSETTE_CENTER_ANCHOR, { x: 50, y: 50 });
  assert.deepEqual(BikeComponents.Wheel.map(({ id, name, wheelSize, figmaComponentName, figmaNodeId }) => [id, name, wheelSize, figmaComponentName, figmaNodeId]), [
    ["lowProfile", "低框轮组", "700c", "Property 1=低框轮组", "4:1034"],
    ["midProfile", "中框轮组", "700c", "Property 1=中框轮组", "4:1033"],
    ["deepProfile", "高框轮组", "700c", "Property 1=高框轮组", "4:1032"],
    ["discWheel", "封闭轮", "700c", "Property 1=封闭轮", "4:1889"],
    ["waveWheel", "波浪轮", "700c", "Property 1=波浪轮", "4:2285"],
    ["triSpokeWheel", "三刀轮", "700c", "Property 1=三刀轮", "4:2293"],
  ]);
  assert.ok(BikeComponents.Wheel.every((wheel) => wheel.wheelCenterAnchor === WHEEL_CENTER_ANCHOR));
  assert.ok(BikeComponents.Wheel.every((wheel) => !("rimDepth" in wheel)));
  assert.deepEqual(BikeComponents.Wheel.map(({ visualLayers }) => visualLayers.length), [2, 2, 2, 6, 2, 2]);
  assert.equal(BikeComponents.Tire.length, 4);
  assert.equal(BikeComponents.Tire.find(({ id }) => id === "roadTan").visualLayers.length, 2);
  assert.deepEqual(BikeComponents.Tire.find(({ id }) => id === "treadTan").visualLayers.map(({ sourceBounds }) => sourceBounds), [
    { x: 6, y: 6, width: 468, height: 468 },
    { x: 0, y: 0, width: 479.996, height: 479.993 },
  ]);
  assert.deepEqual(BikeComponents.Chainring.map(({ id, figmaNodeId }) => [id, figmaNodeId]), [
    ["default", "4:1985"],
    ["pq", "4:1987"],
    ["cyber", "4:4436"],
    ["sram", "4:2008"],
  ]);
  assert.deepEqual(BikeComponents.Crank.map(({ id, figmaNodeId }) => [id, figmaNodeId]), [
    ["shimano105", "4:1936"],
    ["red", "4:4122"],
    ["default", "4:1933"],
  ]);
  assert.equal(BikeComponents.Drivetrain.length, 2);
  assert.deepEqual(BikeComponents.Cassette.map(({ id, name, placementAnchor }) => [id, name, placementAnchor]), [
    ["default", "Shimano飞轮", "rearAxle"],
    ["sram", "速联飞轮", "rearAxle"],
  ]);
  assert.ok(BikeComponents.Cassette.every((resource) => resource.visualAnchor === CASSETTE_CENTER_ANCHOR));
  assert.deepEqual(BikeComponents.Cassette.map(({ visualLayers }) => visualLayers.length), [7, 8]);
  assert.ok(BikeComponents.Crank.every((resource) => !("crankLength" in resource)));
  assert.ok(BikeComponents.Crank.every(({ visualAnchor, pedalAnchor }) => visualAnchor.x === 60 && visualAnchor.y === 40 && pedalAnchor.x === 184 && pedalAnchor.y === 40));
  assert.ok(BikeComponents.Drivetrain.every(({ placementAnchor, visualAnchor }) => placementAnchor === "rearAxle" && visualAnchor.x === 53 && visualAnchor.y === -14));
  assert.deepEqual(Object.keys(DEFAULT_COMPONENT_SETUP), [
    "frontWheelId",
    "rearWheelId",
    "linkWheelSelection",
    "tireId",
    "chainringVisualId",
    "crankVisualId",
    "cassetteId",
    "drivetrainVisualId",
    "frameColor",
    "forkColor",
    "barTapeColor",
  ]);
  assert.match(setupPanelSource, /<h2>自行车设定<\/h2>/);
});

test("Setup persistence gives valid saved fields priority and falls back safely", () => {
  const storage = {
    value: null,
    getItem(key) {
      assert.equal(key, BIKE_SETUP_STORAGE_KEY);
      return this.value;
    },
    setItem(key, value) {
      assert.equal(key, BIKE_SETUP_STORAGE_KEY);
      this.value = value;
    },
  };

  assert.deepEqual(readPersistedBikeSetup(storage), createDefaultBikeSetup());
  storage.value = JSON.stringify({
    fitSetup: { stemLength: 120, saddleHeight: 760 },
    componentSetup: {
      frontWheelId: "deepProfile",
      crankVisualId: "shimano105",
      linkWheelSelection: true,
      frameColor: "#6b86a6",
      barTapeColor: "#c8b79c",
    },
  });

  const saved = readPersistedBikeSetup(storage);
  assert.equal(saved.fitSetup.stemLength, 120);
  assert.equal(saved.fitSetup.saddleHeight, 760);
  assert.equal(saved.fitSetup.spacerHeight, DEFAULT_FIT_SETUP.spacerHeight);
  assert.equal(saved.componentSetup.frontWheelId, "deepProfile");
  assert.equal(saved.componentSetup.crankVisualId, "shimano105");
  assert.equal(saved.componentSetup.linkWheelSelection, true);
  assert.equal(saved.componentSetup.rearWheelId, DEFAULT_COMPONENT_SETUP.rearWheelId);
  assert.equal(saved.componentSetup.frameColor, "#6B86A6");
  assert.equal(saved.componentSetup.forkColor, DEFAULT_COMPONENT_SETUP.forkColor);
  assert.equal(saved.componentSetup.barTapeColor, "#C8B79C");

  storage.value = JSON.stringify({
    fitSetup: { stemLength: "invalid" },
    componentSetup: { frontWheelId: "missing-resource", forkColor: "not-a-color" },
  });
  assert.deepEqual(readPersistedBikeSetup(storage), createDefaultBikeSetup());
  assert.deepEqual(parsePersistedBikeSetup("not-json"), createDefaultBikeSetup());

  for (const stemAngle of STEM_ANGLE_OPTIONS) {
    const setup = parsePersistedBikeSetup(JSON.stringify({ fitSetup: { stemAngle } }));
    assert.equal(setup.fitSetup.stemAngle, stemAngle);
  }
  for (const stemAngle of [-16, -13, -11, -9, 3]) {
    const setup = parsePersistedBikeSetup(JSON.stringify({ fitSetup: { stemAngle } }));
    assert.equal(setup.fitSetup.stemAngle, DEFAULT_FIT_SETUP.stemAngle);
  }

  assert.equal(persistBikeSetup(saved, storage), true);
  assert.deepEqual(readPersistedBikeSetup(storage), saved);
});

test("Wheel and Tire stay split, registry-driven, and axle-centered", () => {
  for (const assetName of ["low.svg", "mid.svg", "deep.svg", "disc.svg", "disc-mask.svg", "wave.svg", "trispoke.svg", "trispoke-inner.svg"]) {
    const source = readFileSync(
      new URL(`../src/assets/bikeComponents/wheel/${assetName}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /viewBox="0 0 480 480"/);
    assert.doesNotMatch(source, /#1E1E1E/);
  }
  const resolved = resolveComponentSetup({ ...DEFAULT_COMPONENT_SETUP, frontWheelId: "deepProfile", rearWheelId: "midProfile" });
  assert.equal(resolved.frontWheel.id, "deepProfile");
  assert.equal(resolved.rearWheel.id, "midProfile");
  assert.match(bikeComponentsSource, /visualResource: wheelLow/);
  assert.match(enduranceTemplateSource, /const center = project\(axle\)/);
  assert.match(enduranceTemplateSource, /data-wheel-center-source="geometry-axle"/);
  assert.match(enduranceTemplateSource, /const wheelLayers = wheel\.visualLayers \?\?/);
  assert.match(enduranceTemplateSource, /wheelLayers\.map\(\(wheelLayer, index\)/);
  assert.match(enduranceTemplateSource, /const tireLayers = tire\.visualLayers \?\?/);
  assert.match(enduranceTemplateSource, /tireLayers\.map\(\(tireLayer, index\)/);
  assert.doesNotMatch(enduranceTemplateSource, /wheelVisual\.rear|wheelVisual\.front/);
  assert.equal((enduranceTemplateSource.match(/asset=\{brakeDisc\}/g) ?? []).length, 1);
  assert.match(enduranceTemplateSource, /axle=\{data\.frame\.frontAxle\}[\s\S]*renderLayer="front-rotor"/);
  assert.doesNotMatch(enduranceTemplateSource, /renderLayer="rear-rotor"/);
  assert.doesNotMatch(enduranceTemplateSource, /import (?:frontRotor|rearRotor)/);

  const brakeDiscSource = readFileSync(
    new URL("../src/assets/bikeTemplates/endurance/brake-disc.svg", import.meta.url),
    "utf8",
  );
  assert.match(brakeDiscSource, /viewBox="0 0 100 100"/);
  assert.match(brakeDiscSource, /id="Intersect"[\s\S]*fill="#242424"/);
  assert.match(brakeDiscSource, /id="Subtract"[\s\S]*fill="#CECECE"/);
  assert.doesNotMatch(brakeDiscSource, /<rect|#8A38F5/);
});

test("drivetrain resources match the current Figma neutral material", () => {
  const shimanoSource = readFileSync(
    new URL("../src/assets/bikeComponents/drivetrain/shimano.svg", import.meta.url),
    "utf8",
  );
  const sramSource = readFileSync(
    new URL("../src/assets/bikeComponents/drivetrain/sram.svg", import.meta.url),
    "utf8",
  );

  assert.match(shimanoSource, /viewBox="0 0 80 110"/);
  assert.equal((shimanoSource.match(/fill="#1D1D1D"/g) ?? []).length, 1);
  assert.match(sramSource, /viewBox="0 0 80 110"/);
  assert.equal((sramSource.match(/fill="#1D1D1D"/g) ?? []).length, 4);
  assert.match(sramSource, /id="Vector 6"[\s\S]*fill="#1D1D1D"/);
  assert.match(sramSource, /clip-path="url\(#clip0_4_1915\)"/);
  assert.doesNotMatch(`${shimanoSource}${sramSource}`, /fill="#(?:454545|3F3F3F)"|fill="black"/);
});

test("front and rear wheel selections remain independent unless linking is explicitly enabled", () => {
  const independentFromFront = updateWheelSelection({ ...DEFAULT_COMPONENT_SETUP, rearWheelId: "deepProfile" }, "front", "triSpokeWheel");
  assert.equal(independentFromFront.frontWheelId, "triSpokeWheel");
  assert.equal(independentFromFront.rearWheelId, "deepProfile");

  const independentFromRear = updateWheelSelection({ ...independentFromFront, rearWheelId: "deepProfile" }, "rear", "discWheel");
  assert.equal(independentFromRear.frontWheelId, "triSpokeWheel");
  assert.equal(independentFromRear.rearWheelId, "discWheel");

  const linked = updateWheelSelectionLink(independentFromRear, true);
  assert.equal(linked.frontWheelId, "triSpokeWheel");
  assert.equal(linked.rearWheelId, "discWheel");

  const linkedFromFront = updateWheelSelection(linked, "front", "deepProfile");
  assert.equal(linkedFromFront.frontWheelId, "deepProfile");
  assert.equal(linkedFromFront.rearWheelId, "deepProfile");

  const linkedFromRear = updateWheelSelection(linked, "rear", "lowProfile");
  assert.equal(linkedFromRear.frontWheelId, "lowProfile");
  assert.equal(linkedFromRear.rearWheelId, "lowProfile");

  const unlinked = updateWheelSelectionLink(linkedFromFront, false);
  const triSpokeFront = updateWheelSelection(unlinked, "front", "triSpokeWheel");
  const mixed = updateWheelSelection(triSpokeFront, "rear", "discWheel");
  const resolvedMixed = resolveComponentSetup(mixed);
  assert.equal(resolvedMixed.frontWheel.id, "triSpokeWheel");
  assert.equal(resolvedMixed.rearWheel.id, "discWheel");
  assert.equal(resolvedMixed.frontWheel, BikeComponents.Wheel.find(({ id }) => id === "triSpokeWheel"));
  assert.equal(resolvedMixed.rearWheel, BikeComponents.Wheel.find(({ id }) => id === "discWheel"));

  const relinked = updateWheelSelectionLink(mixed, true);
  assert.equal(relinked.frontWheelId, "triSpokeWheel");
  assert.equal(relinked.rearWheelId, "discWheel");

  assert.match(setupPanelSource, /className="wheel-matrix" aria-label="前后轮轮组选择器"/);
  assert.match(setupPanelSource, /<WheelCell side="rear" wheel=\{wheel\} value=\{componentSetup\.rearWheelId\}/);
  assert.match(setupPanelSource, /<WheelCell side="front" wheel=\{wheel\} value=\{componentSetup\.frontWheelId\}/);
  assert.ok(setupPanelSource.indexOf('<WheelCell side="rear"') < setupPanelSource.indexOf('<WheelCell side="front"'));
  assert.match(setupPanelSource, /后 \$\{rearWheel\.name\}  \/  前 \$\{frontWheel\.name\}/);
  assert.match(setupPanelSource, /aria-pressed=\{isSelected\}/);
  assert.match(setupPanelSource, /wheel-matrix__summary/);
  assert.doesNotMatch(setupPanelSource, /WheelCenter → FrontAxle|WheelCenter → RearAxle|SELECTED/);
  assert.match(setupPanelSource, /label="前后轮联动"/);
  assert.match(setupPanelSource, /updateComponentSetup\("linkWheelSelection", value\)/);
  assert.ok(setupPanelSource.indexOf('action={(') < setupPanelSource.indexOf('className="wheel-matrix__summary"'));
  assert.match(enduranceTemplateSource, /wheel=\{components\.frontWheel\}/);
  assert.match(enduranceTemplateSource, /wheel=\{components\.rearWheel\}/);
  assert.equal((enduranceTemplateSource.match(/<FixedWheel /g) ?? []).length, 2);
  assert.doesNotMatch(enduranceTemplateSource, /FrontWheelComponent|RearWheelComponent/);
});

test("Cassette is registry-driven, RearAxle-centered, and synchronized with rear-wheel motion", () => {
  const resolved = resolveComponentSetup({ ...DEFAULT_COMPONENT_SETUP, cassetteId: "sram" });
  assert.equal(resolved.cassette.id, "sram");
  assert.equal(resolved.cassette.placementAnchor, "rearAxle");
  assert.equal(resolved.cassette.visualAnchor, CASSETTE_CENTER_ANCHOR);
  assert.match(enduranceTemplateSource, /const cassetteTransform = uniformAroundPoint\(cassette\.visualAnchor, center, figmaShapeScale\)/);
  assert.match(enduranceTemplateSource, /<FixedCassette cassette=\{components\.cassette\} center=\{projected\.rearAxle\}/);
  assert.match(enduranceTemplateSource, /data-cassette-center-source="geometry-rear-axle"/);
  assert.match(enduranceTemplateSource, /durationSeconds=\{PREVIEW_MOTION_CONFIG\.wheelDurationSeconds\}[\s\S]*syncGroup="wheels"/);
  assert.match(setupPanelSource, /updateComponentSetup\("cassetteId", value\)/);
  assert.doesNotMatch(enduranceTemplateSource, /bikeTemplates\/endurance\/cassette\.svg/);
});

test("workspace bikes keep Geometry, Fit Setup, and Components independent", () => {
  const setup = createDefaultBikeSetup();
  const bikeA = createComparisonBike("A", setup);
  const bikeB = createComparisonBike("B", setup);
  const changedBikeB = updateBikeGeometry(bikeB, { stack: bikeB.geometry.stack + 20, reach: bikeB.geometry.reach + 8 });

  assert.deepEqual(ACTIVE_BIKES, ["a", "b"]);
  assert.equal(bikeA.category, "endurance");
  assert.equal(bikeB.category, "endurance");
  assert.notStrictEqual(bikeA.geometry, bikeB.geometry);
  assert.notStrictEqual(bikeA.fitSetup, bikeB.fitSetup);
  assert.notStrictEqual(bikeA.componentSetup, bikeB.componentSetup);
  assert.equal(changedBikeB.geometry.stack, bikeB.geometry.stack + 20);
  assert.equal(changedBikeB.geometry.reach, bikeB.geometry.reach + 8);
  assert.equal(bikeA.geometry.stack, bikeB.geometry.stack);
  assert.equal(bikeA.geometry.reach, bikeB.geometry.reach);
  assert.equal(buildBikeGeometry(changedBikeB.geometry, toGeometryFit(changedBikeB.fitSetup)).frame.headTop.y, changedBikeB.geometry.stack);
  assert.equal(getRenderableComponentSetup(bikeA).frameColor, bikeA.frameColor);
  assert.equal(getRenderableComponentSetup(bikeB).forkColor, bikeB.forkColor);

  assert.match(appSource, /const \[initialSetup\] = useState\(\(\) => readPersistedBikeSetup\(\)\)/);
  assert.match(appSource, /const \[bikes, setBikes\] = useState\(\[\]\)/);
  assert.match(appSource, /const \[activeBikeIndex, setActiveBikeIndex\] = useState\(null\)/);
  assert.match(appSource, /const \[compareEnabled, setCompareEnabled\] = useState\(false\)/);
  assert.match(appSource, /persistBikeSetup\(getPersistableBikeSetup\(bikes\[0\]\)\)/);
  assert.match(appSource, /<BikeVisualizer[\s\S]*bikes=\{bikes\}[\s\S]*activeBikeIndex=\{isGeometryImportActive \? null : activeBikeIndex\}[\s\S]*stagePreviewBike=\{isGeometryImportActive \? importPreviewBike : null\}[\s\S]*frameOnly=\{isGeometryImportActive\}[\s\S]*compareEnabled=\{compareEnabled\}/);
  assert.doesNotMatch(appSource + bikeVisualizerSource, /viewMode|compareFocus/);
  assert.match(dualBikeControlsSource, /role="group" aria-label="当前车型"/);
  assert.match(dualBikeControlsSource, /type="checkbox"[\s\S]*checked=\{compareEnabled\}/);
  assert.match(dualBikeControlsSource, /className="dual-bike-card__metrics"[\s\S]*Stack[\s\S]*bike\.geometry\.stack[\s\S]*Reach[\s\S]*bike\.geometry\.reach/);
  assert.match(dualBikeControlsSource, /import \{ DotsThree, Info, Plus, Stack as Layers \} from "@phosphor-icons\/react"/);
  assert.match(dualBikeControlsSource, /aria-label="叠层对比"/);
  assert.match(dualBikeControlsSource, /<Layers className="compare-card__icon"/);
  assert.match(dualBikeControlsSource, /<span className="compare-card__label">叠层对比<\/span>/);
  assert.match(dualBikeControlsSource, /<span className="compare-card__switch" aria-hidden="true" \/>/);
  assert.doesNotMatch(dualBikeControlsSource, /CheckSquare|Square|叠层车型对比/);
  assert.match(stylesSource, /\.compare-card\s*\{[^}]*box-sizing:\s*border-box;[^}]*flex:\s*0 0 148px;[^}]*min-width:\s*0;[^}]*align-self:\s*flex-start;[^}]*height:\s*40px;[^}]*margin-left:\s*10px;[^}]*padding:\s*0 10px;[^}]*border:\s*0;[^}]*border-radius:\s*var\(--radius-sm\);[^}]*background:\s*var\(--card-glass-bg\);[^}]*box-shadow:\s*var\(--card-glass-shadow\);[^}]*backdrop-filter:\s*var\(--card-glass-filter\);[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*gap:\s*6px/);
  assert.match(stylesSource, /\.compare-card__switch\s*\{[^}]*width:\s*40px;[^}]*height:\s*22px;[^}]*padding:\s*2px;[^}]*background:\s*#303840/);
  assert.match(stylesSource, /\.compare-card\.is-checked\s*\{[^}]*background:\s*var\(--card-glass-bg\);[^}]*color:\s*var\(--ink\)/);
  assert.match(stylesSource, /\.compare-card\.is-checked \.compare-card__switch\s*\{[^}]*background:\s*var\(--selected-bg\)/);
  assert.doesNotMatch(dualBikeControlsSource, /主视角|B 测试|重置|dual-bike-tab|segmented/);
  assert.match(appSource, /if \(key === "frontWheelId"\) nextComponentSetup = updateWheelSelection\(current\.componentSetup, "front", value\)/);
  assert.match(appSource, /else if \(key === "rearWheelId"\) nextComponentSetup = updateWheelSelection\(current\.componentSetup, "rear", value\)/);
  assert.match(setupPanelSource, /stateKey = side === "front" \? "frontWheelId" : "rearWheelId"/);
  assert.doesNotMatch(appSource, /const \[(?:frameState|fitSetup|componentSetup),/);

  assert.equal(MAX_BIKES, 2);
  const oneBike = addWorkspaceBike([], bikeA);
  const twoBikes = addWorkspaceBike(oneBike, bikeB);
  assert.deepEqual(addWorkspaceBike(twoBikes, createComparisonBike("C", setup)), twoBikes);
  assert.equal(replaceWorkspaceBike(twoBikes, 1, changedBikeB)[0], bikeA);
  assert.equal(replaceWorkspaceBike(twoBikes, 1, changedBikeB)[1], changedBikeB);
  assert.deepEqual(deleteWorkspaceBike(twoBikes, 0), [bikeB]);
});

test("zero-bike Welcome Gate overlays the real demo workspace", () => {
  assert.equal(WELCOME_COMPLETED_STORAGE_KEY, "bikeGeometryLabWelcomeCompleted");
  assert.match(appSource, /const showWelcomeGate = bikes\.length === 0 && geometryImportStatus === "ready"/);
  assert.match(appSource, /const \[geometryImportStatus, setGeometryImportStatus\] = useState\("ready"\)/);
  assert.match(appSource, /<main[\s\S]*className=\{`workspace[\s\S]*inert=\{showWelcomeGate \? true : undefined\}/);
  assert.match(appSource, /\{showWelcomeGate && <WelcomeGate onUsePreset=\{useWelcomePreset\} onSelectImage=\{selectWelcomeImage\} \/>\}/);
  assert.match(appSource, /const \[demoBike\] = useState\(\(\) => createComparisonBike\("demo-preview", initialSetup\)\)/);
  assert.match(appSource, /const useWelcomePreset = \(\) => \{[\s\S]*setBikes\(\[bike\]\);[\s\S]*setActiveBikeIndex\(0\)/);
  assert.match(appSource, /const selectWelcomeImage = \(file\) => \{[\s\S]*const operation = \{ type: "add", targetIndex: null \};[\s\S]*selectGeometryImage\(file, operation\)/);
  assert.doesNotMatch(appSource + welcomeGateSource, /loginModal|Login|Register|登录|注册/);

  assert.match(welcomeGateSource, /先选一辆车，开始你的几何实验/);
  assert.match(welcomeGateSource, /使用预设车型体验[\s\S]*TREK Domane/);
  assert.match(welcomeGateSource, /上传官网几何图[\s\S]*官方车架几何图/);
  assert.match(welcomeGateSource, /\.png,\.jpg,\.jpeg,image\/png,image\/jpeg/);
  assert.match(welcomeGateSource, /const \[file\] = Array\.from\(event\.target\.files \?\? \[\]\);[\s\S]*if \(file\) onSelectImage\(file\)/);
  assert.match(stylesSource, /\.welcome-gate\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*background:\s*rgba\(0,0,0,\.76\);[^}]*backdrop-filter:\s*blur\(3px\)/s);
  assert.match(stylesSource, /\.welcome-gate__choices\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(stylesSource, /\.welcome-choice--primary\s*\{[^}]*background:\s*var\(--selected-bg\)/s);
  assert.match(stylesSource, /\.welcome-choice--secondary\s*\{[^}]*background:\s*rgba\(20,22,26,\.90\)/s);
  assert.doesNotMatch(stylesSource.match(/\.welcome-gate__content\s*\{[^}]*\}/s)?.[0] ?? "", /background|border|box-shadow/);
  assert.doesNotMatch(appSource + welcomeGateSource, /loginModal|Login|Register|登录|注册/);
});

test("geometry import auto-analyzes one editable multi-size draft through the existing Renderer path", () => {
  assert.deepEqual(GEOMETRY_IMPORT_STATUSES, ["analyzing", "review", "ready", "error"]);
  assert.deepEqual(GEOMETRY_IMPORT_FIELDS.map(({ key }) => key), [
    "stack", "reach", "effectiveTopTube", "seatTubeLength", "seatTubeAngle",
    "headTubeLength", "headTubeAngle", "chainstay", "wheelbase", "bbDrop", "forkOffset",
  ]);

  const draft = createMockGeometryImportDraft();
  const secondDraft = createMockGeometryImportDraft();
  assert.deepEqual(Object.keys(draft.sizes), ["49", "52", "54", "56"]);
  assert.equal(draft.selectedSize, "54");
  assert.equal(draft.category, "endurance");
  assert.equal(draft.brand, "");
  assert.equal(draft.model, "");
  assert.notStrictEqual(draft.sizes[54], secondDraft.sizes[54]);

  const edited = updateGeometryImportDraftField(draft, "54", "stack", "582");
  assert.equal(edited.sizes[54].stack, 582);
  assert.equal(draft.sizes[54].stack, 575);
  const identified = { ...edited, brand: "Quick", model: "Zeitpro" };
  assert.equal(validateGeometryImportDraft(identified).isValid, true);
  assert.equal(validateGeometryImportDraft({ ...identified, model: "" }).isValid, true);
  const invalid = updateGeometryImportDraftField(identified, "49", "headTubeAngle", "92");
  assert.equal(validateGeometryImportDraft(invalid).firstInvalidSize, "49");
  assert.equal(validateGeometryImportDraft({ ...invalid, brand: "" }).firstErrorKey, "brand");
  assert.equal(validateGeometryImportDraft({ ...invalid, brand: "" }).firstInvalidSize, null);
  assert.equal(validateGeometryImportDraft(invalid).firstErrorKey, "sizes.49.headTubeAngle");
  const missingOptional = updateGeometryImportDraftField(identified, "54", "forkOffset", "");
  assert.equal(validateGeometryImportDraft(missingOptional).isValid, true);

  const sizeData = importGeometryToSizeData("54", missingOptional.sizes[54]);
  assert.equal(sizeData.stackMm, 582);
  assert.equal(sizeData.reachMm, 374);
  assert.equal(sizeData.forkOffsetMm, null);
  assert.equal(sizeData.trailMm, null);
  assert.equal(sizeData.standoverMm, null);

  const originalBike = createComparisonBike("A", createDefaultBikeSetup());
  const importedBike = createBikeFromGeometryImport(originalBike, missingOptional);
  assert.equal(importedBike.brand, "Quick");
  assert.equal(importedBike.model, "Zeitpro");
  assert.equal(importedBike.category, "endurance");
  assert.equal(importedBike.isPreset, false);
  assert.deepEqual(importedBike.sizes, ["49", "52", "54", "56"]);
  assert.equal(importedBike.geometry.stack, 582);
  assert.deepEqual(importedBike.fitSetup, originalBike.fitSetup);
  assert.deepEqual(importedBike.componentSetup, originalBike.componentSetup);
  assert.equal(updateBikeSize(importedBike, "49").geometry.stack, 540);
  const supplemented = addGeometryImportDraftSize(identified, "58");
  assert.equal(supplemented.selectedSize, "58");
  assert.equal(supplemented.sizes[58].stack, null);
  assert.strictEqual(addGeometryImportDraftSize(supplemented, "58"), supplemented);

  assert.match(appSource, /createBikeFromGeometryImport\(base, geometryImportDraft, geometryImportImage\)/);
  assert.match(appSource, /createBikeFromGeometryImport\(currentBike, geometryImportDraft, geometryImportImage \?\? currentBike\.geometryImage\)/);
  assert.match(framePanelSource, /options=\{bike\.sizes\}/);
  assert.match(framePanelSource, /className="frame-model-section"[\s\S]*model-action-slot/);
  assert.match(framePanelSource, /tabIndex=\{bike\.source === "upload" \? 0 : -1\}/);
  assert.match(framePanelSource, /className="size-selector-area"[\s\S]*<SegmentedControl options=\{bike\.sizes\}/);
  assert.doesNotMatch(appSource, /<FrameGeometryPanel[^>]*key=\{/);
  assert.match(stylesSource, /\.frame-panel \.section-title\s*\{[^}]*min-height:\s*28px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(stylesSource, /\.model-action-slot\s*\{[^}]*width:\s*96px;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none/);
  assert.match(stylesSource, /\.model-card\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 64px/);
  assert.match(stylesSource, /\.model-card strong\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap/);
  assert.match(stylesSource, /\.size-selector-area \.segmented\s*\{[^}]*grid-template-columns:\s*repeat\(7, 40px\)/);
  assert.match(stylesSource, /\.size-selector-area \.segmented button\s*\{[^}]*width:\s*40px;[^}]*height:\s*40px;[^}]*font-variant-numeric:\s*tabular-nums/);
  assert.match(stylesSource, /\.geometry-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(stylesSource, /\.geometry-detail-list > div\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 100px/);
  assert.match(stylesSource, /\.geometry-detail-list dd\s*\{[^}]*width:\s*100px;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 24px/);
  assert.doesNotMatch(geometryImportFlowSource, /图片已选择|分析几何数据/);
  assert.match(geometryImportFlowSource, /AI 正在初步提取几何数据…/);
  assert.match(geometryImportFlowSource, /AI 初步提取结果，请逐项核对/);
  assert.match(geometryImportFlowSource, /补充尺码/);
  assert.match(geometryImportFlowSource, /确认生成车架/);
  assert.match(geometryImportFlowSource, /geometry-import__review-buttons[\s\S]*>取消<[\s\S]*确认生成车架/);
  assert.match(geometryImportFlowSource, /data-validation-key="brand"[\s\S]*aria-describedby=\{errors\.brand \? "geometry-import-brand-error"/);
  assert.match(geometryImportFlowSource, /data-validation-key=\{errorKey\}[\s\S]*aria-describedby=\{error \? errorId/);
  assert.match(geometryImportFlowSource, /scrollContainer\.scrollTo\(\{[\s\S]*behavior: "smooth"/);
  assert.match(geometryImportFlowSource, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(geometryImportFlowSource, /message: `还有 \$\{validation\?\.errorCount \?\? 1\} 项信息需要修正`/);
  assert.match(stylesSource, /input\[aria-invalid="true"\]:focus\s*\{[^}]*status-error/);
  assert.match(bikeVisualizerSource, /showContactPoints=\{!frameOnly\}[\s\S]*frameOnly=\{frameOnly\}/);
  assert.match(enduranceTemplateSource, /\{!frameOnly && <>[\s\S]*renderLayer="non-drive-crank"[\s\S]*data-render-layer="cockpit"[\s\S]*<TemplateAsset asset=\{forkAsset\}/);
  assert.match(dualBikeControlsSource, /className="add-bike-card"[\s\S]*inputRef\.current\?\.click/);
  assert.match(appSource, /selectGeometryImage\(file, operation\)/);
  assert.match(appSource, /const GEOMETRY_PREVIEW_COLOR = "#E5E7EB"/);
  assert.match(appSource, /createBikeFromGeometryImport\(\{ \.\.\.workspaceBike, id: "geometry-import-preview" \}, geometryImportDraft, geometryImportImage\)/);
  assert.match(appSource, /frameColor: GEOMETRY_PREVIEW_COLOR,[\s\S]*forkColor: GEOMETRY_PREVIEW_COLOR/);
  assert.match(appSource, /activeBikeIndex=\{isGeometryImportActive \? null : activeBikeIndex\}/);
  assert.match(appSource, /isStageFullscreen=\{isStageFullscreen \|\| isGeometryImportActive\}/);
  assert.match(bikeVisualizerSource, /geometryImportMode \? \([\s\S]*Geometry Preview[\s\S]*<DualBikeControls/);
  assert.match(bikeVisualizerSource, /\{!geometryImportMode && <g[\s\S]*className="bike-reflection"/);
  assert.match(bikeVisualizerSource, /GeometryPreviewReference point=\{data\.frame\.bb\} label="BB"[\s\S]*label="Rear Axle"[\s\S]*label="Front Axle"/);
  assert.match(bikeVisualizerSource, /!geometryImportMode && <Switch label="停止动画"/);
  assert.match(stylesSource, /\.workspace\.workspace--geometry-import\s*\{[^}]*grid-template-columns:\s*360px minmax\(0, 1fr\) 0;/s);
  assert.match(geometryImageAnalyzerSource, /productionGeometryParserClient/);
  assert.match(geometryImageAnalyzerSource, /parserClient\.parse\(imageFile/);
  assert.doesNotMatch(geometryImageAnalyzerSource, /createMockGeometryImportDraft|mockGeometryImport/);
  assert.match(geometryImportFlowSource, /AI 已提取 \$\{detectedSizeCount\} 个尺码，请核对数据后生成车架/);
  assert.match(geometryImportFlowSource, /检测到 \$\{detectedSizeCount\} 个尺码，其中 \$\{confirmationCount\} 项数据需要确认/);
  assert.match(geometryImportFlowSource, /parserWarnings\.map/);
});

test("STR profiles are derived per bike and keep classification boundaries exact", () => {
  assert.equal(getSTRProfile(134, 100).label, "竞技几何");
  assert.equal(getSTRProfile(135, 100).label, "综合型几何");
  assert.equal(getSTRProfile(145, 100).label, "综合型几何");
  assert.equal(getSTRProfile(146, 100).label, "舒适耐力几何");
  assert.equal(getSTRProfile(575, 374).value.toFixed(2), "1.54");
  assert.equal(getSTRProfile(0, 374), null);
  assert.equal(getSTRProfile(575, 0), null);

  const setup = createDefaultBikeSetup();
  const bikeA = createComparisonBike("A", setup);
  const bikeB = updateBikeGeometry(createComparisonBike("B", setup), { stack: 540, reach: 400 });
  assert.equal(getSTRProfile(bikeA.geometry.stack, bikeA.geometry.reach).label, "舒适耐力几何");
  assert.equal(getSTRProfile(bikeB.geometry.stack, bikeB.geometry.reach).label, "综合型几何");

  assert.match(dualBikeControlsSource, /getSTRProfile\(bike\.geometry\.stack, bike\.geometry\.reach\)/);
  assert.match(dualBikeControlsSource, /strProfile\.value\.toFixed\(2\)/);
  assert.match(dualBikeControlsSource, /className="str-info__trigger"[\s\S]*aria-describedby/);
  assert.match(dualBikeControlsSource, /className="str-tooltip" role="tooltip"/);
  assert.match(stylesSource, /\.dual-bike-card\s*\{[^}]*border:\s*0;[^}]*background:\s*var\(--side-card-glass-bg\);[^}]*box-shadow:\s*var\(--card-glass-shadow\);[^}]*backdrop-filter:\s*var\(--card-glass-filter\);[^}]*-webkit-backdrop-filter:\s*var\(--card-glass-filter\);/s);
  assert.match(stylesSource, /\.dual-bike-card\.is-selected\s*\{[^}]*border:\s*1px solid rgba\(22,119,255,\.62\);[^}]*background:\s*rgba\(22,119,255,\.28\);/s);
  assert.match(stylesSource, /\.dual-bike-card__meta\s*\{[^}]*z-index:\s*3/);
  assert.match(stylesSource, /\.str-info__trigger\s*\{[^}]*cursor:\s*pointer/);
  assert.match(stylesSource, /\.dual-bike-card:has\(\.str-info:hover\),[\s\S]*z-index:\s*20/);
  assert.match(stylesSource, /\.str-info:hover \.str-tooltip,[\s\S]*\.str-info:focus-within \.str-tooltip/);
});

test("Fit Setup and Crank Visual remain independent across the requested scenarios", () => {
  const fit170 = { ...DEFAULT_FIT_SETUP, spacerHeight: 15, stemLength: 90, saddleHeight: 775, crankLength: 170 };
  const components105 = {
    ...DEFAULT_COMPONENT_SETUP,
    frontWheelId: "deepProfile",
    rearWheelId: "deepProfile",
    crankVisualId: "shimano105",
    drivetrainVisualId: "shimano",
  };
  const resolved105 = resolveComponentSetup(components105);
  assert.equal(toGeometryFit(fit170).crankLength, 170);
  assert.equal(resolved105.crank.id, "shimano105");

  const fit172 = { ...fit170, crankLength: 172.5 };
  assert.equal(toGeometryFit(fit172).crankLength, 172.5);
  assert.equal(resolveComponentSetup(components105).crank.id, "shimano105");

  const geometry = enduranceGeometrySizes[56];
  const stem100 = buildBikeGeometry(geometry, toGeometryFit({ ...fit170, stemLength: 100 }));
  const stem90 = buildBikeGeometry(geometry, toGeometryFit({ ...fit170, stemLength: 90 }));
  assert.deepEqual(stem100.geometry, stem90.geometry);
  assert.notDeepEqual(stem100.contacts.handlebar, stem90.contacts.handlebar);
});

test("the workspace keeps Frame, Bike Visualizer, and Bike Setup visible without module navigation", () => {
  const frameIndex = appSource.indexOf("<FrameGeometryPanel");
  const visualizerIndex = appSource.indexOf("<BikeVisualizer");
  const setupIndex = appSource.indexOf("<BikeSetupPanel");
  assert.ok(frameIndex >= 0 && frameIndex < visualizerIndex && visualizerIndex < setupIndex);
  assert.doesNotMatch(appSource, /IconRail|ControlPanel|active, setActive/);
  for (const label of [
    "Seat Tube",
    "Seat Tube Angle",
    "Head Tube Angle",
    "Effective Top Tube",
    "BB Drop",
    "Chainstay",
    "Fork Offset",
    "Trail",
    "Standover",
  ]) {
    assert.ok(framePanelSource.includes(label));
  }
  for (const title of ["轮组", "外胎", "牙盘组", "曲柄", "飞轮", "变速套件"]) {
    assert.ok(setupPanelSource.includes(`title="${title}"`));
  }
  for (const title of ["把组", "坐垫", "曲柄长度"]) {
    assert.ok(setupPanelSource.includes(`title="${title}"`));
  }
  for (const forbidden of ["坐垫 / 座杆", "Stem", "Handlebar", "Seatpost", "Cassette", "Rotor"]) {
    assert.ok(!setupPanelSource.includes(`title="${forbidden}"`));
  }
  assert.match(setupPanelSource, /useState\("components"\)/);
  assert.match(setupPanelSource, />骑行设定</);
  assert.match(setupPanelSource, />车身配件</);
  assert.ok(setupPanelSource.indexOf(">车身配件<") < setupPanelSource.indexOf(">骑行设定<"));
  assert.match(stylesSource, /\.setup-tabs\s*\{[^}]*margin-top:\s*12px;[^}]*padding:\s*3px;/s);
  assert.match(stylesSource, /\.setup-tabs button\s*\{[^}]*min-height:\s*44px;[^}]*border-radius:\s*9px;/s);
  assert.match(stylesSource, /\.setup-tabs strong\s*\{[^}]*font-size:\s*var\(--font-size-md\);/s);
  for (const fitField of ["垫圈高度", "把立长度", "把立角度", "坐垫高度", "坐垫后移", "曲柄长度 mm"]) {
    assert.ok(setupPanelSource.includes(fitField));
  }
  assert.doesNotMatch(appSource, /isSetupPanelOpen|隐藏设定|显示设定|aria-label="关于"|aria-label="帮助"/);
  assert.doesNotMatch(appSource, /className="topbar"|className="brand"|className="topbar-context"|公路车几何设定首页|当前车型/);
  assert.match(appSource, /import brandLogo from "\.\/assets\/brand\/logo_bai\.png"/);
  assert.match(appSource, /<header className="site-header">[\s\S]*<img className="site-header__logo" src=\{brandLogo\} alt="Bike Geometry Lab" \/>[\s\S]*<\/header>/);
  assert.match(stylesSource, /\.site-header\s*\{[^}]*height:\s*64px;[^}]*border:\s*0;[^}]*display:\s*grid;[^}]*place-items:\s*center;[^}]*background:\s*var\(--side-card-glass-bg\);[^}]*backdrop-filter:\s*var\(--card-glass-filter\);[^}]*-webkit-backdrop-filter:\s*var\(--card-glass-filter\);/s);
  assert.match(stylesSource, /\.site-header__logo\s*\{[^}]*height:\s*36px;[^}]*object-fit:\s*contain;/s);
  assert.match(stylesSource, /\.workspace\s*\{[^}]*height:\s*calc\(100vh - 64px\);[^}]*min-height:\s*656px;/s);
  assert.doesNotMatch(stylesSource, /\.topbar(?:\s|\.|\{|,)|\.brand(?:\s|\.|\{|,)|\.topbar-context(?:\s|\.|\{|,)|calc\(100vh\s*-\s*(?:68px|56px)\)/);
});

test("stage fullscreen replaces local zoom controls and preserves the mounted workspace", () => {
  assert.match(appSource, /const \[isStageFullscreen, setIsStageFullscreen\] = useState\(false\)/);
  assert.match(appSource, /workspace--stage-fullscreen/);
  assert.match(appSource, /event\.key === "Escape"/);
  assert.match(appSource, /isStageFullscreen=\{isStageFullscreen\}/);
  assert.match(bikeVisualizerSource, /全屏观看/);
  assert.match(bikeVisualizerSource, /退出全屏/);
  assert.match(bikeVisualizerSource, /CornersOut/);
  assert.match(bikeVisualizerSource, /CornersIn/);
  assert.doesNotMatch(bikeVisualizerSource, /MagnifyingGlass|Crosshair|setZoom|zoom-tools|requestFullscreen/);
  assert.match(stylesSource, /\.workspace\.workspace--stage-fullscreen\s*\{[^}]*grid-template-columns:\s*0 minmax\(0, 1fr\) 0/);
  assert.match(stylesSource, /\.workspace--stage-fullscreen \.frame-panel\s*\{[^}]*translateX\(-100%\)/);
  assert.match(stylesSource, /\.workspace--stage-fullscreen \.setup-panel\s*\{[^}]*translateX\(100%\)/);
  assert.match(stylesSource, /\.workspace--stage-fullscreen \.canvas-tools\s*\{[^}]*right:\s*24px/);
  assert.match(stylesSource, /--stage-card-duration:\s*300ms/);
  assert.match(stylesSource, /--stage-card-stagger:\s*70ms/);
  assert.match(stylesSource, /--stage-sidebar-duration:\s*520ms/);
  assert.match(stylesSource, /--stage-center-duration:\s*650ms/);
  assert.match(stylesSource, /transition-delay:\s*160ms/);
  assert.match(stylesSource, /transition-delay:\s*calc\(140ms \+ var\(--stagger-index/);
  assert.match(stylesSource, /--stage-motion-easing:\s*cubic-bezier\(\.22,1,\.36,1\)/);
  assert.match(stylesSource, /\.stage-fullscreen-control\s*\{[^}]*border:\s*0;[^}]*outline:\s*0;/);
  assert.doesNotMatch(stylesSource, /\.stage-fullscreen-control:hover\s*\{[^}]*border/);
  assert.match(stylesSource, /--stagger-index:\s*6/);
  assert.match(stylesSource, /translateX\(-20px\) scale\(\.985\)/);
  assert.match(stylesSource, /translateX\(20px\) scale\(\.985\)/);
  assert.doesNotMatch(appSource, /setTimeout|setInterval/);
  assert.match(stylesSource, /prefers-reduced-motion:[^)]*reduce[\s\S]*transition-duration:\s*\.01ms !important/);
  assert.match(bikeVisualizerSource, /<FullscreenGeometrySummary[\s\S]*bikes=\{bikes\}[\s\S]*activeBikeIndex=\{activeBikeIndex\}[\s\S]*compareEnabled=\{compareEnabled\}[\s\S]*visible=\{isStageFullscreen\}/);
  assert.match(fullscreenGeometrySummarySource, /bikes\.length === 2 && compareEnabled/);
  assert.doesNotMatch(fullscreenGeometrySummarySource, /getSTRProfile|STR \{|fullscreen-geometry-summary__identity/);
  assert.match(fullscreenGeometrySummarySource, /const displayedBikes = isComparison[\s\S]*bikes\.map\(\(bike, bikeIndex\) => \(\{ bike, bikeIndex \}\)\)[\s\S]*bike: bikes\[safeActiveIndex\]/);
  assert.match(fullscreenGeometrySummarySource, /fullscreen-geometry-summary__data-grid[\s\S]*<GeometryDataSection title="几何摘要"[\s\S]*<GeometryDataSection title="几何详情"/);
  assert.match(fullscreenGeometrySummarySource, /fullscreen-geometry-summary__metric-row[\s\S]*<dt>\{label\}<\/dt>[\s\S]*displayedBikes\.map/);
  assert.doesNotMatch(fullscreenGeometrySummarySource, /GeometryComparison|SingleGeometrySummary|ComparisonLabelGroup|ComparisonValueGroup|getComparisonSlotLabel|column-head/);
  for (const label of ["几何摘要", "几何详情", "Stack", "Reach", "头管长度", "轴距", "座管长度", "座管角", "头管角", "有效上管", "五通下沉", "后下叉长度", "前叉偏移", "拖曳距"]) {
    assert.ok(fullscreenGeometrySummarySource.includes(label));
  }
  assert.doesNotMatch(fullscreenGeometrySummarySource, /standoverMm|跨高/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary\s*\{[^}]*left:\s*24px;[^}]*bottom:\s*24px;[^}]*z-index:\s*5;[^}]*width:\s*300px;[^}]*border:\s*0;[^}]*border-radius:\s*18px;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(8px\);[^}]*transition:\s*opacity 240ms/s);
  assert.doesNotMatch(stylesSource, /fullscreen-geometry-summary__(?:comparison-grid|column-head|label-column|value-column)/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__data-grid\s*\{[^}]*row-gap:\s*16px/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__section h3\s*\{[^}]*color:\s*rgba\(255,255,255,\.88\);[^}]*font-size:\s*var\(--font-size-xs\);[^}]*font-weight:\s*700/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__metric-row\s*\{[^}]*grid-template-columns:\s*120px repeat\(1, 80px\);[^}]*justify-content:\s*space-between/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__data-grid\.is-comparison \.fullscreen-geometry-summary__metric-row\s*\{[^}]*grid-template-columns:\s*120px repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__metric-row dt\s*\{[^}]*color:\s*rgba\(255,255,255,\.58\);[^}]*font-size:\s*var\(--font-size-xs\)/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__metric-value strong\s*\{[^}]*color:\s*#fff;[^}]*font-size:\s*var\(--font-size-xs\);[^}]*font-weight:\s*700/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__metric-value\.is-secondary strong\s*\{[^}]*color:\s*rgba\(255,255,255,\.72\);[^}]*font-weight:\s*600/);
  assert.match(stylesSource, /\.fullscreen-geometry-summary__metric-value\.is-missing strong\s*\{[^}]*color:\s*rgba\(255,255,255,\.38\)/);
});

test("the workspace uses the supplied official Prism without site-side lighting effects", () => {
  assert.match(appSource, /import Prism from "\.\/components\/visualizer\/Prism\.jsx"/);
  assert.match(appSource, /className="workspace-prism-background" aria-hidden="true"/);
  assert.match(appSource, /<Prism[\s\S]*animationType="rotate"[\s\S]*timeScale=\{0\.3\}[\s\S]*height=\{6\.4\}[\s\S]*baseWidth=\{5\.7\}[\s\S]*scale=\{2\.4\}[\s\S]*hueShift=\{0\}[\s\S]*colorFrequency=\{1\}[\s\S]*noise=\{0\}[\s\S]*glow=\{0\.7\}[\s\S]*transparent[\s\S]*\/>/);
  assert.doesNotMatch(appSource, /StageSpotlight|className="stage-ground|stage-cone|stage-light|bloom=/);
  assert.doesNotMatch(bikeVisualizerSource, /<Prism|prism-background/);
  assert.match(prismSource, /from "ogl"/);
  assert.match(prismSource, /new ResizeObserver/);
  assert.match(prismSource, /prefers-reduced-motion: reduce/);
  assert.match(prismSource, /cancelAnimationFrame/);
  assert.match(prismSource, /container\.removeChild\(gl\.canvas\)/);
  assert.match(prismCssSource, /pointer-events:\s*none/);
  assert.match(stylesSource, /\.workspace-prism-background\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*z-index:\s*0;[^}]*overflow:\s*hidden;[^}]*pointer-events:\s*none;/);
  assert.match(stylesSource, /\.bike-canvas\s*\{[^}]*z-index:\s*2;/);
  assert.doesNotMatch(stylesSource, /\.(?:stage-product-lighting|stage-prism-cone|stage-cone-core|stage-cone-beams|stage-cone-warmth|stage-ground-light|stage-light-falloff)/);
  assert.doesNotMatch(stylesSource, /\.workspace-prism-background\s*\{[^}]*(?:gradient|mask|filter|mix-blend-mode|clip-path)/);
});

test("Prism is one full Workspace background instead of a Bike Visualizer child", () => {
  const workspaceStart = appSource.indexOf('<main className={`workspace');
  const prismIndex = appSource.indexOf('<div className="workspace-prism-background"', workspaceStart);
  const leftPanelIndex = appSource.indexOf('<FrameGeometryPanel', workspaceStart);
  const centerStageIndex = appSource.indexOf('<div className="main-stage">', workspaceStart);
  const rightPanelIndex = appSource.indexOf('<BikeSetupPanel', workspaceStart);

  assert.ok(workspaceStart >= 0 && workspaceStart < prismIndex && prismIndex < leftPanelIndex && leftPanelIndex < centerStageIndex && centerStageIndex < rightPanelIndex);
  assert.equal(appSource.match(/<Prism\b/g)?.length, 1);
  assert.doesNotMatch(bikeVisualizerSource, /<Prism|workspace-prism-background|prism-background/);
  assert.match(stylesSource, /\.workspace\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;[^}]*background:\s*var\(--app-bg\);/);
  assert.match(stylesSource, /\.main-stage\s*\{[^}]*background:\s*transparent;/);
  assert.match(stylesSource, /\.visualizer\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;/);
  assert.match(stylesSource, /\.canvas-wrap\s*\{[^}]*overflow:\s*hidden;/);
  assert.match(prismSource, /new ResizeObserver/);
});

test("Bike Stage aligns both 700C wheel contact points to one responsive Prism ground baseline", () => {
  const project = createProjector();
  const wheelOuterRadius = RENDERED_WHEEL_DIAMETER_PX / 2;
  const stageLayouts = [
    { stageWidth: 1109, stageHeight: 945 },
    { stageWidth: 1781, stageHeight: 945 },
    { stageWidth: 640, stageHeight: 760 },
  ];

  for (const size of geometrySizes) {
    const geometry = enduranceGeometrySizes[size];
    const bike = buildBikeGeometry(geometry, defaultFit);
    const rearWheelBottomY = project(bike.frame.rearAxle).y + wheelOuterRadius;
    const frontWheelBottomY = project(bike.frame.frontAxle).y + wheelOuterRadius;

    assert.ok(Math.abs(frontWheelBottomY - rearWheelBottomY) < 1e-9, `size ${size} wheels share one unshifted ground`);

    for (const layout of stageLayouts) {
      const alignment = getBikeStageGroundAlignment({ ...layout, bikeGroundY: rearWheelBottomY });
      const shiftedRearBottomY = rearWheelBottomY + alignment.stageTranslateY;
      const shiftedFrontBottomY = frontWheelBottomY + alignment.stageTranslateY;
      const shiftedGroundYPx = shiftedRearBottomY * alignment.stageScale + alignment.viewBoxOffsetY;

      assert.ok(Math.abs(shiftedRearBottomY - alignment.stageGroundY) < 1e-9);
      assert.ok(Math.abs(shiftedFrontBottomY - alignment.stageGroundY) < 1e-9);
      assert.ok(Math.abs(shiftedGroundYPx - layout.stageHeight * PRISM_GROUND_Y_RATIO) < 1e-9);
    }
  }

  assert.match(bikeVisualizerSource, /new ResizeObserver\(updateStageSize\)/);
  assert.match(bikeVisualizerSource, /const bikeGroundY = rearAxle\.y \+ wheelOuterRadius/);
  assert.match(bikeVisualizerSource, /<g className="stage-content" transform=\{`translate\(0 \$\{groundAlignment\.stageTranslateY\}\)`\}>/);
  assert.match(bikeVisualizerSource, /className="stage-content"[\s\S]*<BikeRenderer[\s\S]*className="dimensions"[\s\S]*className="bb-origin"/);
  assert.doesNotMatch(bikeVisualizerSource, /getBBox\(|FrontWheel translateY|RearWheel translateY/);
  assert.match(stylesSource, /\.bike-canvas\s*\{[^}]*overflow:\s*visible;/);
});

test("Bike reflection reuses the primary animated bike around the responsive ground baseline", () => {
  const reflectionIndex = bikeVisualizerSource.indexOf('className="bike-reflection"');
  const mainBikeIndex = bikeVisualizerSource.indexOf('<g className="stage-content"');

  assert.ok(reflectionIndex >= 0 && reflectionIndex < mainBikeIndex, "reflection paints before the main bike content");
  assert.match(bikeVisualizerSource, /const REFLECTION_OPACITY = 0\.2/);
  assert.match(bikeVisualizerSource, /const REFLECTION_GAP_PX = 2/);
  assert.match(bikeVisualizerSource, /const reflectionGap = REFLECTION_GAP_PX \/ groundAlignment\.stageScale/);
  assert.match(bikeVisualizerSource, /const getBikeVisualSourceId = \(bikeId\) => `bike-visual-source-\$\{bikeId\}`/);
  assert.match(bikeVisualizerSource, /<g id=\{sourceId\} data-bike-visual-source=\{bike\.id\}>[\s\S]*<RoadBikeVisual/);
  assert.match(bikeVisualizerSource, /`translate\(0 \$\{reflectionGap\}\)`[\s\S]*`translate\(0 \$\{groundAlignment\.stageGroundY\}\)`[\s\S]*"scale\(1 -1\)"[\s\S]*`translate\(0 \$\{-groundAlignment\.stageGroundY\}\)`/);
  assert.match(bikeVisualizerSource, /data-reflection-gap-px=\{REFLECTION_GAP_PX\}/);
  assert.match(bikeVisualizerSource, /className="bike-reflection"[\s\S]*opacity=\{REFLECTION_OPACITY\}[\s\S]*data-reflection-source="shared-bike-visual-use"[\s\S]*data-reflection-transform="scaleY\(-1\)"[\s\S]*<use[\s\S]*href=\{`#\$\{primarySourceId\}`\}[\s\S]*data-reflection-instance="shared-animation-timeline"/);
  assert.equal(bikeVisualizerSource.match(/<RoadBikeVisual\b/g)?.length, 1);
  assert.match(bikeVisualizerSource, /const primaryModel = renderModelList\[safeActiveIndex\]/);
  assert.match(bikeVisualizerSource, /const secondaryModel = renderModelList\[safeActiveIndex === 0 \? 1 : 0\]/);
  assert.match(bikeVisualizerSource, /const renderModels = isComparisonVisible \? \[secondaryModel, primaryModel\] : \[primaryModel\]/);
  assert.match(bikeVisualizerSource, /opacity=\{isPrimary \? 1 : 0\.28\}/);
  assert.match(stylesSource, /\.bike-reflection\s*\{[^}]*pointer-events:\s*none;/);
  assert.doesNotMatch(bikeVisualizerSource, /REFLECTION_(?:BLUR|SATURATION|BRIGHTNESS|HEIGHT|MAX)|reflectionCanvasRef|bike-reflection-canvas/);
  assert.doesNotMatch(stylesSource, /\.bike-reflection[^}]*?(?:filter|mask|gradient|blur|brightness|saturate)/s);
  assert.match(roadBikeVisualSource, /showContactPoints = true/);
  assert.match(enduranceTemplateSource, /showContactPoints && <PedalContactMarker/);
  assert.match(enduranceTemplateSource, /showContactPoints && \([\s\S]*<HandlebarContactMarker/);
  assert.match(enduranceTemplateSource, /--bike-contact-opacity/);
  assert.match(enduranceTemplateSource, /--bike-debug-opacity/);
  assert.doesNotMatch(bikeVisualizerSource.slice(reflectionIndex, mainBikeIndex), /<ContactPoint|<DimensionLine|<AngleIndicator|<GeometrySkeleton|bb-origin/);
});

test("bicycle resources render without SVG or CSS shadow effects", () => {
  for (const asset of bicycleSvgSources) {
    assert.doesNotMatch(
      asset.source,
      /<filter\b|filter=|feDropShadow|feGaussianBlur|feOffset|inner[-_ ]?shadow|drop[-_ ]?shadow/i,
      `${asset.name} must remain free of resource-owned shadow filters`,
    );
  }

  assert.doesNotMatch(stylesSource, /\.figma-bike[^}]*drop-shadow\(/s);
  assert.doesNotMatch(stylesSource, /\.figma-bike[^}]*box-shadow\s*:/s);
  assert.doesNotMatch(stylesSource, /\.figma-bike[^}]*text-shadow\s*:/s);
  assert.match(stylesSource, /\.figma-bike-template image\s*\{[^}]*filter:\s*brightness\(1\.13\) contrast\(1\.08\);/);
  assert.match(stylesSource, /\.figma-bike__wheel,[\s\S]*?\.figma-bike__tire\s*\{[^}]*filter:\s*brightness\(1\.38\) contrast\(\.86\);/);
  assert.match(appSource, /className="workspace-prism-background" aria-hidden="true"/);
});

test("production frame and fork expose colorable bodies while axle rods stay fixed black at 30%", () => {
  assert.match(frameBottomBracketSource, /fill="black"/);
  assert.match(frameBottomBracketSource, /width="113\.192"[^>]*viewBox="0 0 113\.192 88\.8519"/);
  assert.match(frameBottomBracketSource, /<path id="Subtract"[^>]*C83\.911 34\.2797 120\.386 -9\.29462[^>]*M55\.103 55\.165C47\.9234/);
  assert.doesNotMatch(frameBottomBracketSource, /id="&#228;&#186;&#148;&#233;&#128;&#154;_2"/);
  assert.match(forkSource, /<path[^>]*fill="black"/);
  assert.match(forkSource, /<circle[^>]*fill="#000000"[^>]*fill-opacity="0\.3"/);
  assert.match(frameChainstaySource, /<circle[^>]*fill="#000000"[^>]*fill-opacity="0\.3"/);
  assert.match(stylesSource, /\.figma-bike-template \.figma-bike__frame,[\s\S]*?\.figma-bike-template \.figma-bike__fork\s*\{[^}]*filter:\s*none;/);
  assert.match(stylesSource, /\.figma-bike-template \.figma-bike__handlebar-tape\s*\{[^}]*filter:\s*none;/);
});

test("frame, fork, and bar tape colors are preset-driven, independent, and persisted", () => {
  assert.deepEqual(COLOR_PRESETS, [
    { key: "red", label: "红色", value: "#C94B4B" },
    { key: "orange", label: "橙色", value: "#D7783F" },
    { key: "yellow", label: "黄色", value: "#D6B84B" },
    { key: "green", label: "绿色", value: "#4F8A62" },
    { key: "blue", label: "蓝色", value: "#3E73C8" },
    { key: "purple", label: "紫色", value: "#765FA8" },
    { key: "peach", label: "桃色", value: "#D98972" },
    { key: "pink", label: "粉色", value: "#C97991" },
    { key: "black", label: "黑色", value: "#111111" },
    { key: "white", label: "白色", value: "#F2F2F0" },
    { key: "graphite", label: "石墨灰", value: "#4B4F56" },
    { key: "silver", label: "银灰", value: "#A7ADB5" },
    { key: "sage", label: "鼠尾草绿", value: "#899A84" },
    { key: "burgundy", label: "酒红", value: "#74454D" },
    { key: "sand", label: "沙米色", value: "#C8B79C" },
  ]);
  assert.deepEqual(DEFAULT_BIKE_COLORS, {
    frameColor: "#111111",
    forkColor: "#111111",
    barTapeColor: "#111111",
  });
  assert.equal(normalizeBikeColor("#6b86a6"), "#6B86A6");
  assert.equal(normalizeBikeColor("invalid"), "#111111");

  const resolved = resolveComponentSetup({
    ...DEFAULT_COMPONENT_SETUP,
    frameColor: "#6b86a6",
    forkColor: "#899a84",
    barTapeColor: "#6b3f46",
  });
  assert.equal(resolved.frameColor, "#6B86A6");
  assert.equal(resolved.forkColor, "#899A84");
  assert.equal(resolved.barTapeColor, "#6B3F46");

  const modelCardIndex = framePanelSource.indexOf('title="车型"');
  const sizeCardIndex = framePanelSource.indexOf('<PanelSection title="尺码"');
  const appearanceCardIndex = framePanelSource.indexOf('<PanelSection title="车架外观">');
  const summaryCardIndex = framePanelSource.indexOf('<PanelSection title="几何摘要"');
  const detailsCardIndex = framePanelSource.indexOf('title="几何详情"');
  assert.ok(modelCardIndex < sizeCardIndex && sizeCardIndex < appearanceCardIndex && appearanceCardIndex < summaryCardIndex && summaryCardIndex < detailsCardIndex);
  assert.doesNotMatch(framePanelSource, /appearanceTarget|frameAppearanceTargets|车架外观着色目标/);
  assert.match(framePanelSource, /label="车架颜色"[\s\S]*value=\{bike\.frameColor\}[\s\S]*updateComponentSetup\("frameColor", value\)/);
  assert.match(framePanelSource, /label="前叉颜色"[\s\S]*value=\{bike\.forkColor\}[\s\S]*updateComponentSetup\("forkColor", value\)/);
  assert.match(appSource, /<FrameGeometryPanel[\s\S]*bike=\{workspaceBike\}[\s\S]*updateComponentSetup=\{updateComponentSetup\}/);

  assert.match(setupPanelSource, /<PanelSection title="颜色">/);
  assert.match(setupPanelSource, /<ColorPalette label="把带颜色" value=\{componentSetup\.barTapeColor\}/);
  assert.doesNotMatch(setupPanelSource, /label="车架颜色"|label="前叉颜色"|componentSetup\.(?:frameColor|forkColor)/);
  assert.match(colorPaletteSource, /type="color"/);
  assert.match(colorPaletteSource, /COLOR_PRESETS\.map/);
  assert.equal(COLOR_PRESETS.length, 15);
  assert.match(stylesSource, /\.color-swatches\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(8, 1fr\);[^}]*grid-template-rows:\s*repeat\(2, 26px\);[^}]*gap:\s*8px 0;/s);
  assert.match(stylesSource, /\.color-swatch\s*\{[^}]*justify-self:\s*center;[^}]*width:\s*26px;[^}]*height:\s*26px;[^}]*border-radius:\s*8px;/s);
  assert.match(stylesSource, /\.color-swatch\.is-selected\s*\{[^}]*box-shadow:\s*0 0 0 2px var\(--brand-primary\),\s*0 0 0 4px rgba\(22,119,255,\.14\)/s);
  assert.match(colorPaletteSource, /className=\{`color-swatch color-swatch--custom[\s\S]*title="自定义色值"[\s\S]*type="color"/);
  assert.match(stylesSource, /\.color-swatch--custom\s*\{[^}]*background:\s*conic-gradient\(/s);
  assert.doesNotMatch(colorPaletteSource, /color-custom-button|<span>自定义色值<\/span>/);

  assert.match(enduranceTemplateSource, /colorizedSvgAsset\(frameDownTubeSource, "black", components\.frameColor\)/);
  assert.match(enduranceTemplateSource, /colorizedSvgAsset\(forkSource, "black", components\.forkColor\)/);
  assert.match(enduranceTemplateSource, /colorizedSvgAsset\(handlebarTapeSource, "#D9D9D9", components\.barTapeColor\)/);
  assert.match(enduranceTemplateSource, /data-frame-color=\{components\.frameColor\}/);
  assert.match(enduranceTemplateSource, /data-fork-color=\{components\.forkColor\}/);
  assert.match(enduranceTemplateSource, /data-bar-tape-color=\{components\.barTapeColor\}/);
});

test("wheel resources preserve the latest Figma material palette", () => {
  for (const source of wheelOuterSources) {
    assert.match(source, /fill="#191919"/);
  }
  for (const source of wheelInnerSources) {
    assert.match(source, /opacity="0\.04"/);
    assert.match(source, /fill="white"/);
  }
});

test("Dark Cycling UI maps brand interactions to blue and keeps green semantic", () => {
  assert.match(stylesSource, /--brand-primary:\s*#246BFD;/);
  assert.match(stylesSource, /--brand-primary-hover:\s*#3B7BFF;/);
  assert.match(stylesSource, /--brand-primary-active:\s*#1E5FE5;/);
  assert.match(stylesSource, /--accent:\s*var\(--brand-primary\);/);
  assert.match(stylesSource, /--status-success:\s*#22D66F;/);
  assert.match(stylesSource, /\.status-dot\s*\{[^}]*background:\s*var\(--status-success\);/s);
  assert.match(stylesSource, /\.switch\.is-on\s*\{[^}]*background:\s*var\(--selected-bg\);/s);
  assert.match(stylesSource, /\.contact-point circle:first-child\s*\{[^}]*stroke:\s*var\(--accent\);[^}]*var\(--accent-glow\)/s);
  assert.doesNotMatch(stylesSource, /#22e36e|rgba\(34\s*,\s*227\s*,\s*110/i);
  assert.doesNotMatch(prismSource, /brand-primary|status-success|var\(--accent/i);
  assert.doesNotMatch(prismCssSource, /brand-primary|status-success|var\(--accent/i);
});

test("Geometry annotations use layered white tokens while contact points stay brand blue", () => {
  assert.match(stylesSource, /--geometry-label:\s*rgba\(255,255,255,\.72\);/);
  assert.match(stylesSource, /--geometry-value:\s*rgba\(255,255,255,\.96\);/);
  assert.match(stylesSource, /--geometry-line:\s*rgba\(255,255,255,\.42\);/);
  assert.match(stylesSource, /\.dimension-line line\s*\{[^}]*stroke:\s*var\(--geometry-line\);/s);
  assert.match(stylesSource, /\.dimension-line text\s*\{[^}]*fill:\s*var\(--geometry-label\);/s);
  assert.match(stylesSource, /\.dimension-line \.dimension-value\s*\{[^}]*fill:\s*var\(--geometry-value\);/s);
  assert.match(stylesSource, /\.angle-label path\s*\{[^}]*stroke:\s*var\(--geometry-line\);/s);
  assert.match(stylesSource, /\.angle-label text\s*\{[^}]*fill:\s*var\(--geometry-value\);/s);
  assert.match(stylesSource, /\.angle-label \.angle-label__name\s*\{[^}]*fill:\s*var\(--geometry-label\);/s);
  assert.match(stylesSource, /\.contact-point text\s*\{[^}]*fill:\s*var\(--accent\);/s);
  assert.match(stylesSource, /\.contact-point circle:first-child\s*\{[^}]*stroke:\s*var\(--accent\);/s);
});

test("Fit Setup uses continuous ranges and an index-driven discrete stem-angle range", () => {
  assert.equal((setupPanelSource.match(/<RangeControl /g) ?? []).length, 4);
  assert.equal((setupPanelSource.match(/<DiscreteRangeControl/g) ?? []).length, 1);
  assert.doesNotMatch(setupPanelSource, /<Stepper /);
  for (const control of [
    'label="垫圈高度" unit="mm" value={fitSetup.spacerHeight} min={0} max={60} step={5}',
    'label="把立长度" unit="mm" value={fitSetup.stemLength} min={60} max={140} step={10}',
    'label="坐垫高度" unit="mm" value={fitSetup.saddleHeight} min={620} max={900} step={1}',
    'label="坐垫后移" unit="mm" value={fitSetup.saddleSetback} min={-30} max={60} step={1}',
  ]) {
    assert.ok(setupPanelSource.includes(control), `${control} must retain its requested range contract`);
  }
  assert.deepEqual(STEM_ANGLE_OPTIONS, [-17, -12, -10, -8, -6, 0, 6, 7, 8, 10, 12]);
  assert.equal(DEFAULT_FIT_SETUP.stemAngle, -12);
  assert.match(setupPanelSource, /<DiscreteRangeControl[\s\S]*label="把立角度"[\s\S]*value=\{fitSetup\.stemAngle\}[\s\S]*options=\{STEM_ANGLE_OPTIONS\}[\s\S]*tickValues=\{\[-17, -6, 0, 6, 12\]\}/);
  assert.match(setupPanelSource, /options=\{\[165, 170, 172\.5, 175\]\}/);
  assert.match(rangeControlSource, /type="range"/);
  assert.match(rangeControlSource, /onChange=\{\(event\) => update\(event\.target\.value\)\}/);
  assert.match(rangeControlSource, /onClick=\{\(\) => update\(value - step\)\}/);
  assert.match(rangeControlSource, /onClick=\{\(\) => update\(value \+ step\)\}/);
  assert.match(rangeControlSource, /min < 0 && max > 0/);
  assert.match(rangeControlSource, /min=\{0\}[\s\S]*max=\{maxIndex\}[\s\S]*step=\{1\}[\s\S]*value=\{selectedIndex\}/);
  assert.match(rangeControlSource, /onChange=\{\(event\) => updateIndex\(event\.target\.value\)\}/);
  assert.match(rangeControlSource, /onChange\(options\[clampedIndex\]\)/);
  assert.doesNotMatch(setupPanelSource, /label="把立角度"[^>]*min=\{-17\}|label="把立角度"[^>]*step=\{1\}/);
  assert.match(stylesSource, /\.range-control__track-wrap input\[type="range"\][\s\S]*background-image:\s*linear-gradient\(to right, var\(--selected-bg\)/);
  assert.match(stylesSource, /\.range-control__zero\s*\{[^}]*background:\s*rgba\(255,255,255,\.46\);/s);
  assert.match(stylesSource, /\.range-control__tick\.is-selected\s*\{[^}]*background:\s*var\(--selected-bg\);/s);
  assert.match(stylesSource, /\.range-control__tick-label\s*\{[^}]*color:\s*var\(--tertiary\);/s);
  assert.match(stylesSource, /input\[type="range"\]:focus-visible::-webkit-slider-thumb/);
});

test("selected and unselected option controls share one high-contrast state system", () => {
  assert.match(stylesSource, /--control-bg:\s*rgba\(255,255,255,\.06\);/);
  assert.match(stylesSource, /--control-bg-hover:\s*rgba\(255,255,255,\.10\);/);
  assert.match(stylesSource, /--control-text:\s*rgba\(255,255,255,\.72\);/);
  assert.match(stylesSource, /--control-text-hover:\s*rgba\(255,255,255,\.90\);/);
  assert.match(stylesSource, /--control-disabled-bg:\s*rgba\(255,255,255,\.035\);/);
  assert.match(stylesSource, /--control-disabled-text:\s*rgba\(244,246,248,\.28\);/);
  assert.match(stylesSource, /--selected-bg:\s*#1677FF;/);
  assert.match(stylesSource, /--selected-text:\s*#FFFFFF;/);
  assert.match(stylesSource, /--selected-shadow:\s*0 0 0 1px rgba\(22,119,255,\.15\), 0 6px 16px rgba\(22,119,255,\.18\);/);

  for (const selector of ["setup-tabs button", "wheel-matrix__cell", "segmented button", "geometry-language-toggle button"]) {
    const escaped = selector.replace(/\./g, "\\.");
    assert.match(stylesSource, new RegExp(`\\.${escaped}\\s*\\{[^}]*background:\\s*var\\(--control-bg\\);[^}]*color:\\s*var\\(--control-text\\);`, "s"));
    assert.match(stylesSource, new RegExp(`\\.${escaped}:hover\\s*\\{[^}]*background:\\s*var\\(--control-bg-hover\\);[^}]*color:\\s*var\\(--control-text-hover\\);`, "s"));
  }

  for (const selector of ["setup-tabs button.is-active", "wheel-matrix__cell.is-selected", "segmented button.is-selected", "geometry-language-toggle button.is-active"]) {
    const escaped = selector.replace(/\./g, "\\.");
    assert.match(stylesSource, new RegExp(`\\.${escaped}\\s*\\{[^}]*background:\\s*var\\(--selected-bg\\);[^}]*color:\\s*var\\(--selected-text\\);[^}]*box-shadow:\\s*var\\(--selected-shadow\\);`, "s"));
  }

  assert.match(stylesSource, /\.model-card span\s*\{[^}]*background:\s*var\(--selected-bg\);[^}]*color:\s*var\(--selected-text\);[^}]*box-shadow:\s*var\(--selected-shadow\);/s);
  assert.match(stylesSource, /\.stepper-control button:hover\s*\{[^}]*background:\s*var\(--control-bg-hover\);[^}]*color:\s*var\(--control-text-hover\);/s);
  assert.doesNotMatch(stylesSource, /(?:setup-tabs button|wheel-matrix__cell|segmented button|geometry-language-toggle button):hover\s*\{[^}]*(?:accent-soft|var\(--accent\))/s);
});

test("sidebar and visualizer header shells stay fully transparent without removing inner cards", () => {
  for (const selector of ["side-panel", "frame-panel", "setup-panel", "panel-heading", "visualizer__header"]) {
    const rule = new RegExp(`\\.${selector}\\s*\\{[^}]*background:\\s*transparent;[^}]*box-shadow:\\s*none;[^}]*backdrop-filter:\\s*none;`, "s");
    assert.match(stylesSource, rule, `${selector} outer shell must be transparent and effect-free`);
  }

  assert.match(stylesSource, /\.side-panel::before,[\s\S]*?\.visualizer__header::after\s*\{[^}]*display:\s*none;[^}]*content:\s*none;/);
  assert.match(stylesSource, /\.control-section\s*\{[^}]*background:\s*var\(--side-card-glass-bg\);/);
  assert.match(stylesSource, /\.setup-tabs\s*\{[^}]*background:\s*var\(--side-card-glass-bg\);/);
  assert.match(bikeVisualizerSource, /<div className="visualizer__header">[\s\S]*<DualBikeControls[\s\S]*className="stage-fullscreen-control"/);
  assert.doesNotMatch(bikeVisualizerSource, /active-bike-metrics|bike-title/);
  assert.match(appSource, /className="workspace-prism-background" aria-hidden="true"/);
});

test("sidebar scroll regions keep vertical scrolling while hiding scrollbar chrome", () => {
  assert.match(stylesSource, /\.side-panel__scroll\s*\{[^}]*overflow-y:\s*auto;[^}]*scrollbar-width:\s*none;[^}]*-ms-overflow-style:\s*none;/s);
  assert.match(stylesSource, /\.side-panel__scroll::\-webkit-scrollbar\s*\{[^}]*display:\s*none;/s);
});

test("side and floating cards share the neutral-black glass system without colored overlays", () => {
  assert.match(stylesSource, /--card-glass-bg:\s*rgba\(5,7,10,\.58\);/);
  assert.match(stylesSource, /--side-card-glass-bg:\s*rgba\(5,7,10,\.48\);/);
  assert.match(stylesSource, /--card-glass-border:\s*rgba\(255,255,255,\.05\);/);
  assert.match(stylesSource, /--card-glass-shadow:\s*0 8px 24px rgba\(0,0,0,\.24\);/);
  assert.match(stylesSource, /--card-glass-filter:\s*blur\(20px\) saturate\(110%\);/);

  for (const selector of ["control-section", "setup-tabs"]) {
    const rule = new RegExp(`\\.${selector}\\s*\\{[^}]*border:\\s*0;[^}]*background:\\s*var\\(--side-card-glass-bg\\);[^}]*box-shadow:\\s*var\\(--card-glass-shadow\\);[^}]*backdrop-filter:\\s*var\\(--card-glass-filter\\);[^}]*-webkit-backdrop-filter:\\s*var\\(--card-glass-filter\\);`, "s");
    assert.match(stylesSource, rule, `${selector} must use the shared neutral glass card tokens`);
  }

  for (const selector of ["canvas-tools"]) {
    const rule = new RegExp(`\\.${selector}\\s*\\{[^}]*right:\\s*24px;[^}]*border:\\s*0;[^}]*background:\\s*var\\(--card-glass-bg\\);[^}]*box-shadow:\\s*var\\(--card-glass-shadow\\);[^}]*backdrop-filter:\\s*var\\(--card-glass-filter\\);[^}]*-webkit-backdrop-filter:\\s*var\\(--card-glass-filter\\);`, "s");
    assert.match(stylesSource, rule, `${selector} must retain the floating glass background`);
  }

  assert.match(stylesSource, /\.stage-fullscreen-control\s*\{[^}]*border:\s*0;[^}]*background:\s*var\(--card-glass-bg\);[^}]*box-shadow:\s*var\(--card-glass-shadow\);[^}]*backdrop-filter:\s*var\(--card-glass-filter\);/s);
  assert.doesNotMatch(stylesSource, /\.frame-panel \.control-section::before|\.setup-panel \.control-section::before/);
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

test("Endurance visual deltas are explicitly calibrated against size 54", () => {
  assert.equal(ENDURANCE_VISUAL_BASE_SIZE, "54");
  assert.deepEqual(ENDURANCE_VISUAL_BASE_GEOMETRY, {
    wheel: "700c",
    seatTube: 500,
    seatAngle: 73.7,
    headTube: 160,
    headAngle: 71.3,
    effectiveTopTube: 542,
    bbDrop: 80,
    chainstay: 420,
    forkRake: 53,
    trail: 59,
    wheelbase: 1010,
    standover: 754,
    reach: 374,
    stack: 575,
  });

  const expected = {
    44: { stack: -65, reach: -14, headTube: -65, headAngle: -1, seatTube: -110, seatAngle: 0.9, effectiveTopTube: -35, wheelbase: -27, chainstay: 0, bbDrop: 0, forkRake: 0, trail: 7, standover: -97, scale: 95 / 160 },
    49: { stack: -35, reach: -6, headTube: -37, headAngle: -0.5, seatTube: -60, seatAngle: 0.9, effectiveTopTube: -26, wheelbase: -9, chainstay: 5, bbDrop: 0, forkRake: 0, trail: 7, standover: -37, scale: 123 / 160 },
    52: { stack: -14, reach: -3, headTube: -15, headAngle: 0, seatTube: -25, seatAngle: 0.5, effectiveTopTube: -12, wheelbase: -7, chainstay: 0, bbDrop: 0, forkRake: 0, trail: 0, standover: -19, scale: 145 / 160 },
    54: { stack: 0, reach: 0, headTube: 0, headAngle: 0, seatTube: 0, seatAngle: 0, effectiveTopTube: 0, wheelbase: 0, chainstay: 0, bbDrop: 0, forkRake: 0, trail: 0, standover: 0, scale: 1 },
    56: { stack: 16, reach: 3, headTube: 15, headAngle: 0.6, seatTube: 25, seatAngle: -0.4, effectiveTopTube: 12, wheelbase: 8, chainstay: 0, bbDrop: -2, forkRake: -5, trail: 2, standover: 22, scale: 175 / 160 },
    58: { stack: 36, reach: 6, headTube: 35, headAngle: 0.7, seatTube: 48, seatAngle: -0.7, effectiveTopTube: 25, wheelbase: 12, chainstay: 5, bbDrop: -2, forkRake: -5, trail: 1, standover: 42, scale: 195 / 160 },
    61: { stack: 71, reach: 11, headTube: 75, headAngle: 0.8, seatTube: 76, seatAngle: -1, effectiveTopTube: 44, wheelbase: 28, chainstay: 5, bbDrop: -5, forkRake: -5, trail: 4, standover: 88, scale: 235 / 160 },
  };
  for (const size of geometrySizes) {
    const delta = getEnduranceVisualDelta(enduranceGeometrySizes[size]);
    assert.equal(delta.stack, expected[size].stack);
    assert.equal(delta.reach, expected[size].reach);
    assert.equal(delta.headTube, expected[size].headTube);
    assert.ok(Math.abs(delta.headAngle - expected[size].headAngle) < 1e-9);
    assert.equal(delta.seatTube, expected[size].seatTube);
    assert.ok(Math.abs(delta.seatAngle - expected[size].seatAngle) < 1e-9);
    assert.equal(delta.effectiveTopTube, expected[size].effectiveTopTube);
    assert.equal(delta.wheelbase, expected[size].wheelbase);
    assert.equal(delta.chainstay, expected[size].chainstay);
    assert.equal(delta.bbDrop, expected[size].bbDrop);
    assert.equal(delta.forkRake, expected[size].forkRake);
    assert.equal(delta.trail, expected[size].trail);
    assert.equal(delta.standover, expected[size].standover);
    assert.ok(Math.abs(delta.headTubeScale - expected[size].scale) < 1e-9);
  }
});

test("size 54 produces identity local delta transforms for every split frame part", () => {
  const bike = buildBikeGeometry(ENDURANCE_VISUAL_BASE_GEOMETRY, defaultFit);
  const projected = Object.fromEntries(
    Object.entries(bike.anchors).map(([key, point]) => [key, createProjector()(point)]),
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
  const projected = Object.fromEntries(Object.entries(bike.anchors).map(([key, point]) => [key, createProjector()(point)]));
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

test("top and down tube assets preserve Figma connection-completion layers above their main paths", () => {
  const topTubeSource = readFileSync(
    new URL("../src/assets/bikeTemplates/endurance/frame-top-tube.svg", import.meta.url),
    "utf8",
  );
  const downTubeSource = readFileSync(
    new URL("../src/assets/bikeTemplates/endurance/frame-down-tube.svg", import.meta.url),
    "utf8",
  );

  assert.equal((topTubeSource.match(/<path /g) ?? []).length, 2);
  assert.equal((downTubeSource.match(/<path /g) ?? []).length, 4);
  assert.ok(topTubeSource.indexOf("M394.471 27.5") < topTubeSource.indexOf("M384.886 39.5322"));
  assert.ok(downTubeSource.indexOf("M339.384 47.5") < downTubeSource.indexOf("M307.384 23"));
  assert.ok(downTubeSource.indexOf("M307.384 23") < downTubeSource.indexOf("M328.384 67"));
  assert.ok(downTubeSource.indexOf("M328.384 67") < downTubeSource.indexOf("M62.3725 318.374"));
  assert.match(downTubeSource, /id="&#229;&#156;&#134;&#232;&#167;&#146;&#232;&#161;&#165;&#229;&#133;&#168;"/);
  assert.equal((topTubeSource.match(/fill="black"/g) ?? []).length, 2);
  assert.equal((downTubeSource.match(/fill="black"/g) ?? []).length, 4);
  assert.doesNotMatch(`${topTubeSource}${downTubeSource}`, /<rect|<filter|border-radius/);
  assert.match(enduranceTemplateSource, /colorizedSvgAsset\(frameTopTubeSource, "black", components\.frameColor\)/);
  assert.match(enduranceTemplateSource, /colorizedSvgAsset\(frameDownTubeSource, "black", components\.frameColor\)/);
});

test("Fork visual leaves a 6px axial head gap while keeping FrontAxle exact", () => {
  assert.match(enduranceTemplateSource, /const FORK_HEAD_GAP_PX = 6/);
  assert.match(enduranceTemplateSource, /forkAxisDelta\.x \/ forkAxisLength \* FORK_HEAD_GAP_PX/);
  assert.match(enduranceTemplateSource, /forkAxisDelta\.y \/ forkAxisLength \* FORK_HEAD_GAP_PX/);
  assert.match(enduranceTemplateSource, /assetAnchors\.forkTop,[\s\S]*assetAnchors\.forkAxle,[\s\S]*forkVisualTop,[\s\S]*projected\.frontAxle/);
  assert.match(enduranceTemplateSource, /data-fork-head-gap-px=\{FORK_HEAD_GAP_PX\}/);
  assert.match(enduranceTemplateSource, /data-fork-axle-error-px=\{forkAxleErrorPx\.toFixed\(9\)\}/);
});

test("Endurance SVG keeps non-drive crank behind wheels and drive crank in front", () => {
  const renderOrderTokens = [
    'renderLayer="non-drive-crank"',
    'renderLayer="front-rotor"',
    'renderLayer="rear-wheel"',
    'renderLayer="cassette"',
    'renderLayer="front-wheel"',
    'renderLayer="seatpost"',
    'renderLayer="saddle"',
    'data-render-layer="cockpit"',
    'renderLayer="fork"',
    'data-render-layer="frame"',
    'renderLayer="chain"',
    'renderLayer="drivetrain"',
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

test("preview motion starts enabled, stays infinitely looping, and can pause from the canvas controls", () => {
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
  assert.match(enduranceTemplateSource, /data-preview-motion=\{motionStopped \? "stopped" : "running"\}/);
  assert.match(enduranceTemplateSource, /repeatCount="indefinite"/);
  assert.doesNotMatch(enduranceTemplateSource, /motionEnabled/);
  assert.match(bikeVisualizerSource, /<Switch label="停止动画" checked=\{isMotionStopped\}/);
  assert.match(bikeVisualizerSource, /data-motion-stopped=\{isMotionStopped\}/);
  assert.match(bikeVisualizerSource, /canvas\.pauseAnimations\?\.\(\)/);
  assert.match(bikeVisualizerSource, /canvas\.unpauseAnimations\?\.\(\)/);
  assert.doesNotMatch(enduranceTemplateSource, /\{!isStopped && \(/);
  assert.match(enduranceTemplateSource, /renderLayer="drive-crank"[\s\S]*<PedalContactMarker point=\{projected\.pedalAnchor\} \/>/);
  assert.doesNotMatch(enduranceTemplateSource, /showFigmaAnchors && <PedalContactMarker/);
  assert.doesNotMatch(bikeVisualizerSource, /<ContactPoint point=\{data\.contacts\.pedal\}/);
  assert.match(enduranceTemplateSource, /data-crank-visual-base-length=\{BASE_CRANK_LENGTH_MM\}/);
  assert.match(enduranceTemplateSource, /data-crank-length-ratio=\{\(crankLengthMm \/ BASE_CRANK_LENGTH_MM\)\.toFixed\(6\)\}/);
});

test("chainring preserves its Figma phase relationship with the drive crank", () => {
  assert.match(enduranceTemplateSource, /const crankSourceAngleDeg = Math\.atan2\(/);
  assert.match(enduranceTemplateSource, /const crankTargetAngleDeg = Math\.atan2\(/);
  assert.match(enduranceTemplateSource, /const chainringCrankAlignmentAngleDeg = crankTargetAngleDeg - crankSourceAngleDeg/);
  assert.match(enduranceTemplateSource, /transform=\{`rotate\(\$\{chainringCrankAlignmentAngleDeg\} \$\{projected\.bottomBracket\.x\} \$\{projected\.bottomBracket\.y\}\)`\}/);
  assert.match(enduranceTemplateSource, /data-chainring-alignment-source="drive-crank-axis"/);
  assert.match(enduranceTemplateSource, /renderLayer="chainring" syncGroup="crankset"[\s\S]*renderLayer="drive-crank" syncGroup="crankset"/);
});

test("non-drive crank starts exactly opposite the drive crank and shares its rotation cycle", () => {
  const bb = { x: 430, y: 420 };
  const drivePedal = { x: 492, y: 471 };
  const nonDrivePedal = oppositePointAround(bb, drivePedal);
  assert.deepEqual(nonDrivePedal, { x: 368, y: 369 });
  assert.equal(drivePedal.x - bb.x, -(nonDrivePedal.x - bb.x));
  assert.equal(drivePedal.y - bb.y, -(nonDrivePedal.y - bb.y));
  assert.match(enduranceTemplateSource, /phaseOffset=\{180\} renderLayer="non-drive-crank" syncGroup="crankset"/);
  assert.match(enduranceTemplateSource, /data-non-drive-crank-mirror="scaleX\(-1\)"/);

  const crank = BikeComponents.Crank.find(({ id }) => id === "red");
  const sourceBb = {
    x: crank.sourceBounds.x + crank.visualAnchor.x,
    y: crank.sourceBounds.y + crank.visualAnchor.y,
  };
  const sourcePedal = {
    x: crank.sourceBounds.x + crank.pedalAnchor.x,
    y: crank.sourceBounds.y + crank.pedalAnchor.y,
  };
  const mirrorAxisX = crank.sourceBounds.x + crank.sourceBounds.width / 2;
  const localMirror = { a: -1, b: 0, c: 0, d: 1, e: mirrorAxisX * 2, f: 0 };
  const mirroredSourceBb = applyMatrix(localMirror, sourceBb);
  const mirroredSourcePedal = applyMatrix(localMirror, sourcePedal);

  for (const crankLengthMm of [165, 170, 172.5, 175]) {
    const targetPedal = { x: bb.x - crankLengthMm * PIXELS_PER_MM, y: bb.y };
    const placement = orientedSegmentTransform(mirroredSourceBb, mirroredSourcePedal, bb, targetPedal, 0.574);
    const mirrored = composeMatrices(placement, localMirror);
    const mappedBase = applyMatrix(mirrored, sourceBb);
    const mappedPedal = applyMatrix(mirrored, sourcePedal);

    assert.ok(Math.abs(mappedBase.x - bb.x) < 1e-9);
    assert.ok(Math.abs(mappedBase.y - bb.y) < 1e-9);
    assert.ok(Math.abs(mappedPedal.x - targetPedal.x) < 1e-9);
    assert.ok(Math.abs(mappedPedal.y - targetPedal.y) < 1e-9);
    assert.ok(mirrored.a * mirrored.d - mirrored.b * mirrored.c < 0, "non-drive visual transform must remain mirrored");
    assert.ok(Math.abs(Math.hypot(mappedPedal.x - mappedBase.x, mappedPedal.y - mappedBase.y) / PIXELS_PER_MM - crankLengthMm) < 1e-9);
  }
  assert.match(enduranceTemplateSource, /asset=\{components\.crank\.visualResource\} layer=\{components\.crank\.sourceBounds\} transform=\{nonDriveCrankMatrix\}/);
});

test("Figma component connection anchors remain exact for all seven Domane sizes", () => {
  const visualScale = RENDERED_WHEEL_DIAMETER_PX / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width;
  const asset = Object.fromEntries(
    Object.keys(FIGMA_ENDURANCE_TEMPLATE.assetAnchors).map((name) => [
      name,
      resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, name),
    ]),
  );

  for (const size of geometrySizes) {
    const bike = buildBikeGeometry(enduranceGeometrySizes[size], defaultFit);
    const projected = Object.fromEntries(
      Object.entries(bike.anchors).map(([key, point]) => [key, createProjector()(point)]),
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
    const forkAxisDelta = {
      x: projected.frontAxle.x - parent.headBottom.x,
      y: projected.frontAxle.y - parent.headBottom.y,
    };
    const forkAxisLength = Math.hypot(forkAxisDelta.x, forkAxisDelta.y);
    const forkVisualTop = {
      x: parent.headBottom.x + forkAxisDelta.x / forkAxisLength * 6,
      y: parent.headBottom.y + forkAxisDelta.y / forkAxisLength * 6,
    };
    const mappings = [
      {
        sourceStart: asset.seatpostBottom,
        sourceEnd: asset.seatpostTop,
        targetStart: parent.seatpostSocketAnchor,
        targetEnd: seatpostAnchors.seatpostTop,
      },
      {
        sourceStart: asset.forkTop,
        sourceEnd: asset.forkAxle,
        targetStart: forkVisualTop,
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

test("Figma cockpit visuals follow the physical Spacer → Stem → Handlebar chain", () => {
  assert.match(enduranceTemplateSource, /assetAnchors\.spacerHeadtubeAnchor,[\s\S]*assetAnchors\.spacerVisualAxisEnd,[\s\S]*projected\.spacerHeadtubeAnchor,[\s\S]*projected\.spacerTop/);
  assert.match(enduranceTemplateSource, /<ProgrammaticStem start=\{projected\.stemSpacerAnchor\} end=\{projected\.stemHandlebarAnchor\} \/>/);
  assert.match(enduranceTemplateSource, /<rect[\s\S]*x=\{start\.x - PROGRAMMATIC_STEM_LEFT_OVERLAP_PX\}[\s\S]*width=\{length \+ PROGRAMMATIC_STEM_LEFT_OVERLAP_PX\}[\s\S]*rx=\{PROGRAMMATIC_STEM_CORNER_RADIUS_PX\}[\s\S]*ry=\{PROGRAMMATIC_STEM_CORNER_RADIUS_PX\}/);
  assert.doesNotMatch(enduranceTemplateSource, /strokeLinecap="round"|programmatic-capsule/);
  assert.doesNotMatch(enduranceTemplateSource, /stem\.svg|stemMatrix|layers\.stem|assetAnchors\.stem/);
  assert.match(enduranceTemplateSource, /const handlebarMatrix = uniformAroundPoint\([\s\S]*assetAnchors\.handlebarClampAnchor,[\s\S]*projected\.handlebarClampAnchor,[\s\S]*figmaShapeScale/);
  assert.deepEqual(FIGMA_ENDURANCE_TEMPLATE.layers.handlebarHood, { nodeId: "8:9679", x: 1240, y: 289, width: 136.383102, height: 127.999939 });
  assert.deepEqual(FIGMA_ENDURANCE_TEMPLATE.layers.handlebarTape, { nodeId: "8:9665", x: 1221, y: 287, width: 164, height: 162 });
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.handlebar, undefined);
  assert.deepEqual(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.handlebarClampAnchor, { layer: "handlebarHood", x: 19, y: 39.79 });
  assert.match(handlebarHoodSource, /width="136\.383" height="128"[\s\S]*fill="black"/);
  assert.match(handlebarTapeSource, /width="164" height="162"[\s\S]*fill="#D9D9D9"/);
  assert.match(enduranceTemplateSource, /data-handlebar-position-binding="shared-handlebar-matrix"/);
  assert.match(enduranceTemplateSource, /asset=\{handlebarHood\} layer=\{layers\.handlebarHood\} transform=\{handlebarMatrix\}[\s\S]*asset=\{handlebarTapeAsset\} layer=\{layers\.handlebarTape\} transform=\{handlebarMatrix\}/);
  assert.ok(enduranceTemplateSource.indexOf("asset={handlebarHood}") < enduranceTemplateSource.indexOf("asset={handlebarTapeAsset}"));
  assert.doesNotMatch(enduranceTemplateSource, /asset=\{handlebar\}|layers\.handlebar\b/);
  assert.doesNotMatch(enduranceTemplateSource, /assetAnchors\.(stemBase|stemClamp|handlebarClamp)\b/);
  assert.match(enduranceTemplateSource, /totalSpacerStackHeight > 0[\s\S]*asset=\{spacer\}/);
  assert.match(enduranceTemplateSource, /const handlebarContactPoint = applyMatrix\(handlebarMatrix, sourceAnchors\.handlebarAnchor\)/);
  assert.match(enduranceTemplateSource, /<HandlebarContactMarker point=\{handlebarContactPoint\} \/>/);
  assert.doesNotMatch(enduranceTemplateSource, /showFigmaAnchors && <HandlebarContactMarker/);
  assert.ok(enduranceTemplateSource.indexOf('renderLayer="drive-crank"') < enduranceTemplateSource.indexOf('data-render-layer="contact-points"'));
  assert.doesNotMatch(bikeVisualizerSource, /<ContactPoint point=\{data\.contacts\.handlebar\}/);
  assert.match(enduranceTemplateSource, /data-effective-stem-pitch=\{data\.cockpit\.effectiveStemPitch\.toFixed\(1\)\}/);
  assert.match(enduranceTemplateSource, /data-stem-base-displacement-px=\{stemBaseDisplacementPx\.toFixed\(9\)\}/);
  assert.match(enduranceTemplateSource, /data-stem-rendered-length-mm=\{stemRenderedLengthMm\.toFixed\(6\)\}/);
  assert.match(enduranceTemplateSource, /data-handlebar-clamp-error-px=\{handlebarClampErrorPx\.toFixed\(9\)\}/);
  assert.match(bikeVisualizerSource, /<GeometrySkeleton anchors=\{data\.anchors\} cockpit=\{data\.cockpit\}/);
  const skeletonSource = readFileSync(new URL("../src/components/visualizer/GeometrySkeleton.jsx", import.meta.url), "utf8");
  for (const label of ["SpacerHeadtubeAnchor", "SpacerTop", "StemSpacerAnchor", "StemHandlebarAnchor", "HandlebarClampAnchor", "H", "Effective Pitch "]) assert.ok(skeletonSource.includes(label));
});

test("Spacer height maps the complete Cockpit assembly and Figma hood contact together", () => {
  const asset = Object.fromEntries(
    Object.keys(FIGMA_ENDURANCE_TEMPLATE.assetAnchors).map((name) => [
      name,
      resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, name),
    ]),
  );
  const geometry = enduranceGeometrySizes[56];
  const project = createProjector();
  const baseBike = buildBikeGeometry(geometry, {
    ...defaultFit,
    spacer: 0,
    stemLength: 120,
    stemAngle: -12,
  });
  const hoodOffset = getHandlebarContactOffsetMm();
  const visualScale = RENDERED_WHEEL_DIAMETER_PX / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width;

  for (const spacer of [0, 10, 25, 60]) {
    const bike = buildBikeGeometry(geometry, { ...defaultFit, spacer, stemLength: 120, stemAngle: -12 });
    assert.deepEqual(bike.cockpit.spacerBottom, bike.frame.headTop);
    assert.deepEqual(bike.cockpit.spacerTop, bike.cockpit.stemBase);
    assert.deepEqual(bike.cockpit.stemHandlebarAnchor, bike.cockpit.handlebarClampAnchor);
    assert.ok(Math.abs(Math.hypot(
      bike.cockpit.stemHandlebarAnchor.x - bike.cockpit.stemBase.x,
      bike.cockpit.stemHandlebarAnchor.y - bike.cockpit.stemBase.y,
    ) - 120) < 1e-9);
    assert.ok(Math.abs(bike.contacts.handlebar.x - bike.cockpit.handlebarClampAnchor.x - hoodOffset.x) < 1e-9);
    assert.ok(Math.abs(bike.contacts.handlebar.y - bike.cockpit.handlebarClampAnchor.y - hoodOffset.y) < 1e-9);

    const projected = Object.fromEntries(Object.entries(bike.anchors).map(([key, point]) => [key, project(point)]));
    const handlebarMatrix = uniformAroundPoint(asset.handlebarClampAnchor, projected.handlebarClampAnchor, visualScale);
    assert.deepEqual(projected.stemSpacerAnchor, projected.spacerTop);
    const visualHood = applyMatrix(handlebarMatrix, FIGMA_ENDURANCE_TEMPLATE.anchors.handlebarAnchor);
    const expectedHood = project(bike.contacts.handlebar);
    assert.ok(Math.hypot(visualHood.x - expectedHood.x, visualHood.y - expectedHood.y) < 1e-9);

    assert.equal(bike.cockpit.totalSpacerStackHeight, BASE_COCKPIT_STACK_HEIGHT_MM + spacer);
    const spacerMatrix = orientedSegmentTransform(asset.spacerHeadtubeAnchor, asset.spacerVisualAxisEnd, projected.spacerHeadtubeAnchor, projected.spacerTop, visualScale);
    assert.ok(Math.hypot(
      applyMatrix(spacerMatrix, asset.spacerHeadtubeAnchor).x - projected.spacerHeadtubeAnchor.x,
      applyMatrix(spacerMatrix, asset.spacerHeadtubeAnchor).y - projected.spacerHeadtubeAnchor.y,
    ) < 1e-9);
    assert.ok(Math.hypot(
      applyMatrix(spacerMatrix, asset.spacerVisualAxisEnd).x - projected.spacerTop.x,
      applyMatrix(spacerMatrix, asset.spacerVisualAxisEnd).y - projected.spacerTop.y,
    ) < 1e-9);
  }
  assert.deepEqual(baseBike.cockpit.spacerBottom, baseBike.frame.headTop);
});

test("Figma Cockpit keeps Spacer and Handlebar resources while Stem is programmatic", () => {
  assert.deepEqual(FIGMA_ENDURANCE_TEMPLATE.layers.spacer, {
    nodeId: "1:282",
    x: 1148,
    y: 313,
    width: 127,
    height: 106,
  });
  assert.deepEqual(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.spacerHeadtubeAnchor, {
    layer: "spacer",
    nodeId: "4:3786",
    x: 19,
    y: 28,
  });
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.layers.stem, undefined);
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.stemSpacerAnchor, undefined);
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.stemHandlebarAnchor, undefined);
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.stemBase, undefined);
  assert.equal(FIGMA_ENDURANCE_TEMPLATE.assetAnchors.stemClamp, undefined);
  assert.match(spacerVisualSource, /width="127" height="106" viewBox="0 0 127 106"/);
  assert.match(spacerVisualSource, /id="Vector 12"/);
  assert.match(spacerVisualSource, /fill="#4C4C4C"/);
  assert.match(seatpostVisualSource, /fill="#191919"/);
  assert.match(enduranceTemplateSource, /data-stem-visual-source="programmatic-rounded-rect"/);
  assert.match(enduranceTemplateSource, /fill="#191919"[\s\S]*?data-stem-visual-source="programmatic-rounded-rect"/);
  assert.match(enduranceTemplateSource, /const PROGRAMMATIC_STEM_THICKNESS_PX = 18/);
  assert.match(enduranceTemplateSource, /const PROGRAMMATIC_STEM_CORNER_RADIUS_PX = 4/);
  assert.match(enduranceTemplateSource, /const PROGRAMMATIC_STEM_LEFT_OVERLAP_PX = 12/);
  assert.match(enduranceTemplateSource, /data-stem-left-overlap-px=\{PROGRAMMATIC_STEM_LEFT_OVERLAP_PX\}/);
});

test("persistent H stays on the transformed Figma hood anchor across cockpit fit settings", () => {
  const visualScale = RENDERED_WHEEL_DIAMETER_PX / FIGMA_ENDURANCE_TEMPLATE.layers.rearWheel.width;
  const handlebarClampAnchor = resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, "handlebarClampAnchor");
  const project = createProjector();

  for (const stemLength of [60, 90, 120]) {
    for (const stemAngle of [-12, 6, 17]) {
      for (const spacer of [0, 25, 45]) {
        const bike = buildBikeGeometry(enduranceGeometrySizes[56], {
          ...defaultFit,
          stemLength,
          stemAngle,
          spacer,
        });
        const handlebarMatrix = uniformAroundPoint(
          handlebarClampAnchor,
          project(bike.cockpit.handlebarClampAnchor),
          visualScale,
        );
        const visualHood = applyMatrix(handlebarMatrix, FIGMA_ENDURANCE_TEMPLATE.anchors.handlebarAnchor);
        const expectedHood = project(bike.contacts.handlebar);
        assert.ok(Math.hypot(visualHood.x - expectedHood.x, visualHood.y - expectedHood.y) < 1e-9);
      }
    }
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
