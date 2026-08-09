import {
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "../data/bikes.js";
import { importGeometryToSizeData } from "./geometryImportState.js";

export const ACTIVE_BIKES = Object.freeze(["a", "b"]);

const GEOMETRY_TO_SIZE_DATA_KEY = Object.freeze({
  seatTube: "seatTubeLengthMm",
  seatAngle: "seatTubeAngleDeg",
  headTube: "headTubeLengthMm",
  headAngle: "headTubeAngleDeg",
  effectiveTopTube: "effectiveTopTubeMm",
  bbDrop: "bbDropMm",
  chainstay: "chainstayMm",
  forkRake: "forkOffsetMm",
  trail: "trailMm",
  wheelbase: "wheelbaseMm",
  standover: "standoverMm",
  reach: "reachMm",
  stack: "stackMm",
});

function splitBikeColors(componentSetup) {
  const {
    frameColor,
    forkColor,
    ...remainingComponentSetup
  } = componentSetup;

  return {
    frameColor,
    forkColor,
    componentSetup: remainingComponentSetup,
  };
}

export function createComparisonBike(id, setup, size = trekDomane.visualBaseSize) {
  const sizeData = { ...getTrekDomaneSize(size) };
  const geometryBySize = Object.fromEntries(
    trekDomane.sizes.map((geometry) => [geometry.size, { ...geometry }]),
  );
  const colorsAndComponents = splitBikeColors({ ...setup.componentSetup });

  return {
    id,
    source: "preset",
    brand: trekDomane.brand.toUpperCase(),
    model: trekDomane.model,
    category: "endurance",
    categoryLabel: trekDomane.categoryLabel,
    sourceLabel: "官方几何数据",
    isPreset: true,
    sizes: trekDomane.sizes.map(({ size: bikeSize }) => bikeSize),
    geometryBySize,
    size: String(size),
    sizeData,
    geometry: { ...toBikeGeometry(sizeData) },
    frameColor: colorsAndComponents.frameColor,
    forkColor: colorsAndComponents.forkColor,
    fitSetup: { ...setup.fitSetup },
    componentSetup: { ...colorsAndComponents.componentSetup },
  };
}

export function updateBikeSize(bike, size) {
  const sizeData = bike.geometryBySize?.[String(size)] ?? getTrekDomaneSize(size);
  if (!sizeData) return bike;

  const clonedSizeData = { ...sizeData };
  return {
    ...bike,
    size: String(size),
    sizeData: clonedSizeData,
    geometry: { ...toBikeGeometry(clonedSizeData) },
  };
}

export function createBikeFromGeometryImport(currentBike, draft, geometryImage = currentBike.geometryImage ?? null) {
  const geometryBySize = Object.fromEntries(
    Object.entries(draft.sizes).map(([size, geometry]) => [
      String(size),
      importGeometryToSizeData(size, geometry),
    ]),
  );
  const sizes = Object.keys(geometryBySize);
  const selectedSize = geometryBySize[draft.selectedSize] ? draft.selectedSize : sizes[0];
  const sizeData = { ...geometryBySize[selectedSize] };

  return {
    ...currentBike,
    source: "upload",
    geometryImage,
    brand: draft.brand.trim(),
    model: draft.model.trim() || "未命名车型",
    category: "endurance",
    categoryLabel: "耐力型",
    sourceLabel: "导入几何数据",
    isPreset: false,
    sizes,
    geometryBySize,
    size: String(selectedSize),
    sizeData,
    geometry: { ...toBikeGeometry(sizeData) },
  };
}

export function updateBikeGeometry(bike, geometryPatch) {
  const validPatch = Object.fromEntries(Object.entries(geometryPatch).filter(([key, value]) => (
    Object.hasOwn(bike.geometry, key) && typeof value === "number" && Number.isFinite(value)
  )));
  const sizeDataPatch = Object.fromEntries(Object.entries(validPatch).flatMap(([key, value]) => {
    const sizeDataKey = GEOMETRY_TO_SIZE_DATA_KEY[key];
    return sizeDataKey ? [[sizeDataKey, value]] : [];
  }));

  return {
    ...bike,
    geometry: { ...bike.geometry, ...validPatch },
    sizeData: { ...bike.sizeData, ...sizeDataPatch },
  };
}

export function getRenderableComponentSetup(bike) {
  return {
    ...bike.componentSetup,
    frameColor: bike.frameColor,
    forkColor: bike.forkColor,
  };
}

export function getPersistableBikeSetup(bike) {
  return {
    fitSetup: { ...bike.fitSetup },
    componentSetup: getRenderableComponentSetup(bike),
  };
}
