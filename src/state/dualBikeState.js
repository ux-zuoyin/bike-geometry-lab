import {
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "../data/bikes.js";
import { getSelectedImportSizes, importGeometryToSizeData } from "./geometryImportState.js";

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
  const sizeData = bike.geometryBySize?.[String(size)] ?? (bike.source === "preset" ? getTrekDomaneSize(size) : null);
  if (!sizeData) return bike;

  const clonedSizeData = { ...sizeData };
  return {
    ...bike,
    size: String(size),
    sizeData: clonedSizeData,
    geometry: { ...toBikeGeometry(clonedSizeData) },
    geometrySources: clonedSizeData.geometrySources ? { ...clonedSizeData.geometrySources } : undefined,
    geometryCompleteness: clonedSizeData.geometryCompleteness ?? undefined,
  };
}

export function createBikeFromGeometryImport(currentBike, draft, geometryImage = currentBike.geometryImage ?? null) {
  const selectedImportSizes = getSelectedImportSizes(draft);
  const geometryBySize = Object.fromEntries(
    selectedImportSizes.map((size) => [
      String(size),
      importGeometryToSizeData(size, draft.sizes?.[size] ?? draft.candidateSizes?.[size]),
    ]),
  );
  const sizes = [...selectedImportSizes];
  const selectedSize = geometryBySize[draft.selectedSize] ? draft.selectedSize : sizes[0];
  const sizeData = { ...geometryBySize[selectedSize] };

  return {
    ...currentBike,
    source: "upload",
    geometryImage,
    importSource: {
      detectedSizes: [...(draft.detectedSizes ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}))],
      detectedSizeCount: draft.detectedSizeCount ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}).length,
      selectedImportSizes: [...selectedImportSizes],
      candidateSizes: Object.fromEntries(Object.entries(draft.candidateSizes ?? draft.sizes ?? {}).map(([size, geometry]) => [size, { ...geometry }])),
      rawRows: (draft.rawRows ?? []).map((row) => ({ ...row, values: [...(row.values ?? [])] })),
      parserWarnings: [...(draft.allParserWarnings ?? draft.parserWarnings ?? [])],
      unrecognizedFields: (draft.unrecognizedFields ?? []).map((field) => ({ ...field, values: [...(field.values ?? [])] })),
      parserMeta: draft.parserMeta ? { ...draft.parserMeta } : null,
    },
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
    geometrySources: sizeData.geometrySources ? { ...sizeData.geometrySources } : {},
    geometryCompleteness: sizeData.geometryCompleteness ?? "exact",
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
