import { DEFAULT_BIKE_COLORS, normalizeBikeColor } from "./colorPresets.js";

const wheelLow = new URL("../assets/bikeComponents/wheel/low.svg", import.meta.url).href;
const wheelLowInner = new URL("../assets/bikeComponents/wheel/low-inner.svg", import.meta.url).href;
const wheelMid = new URL("../assets/bikeComponents/wheel/mid.svg", import.meta.url).href;
const wheelMidInner = new URL("../assets/bikeComponents/wheel/mid-inner.svg", import.meta.url).href;
const wheelDeep = new URL("../assets/bikeComponents/wheel/deep.svg", import.meta.url).href;
const wheelDeepInner = new URL("../assets/bikeComponents/wheel/deep-inner.svg", import.meta.url).href;
const wheelDisc = new URL("../assets/bikeComponents/wheel/disc.svg", import.meta.url).href;
const wheelDiscMask = new URL("../assets/bikeComponents/wheel/disc-mask.svg", import.meta.url).href;
const wheelDiscInner = new URL("../assets/bikeComponents/wheel/disc-inner.svg", import.meta.url).href;
const wheelWave = new URL("../assets/bikeComponents/wheel/wave.svg", import.meta.url).href;
const wheelWaveInner = new URL("../assets/bikeComponents/wheel/wave-inner.svg", import.meta.url).href;
const wheelTriSpoke = new URL("../assets/bikeComponents/wheel/trispoke.svg", import.meta.url).href;
const wheelTriSpokeInner = new URL("../assets/bikeComponents/wheel/trispoke-inner.svg", import.meta.url).href;
const tireRoadBlack = new URL("../assets/bikeComponents/tire/road-black.svg", import.meta.url).href;
const tireRoadTan = new URL("../assets/bikeComponents/tire/road-tan.svg", import.meta.url).href;
const tireRoadTanOverlay = new URL("../assets/bikeComponents/tire/road-tan-overlay.svg", import.meta.url).href;
const tireTreadBlack = new URL("../assets/bikeComponents/tire/tread-black.svg", import.meta.url).href;
const tireTreadTan = new URL("../assets/bikeComponents/tire/tread-tan.svg", import.meta.url).href;
const tireTreadTanOverlay = new URL("../assets/bikeComponents/tire/tread-tan-overlay.svg", import.meta.url).href;
const chainringDefault = new URL("../assets/bikeComponents/chainring/default.svg", import.meta.url).href;
const chainringPq = new URL("../assets/bikeComponents/chainring/pq.svg", import.meta.url).href;
const chainringCyber = new URL("../assets/bikeComponents/chainring/cyber.svg", import.meta.url).href;
const chainringSram = new URL("../assets/bikeComponents/chainring/sram.svg", import.meta.url).href;
const crankDefault = new URL("../assets/bikeComponents/crank/default.svg", import.meta.url).href;
const crankRed = new URL("../assets/bikeComponents/crank/red.svg", import.meta.url).href;
const crankShimano105 = new URL("../assets/bikeComponents/crank/shimano-105.svg", import.meta.url).href;
const drivetrainShimano = new URL("../assets/bikeComponents/drivetrain/shimano.svg", import.meta.url).href;
const drivetrainSram = new URL("../assets/bikeComponents/drivetrain/sram.svg", import.meta.url).href;
const cassetteDefaultRing1 = new URL("../assets/bikeComponents/cassette/default-ring-1.svg", import.meta.url).href;
const cassetteDefaultRing2 = new URL("../assets/bikeComponents/cassette/default-ring-2.svg", import.meta.url).href;
const cassetteDefaultRing3 = new URL("../assets/bikeComponents/cassette/default-ring-3.svg", import.meta.url).href;
const cassetteDefaultRing4 = new URL("../assets/bikeComponents/cassette/default-ring-4.svg", import.meta.url).href;
const cassetteDefaultRing5 = new URL("../assets/bikeComponents/cassette/default-ring-5.svg", import.meta.url).href;
const cassetteDefaultRing6 = new URL("../assets/bikeComponents/cassette/default-ring-6.svg", import.meta.url).href;
const cassetteDefaultHub = new URL("../assets/bikeComponents/cassette/default-hub.svg", import.meta.url).href;
const cassetteSramHub = new URL("../assets/bikeComponents/cassette/sram-hub.svg", import.meta.url).href;
const cassetteSramRing1 = new URL("../assets/bikeComponents/cassette/sram-ring-1.svg", import.meta.url).href;
const cassetteSramRing2 = new URL("../assets/bikeComponents/cassette/sram-ring-2.svg", import.meta.url).href;
const cassetteSramRing3 = new URL("../assets/bikeComponents/cassette/sram-ring-3.svg", import.meta.url).href;
const cassetteSramRing4 = new URL("../assets/bikeComponents/cassette/sram-ring-4.svg", import.meta.url).href;
const cassetteSramRing5 = new URL("../assets/bikeComponents/cassette/sram-ring-5.svg", import.meta.url).href;
const cassetteSramRing6 = new URL("../assets/bikeComponents/cassette/sram-ring-6.svg", import.meta.url).href;
const cassetteSramLockring = new URL("../assets/bikeComponents/cassette/sram-lockring.svg", import.meta.url).href;

const WHEEL_CENTER_ANCHOR = Object.freeze({ x: 240, y: 240 });
const CASSETTE_CENTER_ANCHOR = Object.freeze({ x: 50, y: 50 });
const BOTTOM_BRACKET_ANCHOR = "bottomBracket";
const REAR_AXLE_ANCHOR = "rearAxle";

export const FIGMA_WHEEL_RESOURCE_GROUP = Object.freeze({
  fileKey: "CbX0nYfNc7VtHgtSkHZdYS",
  nodeId: "4:1035",
  name: "轮组类型",
});

const visualLayer = (visualResource, x, y, width, height, figmaNodeId) => Object.freeze({
  visualResource,
  sourceBounds: Object.freeze({ x, y, width, height }),
  figmaNodeId,
});

const shapeLayer = (shape, x, y, width, height, figmaNodeId) => Object.freeze({
  shape: Object.freeze(shape),
  sourceBounds: Object.freeze({ x, y, width, height }),
  figmaNodeId,
});

function freezeResources(resources) {
  return Object.freeze(resources.map((resource) => Object.freeze(resource)));
}

export const BikeComponents = Object.freeze({
  Wheel: freezeResources([
    {
      id: "lowProfile",
      name: "低框轮组",
      wheelSize: "700c",
      visualResource: wheelLow,
      visualLayers: Object.freeze([
        visualLayer(wheelLow, 0, 0, 480, 480, "2:934"),
        visualLayer(wheelLowInner, 28, 28, 424, 424, "4:8217"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=低框轮组",
      figmaNodeId: "4:1034",
    },
    {
      id: "midProfile",
      name: "中框轮组",
      wheelSize: "700c",
      visualResource: wheelMid,
      visualLayers: Object.freeze([
        visualLayer(wheelMid, 0, 0, 480, 480, "2:981"),
        visualLayer(wheelMidInner, 45, 45, 390, 390, "4:8232"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=中框轮组",
      figmaNodeId: "4:1033",
    },
    {
      id: "deepProfile",
      name: "高框轮组",
      wheelSize: "700c",
      visualResource: wheelDeep,
      visualLayers: Object.freeze([
        visualLayer(wheelDeep, 0, 0, 480, 480, "2:996"),
        visualLayer(wheelDeepInner, 53, 53, 374, 374, "4:8236"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=高框轮组",
      figmaNodeId: "4:1032",
    },
    {
      id: "discWheel",
      name: "封闭轮",
      wheelSize: "700c",
      visualResource: wheelDisc,
      visualLayers: Object.freeze([
        visualLayer(wheelDisc, 0, 0, 480, 480, "4:1891"),
        shapeLayer({ type: "rect", fill: "#000000", radius: 14 }, 215, 39, 50, 58, "4:3013"),
        shapeLayer({ type: "rect", fill: "#7d7d7d", radius: 2 }, 238, 41, 4, 31, "4:3017"),
        shapeLayer({ type: "rect", fill: "#d9d9d9", radius: 1 }, 235, 39, 10, 4, "4:3015"),
        visualLayer(wheelDiscMask, 0, 0, 480, 480, "4:3374"),
        visualLayer(wheelDiscInner, 103, 103, 274, 274, "4:8240"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=封闭轮",
      figmaNodeId: "4:1889",
    },
    {
      id: "waveWheel",
      name: "波浪轮",
      wheelSize: "700c",
      visualResource: wheelWave,
      visualLayers: Object.freeze([
        visualLayer(wheelWave, 0, 0, 480, 480, "4:2288"),
        visualLayer(wheelWaveInner, 35.2435, 35.2435, 409.513, 409.514, "4:8247"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=波浪轮",
      figmaNodeId: "4:2285",
    },
    {
      id: "triSpokeWheel",
      name: "三刀轮",
      wheelSize: "700c",
      visualResource: wheelTriSpoke,
      visualLayers: Object.freeze([
        visualLayer(wheelTriSpoke, 0, 0, 480, 480, "4:2304"),
        visualLayer(wheelTriSpokeInner, 0, 0, 480, 480, "4:8258"),
      ]),
      wheelCenterAnchor: WHEEL_CENTER_ANCHOR,
      figmaComponentName: "Property 1=三刀轮",
      figmaNodeId: "4:2293",
    },
  ]),
  Tire: freezeResources([
    { id: "roadBlack", name: "公路胎 · 黑边", visualResource: tireRoadBlack, wheelCenterAnchor: WHEEL_CENTER_ANCHOR, figmaNodeId: "4:1056" },
    { id: "roadTan", name: "公路胎 · 黄边", visualLayers: Object.freeze([
      Object.freeze({ visualResource: tireRoadTan, sourceBounds: Object.freeze({ x: 0, y: 0, width: 480, height: 480 }) }),
      Object.freeze({ visualResource: tireRoadTanOverlay, sourceBounds: Object.freeze({ x: 0, y: 0, width: 480, height: 480 }) }),
    ]), wheelCenterAnchor: WHEEL_CENTER_ANCHOR, figmaNodeId: "4:1055" },
    { id: "treadBlack", name: "齿胎 · 黑边", visualResource: tireTreadBlack, wheelCenterAnchor: WHEEL_CENTER_ANCHOR, figmaNodeId: "4:1054" },
    { id: "treadTan", name: "齿胎 · 黄边", visualLayers: Object.freeze([
      Object.freeze({ visualResource: tireTreadTan, sourceBounds: Object.freeze({ x: 6, y: 6, width: 468, height: 468 }) }),
      Object.freeze({ visualResource: tireTreadTanOverlay, sourceBounds: Object.freeze({ x: 0, y: 0, width: 479.996, height: 479.993 }) }),
    ]), wheelCenterAnchor: WHEEL_CENTER_ANCHOR, figmaNodeId: "4:1053" },
  ]),
  Chainring: freezeResources([
    { id: "default", name: "Shimano盘片", visualResource: chainringDefault, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 75, y: 75 }), sourceBounds: Object.freeze({ x: 805, y: 713, width: 150, height: 150 }), figmaNodeId: "4:1985" },
    { id: "pq", name: "PQ盘片", visualResource: chainringPq, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 75, y: 75 }), sourceBounds: Object.freeze({ x: 805, y: 713, width: 150, height: 150 }), figmaNodeId: "4:1987" },
    { id: "cyber", name: "赛博盘片", visualResource: chainringCyber, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 75, y: 75 }), sourceBounds: Object.freeze({ x: 805, y: 713, width: 150, height: 150 }), figmaNodeId: "4:4436" },
    { id: "sram", name: "SRAM盘片", visualResource: chainringSram, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 75, y: 75 }), sourceBounds: Object.freeze({ x: 805, y: 713, width: 150, height: 150 }), figmaNodeId: "4:2008" },
  ]),
  Crank: freezeResources([
    { id: "shimano105", name: "Shimano曲柄", visualResource: crankShimano105, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 60, y: 40 }), pedalAnchor: Object.freeze({ x: 184, y: 40 }), sourceBounds: Object.freeze({ x: 820, y: 748, width: 200, height: 80 }), figmaNodeId: "4:1936" },
    { id: "red", name: "RED曲柄", visualResource: crankRed, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 60, y: 40 }), pedalAnchor: Object.freeze({ x: 184, y: 40 }), sourceBounds: Object.freeze({ x: 820, y: 748, width: 200, height: 80 }), figmaNodeId: "4:4122" },
    { id: "default", name: "三方碳曲柄", visualResource: crankDefault, placementAnchor: BOTTOM_BRACKET_ANCHOR, visualAnchor: Object.freeze({ x: 60, y: 40 }), pedalAnchor: Object.freeze({ x: 184, y: 40 }), sourceBounds: Object.freeze({ x: 820, y: 748, width: 200, height: 80 }), figmaNodeId: "4:1933" },
  ]),
  Drivetrain: freezeResources([
    { id: "shimano", name: "Shimano后拨", visualResource: drivetrainShimano, placementAnchor: REAR_AXLE_ANCHOR, visualAnchor: Object.freeze({ x: 53, y: -14 }), sourceBounds: Object.freeze({ x: 525, y: 746, width: 80, height: 110 }), figmaNodeId: "4:1893" },
    { id: "sram", name: "SRAM后拨", visualResource: drivetrainSram, placementAnchor: REAR_AXLE_ANCHOR, visualAnchor: Object.freeze({ x: 53, y: -14 }), sourceBounds: Object.freeze({ x: 525, y: 746, width: 80, height: 110 }), figmaNodeId: "4:1915" },
  ]),
  Cassette: freezeResources([
    {
      id: "default",
      name: "Shimano飞轮",
      placementAnchor: REAR_AXLE_ANCHOR,
      visualAnchor: CASSETTE_CENTER_ANCHOR,
      sourceBounds: Object.freeze({ x: 0, y: 0, width: 100, height: 100 }),
      visualLayers: Object.freeze([
        visualLayer(cassetteDefaultRing1, 11, 11, 78, 78, "4:2634"),
        visualLayer(cassetteDefaultRing2, 16, 16, 68, 68, "4:2637"),
        visualLayer(cassetteDefaultRing3, 22, 22, 56, 56, "4:2640"),
        visualLayer(cassetteDefaultRing4, 28, 28, 44, 44, "4:2643"),
        visualLayer(cassetteDefaultRing5, 34.12, 34, 31.768, 32, "4:2646"),
        visualLayer(cassetteDefaultRing6, 39.08, 39, 21.84, 22, "4:2649"),
        visualLayer(cassetteDefaultHub, 46, 46, 8, 8, "4:2652"),
      ]),
      figmaNodeId: "4:2653",
    },
    {
      id: "sram",
      name: "速联飞轮",
      placementAnchor: REAR_AXLE_ANCHOR,
      visualAnchor: CASSETTE_CENTER_ANCHOR,
      sourceBounds: Object.freeze({ x: 0, y: 0, width: 100, height: 100 }),
      visualLayers: Object.freeze([
        visualLayer(cassetteSramHub, 24, 24, 52, 52, "4:2896"),
        visualLayer(cassetteSramRing1, 0.42, 0.42, 99.162, 99.162, "4:3549"),
        visualLayer(cassetteSramRing2, 4, 4, 92, 92, "4:3555"),
        visualLayer(cassetteSramRing3, 8.42, 8.42, 83.162, 83.162, "4:2679"),
        visualLayer(cassetteSramRing4, 12, 12, 76, 76, "4:3645"),
        visualLayer(cassetteSramRing5, 17, 17, 66, 66, "4:2817"),
        visualLayer(cassetteSramRing6, 16.18, 16.18, 67.649, 67.649, "4:2682"),
        visualLayer(cassetteSramLockring, 22, 22, 56, 56, "4:2862"),
      ]),
      figmaNodeId: "4:2677",
    },
  ]),
});

export const DEFAULT_COMPONENT_SETUP = Object.freeze({
  frontWheelId: "lowProfile",
  rearWheelId: "midProfile",
  linkWheelSelection: false,
  tireId: "roadTan",
  chainringVisualId: "sram",
  crankVisualId: "red",
  cassetteId: "sram",
  drivetrainVisualId: "sram",
  ...DEFAULT_BIKE_COLORS,
});

function resourceById(resources, id, fallbackId) {
  return resources.find((resource) => resource.id === id)
    ?? resources.find((resource) => resource.id === fallbackId)
    ?? resources[0];
}

export function updateWheelSelection(componentSetup, side, wheelId) {
  const wheelKey = side === "rear" ? "rearWheelId" : "frontWheelId";
  if (!componentSetup.linkWheelSelection) {
    return { ...componentSetup, [wheelKey]: wheelId };
  }
  return { ...componentSetup, frontWheelId: wheelId, rearWheelId: wheelId };
}

export function updateWheelSelectionLink(componentSetup, linkWheelSelection) {
  return { ...componentSetup, linkWheelSelection: Boolean(linkWheelSelection) };
}

export function resolveComponentSetup(componentSetup) {
  const frontWheel = resourceById(BikeComponents.Wheel, componentSetup.frontWheelId, DEFAULT_COMPONENT_SETUP.frontWheelId);
  const rearWheel = resourceById(BikeComponents.Wheel, componentSetup.rearWheelId, DEFAULT_COMPONENT_SETUP.rearWheelId);
  const tire = resourceById(BikeComponents.Tire, componentSetup.tireId, DEFAULT_COMPONENT_SETUP.tireId);
  const chainring = resourceById(BikeComponents.Chainring, componentSetup.chainringVisualId, DEFAULT_COMPONENT_SETUP.chainringVisualId);
  const crank = resourceById(BikeComponents.Crank, componentSetup.crankVisualId, DEFAULT_COMPONENT_SETUP.crankVisualId);
  const cassette = resourceById(BikeComponents.Cassette, componentSetup.cassetteId, DEFAULT_COMPONENT_SETUP.cassetteId);
  const drivetrain = resourceById(BikeComponents.Drivetrain, componentSetup.drivetrainVisualId, DEFAULT_COMPONENT_SETUP.drivetrainVisualId);
  return Object.freeze({
    frontWheel,
    rearWheel,
    tire,
    chainring,
    crank,
    cassette,
    drivetrain,
    frameColor: normalizeBikeColor(componentSetup.frameColor, DEFAULT_COMPONENT_SETUP.frameColor),
    forkColor: normalizeBikeColor(componentSetup.forkColor, DEFAULT_COMPONENT_SETUP.forkColor),
    barTapeColor: normalizeBikeColor(componentSetup.barTapeColor, DEFAULT_COMPONENT_SETUP.barTapeColor),
  });
}

export { CASSETTE_CENTER_ANCHOR, WHEEL_CENTER_ANCHOR };
