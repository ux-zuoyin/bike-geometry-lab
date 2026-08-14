import {
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "../data/bikes.js";
import { getSelectedImportSizes, importGeometryToSizeData } from "./geometryImportState.js";
import {
  DEFAULT_ENDURANCE_SEAT_STAY_STYLE,
  ENDURANCE_SEAT_STAY_STYLES,
  normalizeEnduranceSeatStayStyle,
} from "../config/framePresets/endurance.js";
import {
  getBikeCategoryLabel,
  normalizeBikeCategory,
} from "../config/bikeArchetypes.js";
import { sortBikeSizes } from "../lib/geometry/sizeSorting.js";
import {
  PRESET_EXPERIENCE_IDS,
  getPresetExperienceDefinition,
} from "../data/presetExperience.js";

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
    category: normalizeBikeCategory(trekDomane.category),
    categoryLabel: trekDomane.categoryLabel,
    seatStayStyle: DEFAULT_ENDURANCE_SEAT_STAY_STYLE,
    sourceLabel: "官方几何数据",
    isPreset: true,
    sizes: sortBikeSizes(trekDomane.sizes.map(({ size: bikeSize }) => bikeSize)),
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

export function createPresetExperienceBike(presetId, setup, instanceId = `preset-experience-${presetId}`) {
  const definition = getPresetExperienceDefinition(presetId);
  const geometryBySize = Object.fromEntries(
    definition.sizes.map((geometry) => [geometry.size, { ...geometry }]),
  );
  const size = geometryBySize[definition.visualBaseSize]
    ? definition.visualBaseSize
    : definition.sizes[0].size;
  const sizeData = { ...geometryBySize[size] };
  const colorsAndComponents = splitBikeColors({ ...setup.componentSetup });
  const category = normalizeBikeCategory(definition.category);

  return {
    id: instanceId,
    presetExperienceId: definition.id,
    source: "preset",
    brand: definition.brand,
    model: definition.model,
    category,
    categoryLabel: getBikeCategoryLabel(category),
    seatStayStyle: DEFAULT_ENDURANCE_SEAT_STAY_STYLE,
    sourceLabel: "官方几何数据",
    sourceUrl: definition.sourceUrl,
    isPreset: true,
    sizes: sortBikeSizes(definition.sizes.map(({ size: bikeSize }) => bikeSize)),
    geometryBySize,
    size,
    sizeData,
    geometry: { ...toBikeGeometry(sizeData) },
    frameColor: colorsAndComponents.frameColor,
    forkColor: colorsAndComponents.forkColor,
    fitSetup: { ...setup.fitSetup },
    componentSetup: { ...colorsAndComponents.componentSetup },
  };
}

export function createPresetExperiencePack(setup) {
  return Object.fromEntries(PRESET_EXPERIENCE_IDS.map((presetId) => [
    presetId,
    createPresetExperienceBike(presetId, setup),
  ]));
}

export function instantiatePresetExperienceBike(presetBike, id) {
  if (!presetBike) return null;
  const geometryBySize = Object.fromEntries(
    Object.entries(presetBike.geometryBySize ?? {}).map(([size, geometry]) => [size, { ...geometry }]),
  );
  const sizeData = { ...(geometryBySize[presetBike.size] ?? presetBike.sizeData) };

  return {
    ...presetBike,
    id,
    source: "preset",
    geometryBySize,
    sizes: [...presetBike.sizes],
    sizeData,
    geometry: { ...toBikeGeometry(sizeData) },
    fitSetup: { ...presetBike.fitSetup },
    componentSetup: { ...presetBike.componentSetup },
  };
}

export function updateBikeSeatStayStyle(bike, seatStayStyle) {
  if (!bike || !ENDURANCE_SEAT_STAY_STYLES.includes(seatStayStyle)) return bike;
  return { ...bike, seatStayStyle: normalizeEnduranceSeatStayStyle(seatStayStyle) };
}

export function updateBikeSize(bike, size) {
  const sizeData = bike.geometryBySize?.[String(size)] ?? null;
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
  const geometryValueSource = draft.geometryValueSource === "manual" ? "manual" : "official";
  const geometryBySize = Object.fromEntries(
    selectedImportSizes.map((size) => [
      String(size),
      importGeometryToSizeData(size, draft.sizes?.[size] ?? draft.candidateSizes?.[size], geometryValueSource),
    ]),
  );
  const sizes = sortBikeSizes(selectedImportSizes, {
    sourceOrder: draft.detectedSizes ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}),
  });
  const selectedSize = geometryBySize[draft.selectedSize] ? draft.selectedSize : sizes[0];
  const sizeData = { ...geometryBySize[selectedSize] };
  const category = normalizeBikeCategory(draft.category);

  return {
    ...currentBike,
    source: "upload",
    geometryImage,
    importSource: {
      entryMode: draft.entryMode ?? "ai",
      geometryValueSource,
      detectedSizes: [...(draft.detectedSizes ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}))],
      detectedSizeCount: draft.detectedSizeCount ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}).length,
      selectedImportSizes: [...selectedImportSizes],
      candidateSizes: Object.fromEntries(Object.entries(draft.candidateSizes ?? draft.sizes ?? {}).map(([size, geometry]) => [size, { ...geometry }])),
      rawRows: (draft.rawRows ?? []).map((row) => ({ ...row, values: [...(row.values ?? [])] })),
      parserWarnings: [...(draft.allParserWarnings ?? draft.parserWarnings ?? [])],
      unrecognizedFields: (draft.unrecognizedFields ?? []).map((field) => ({ ...field, values: [...(field.values ?? [])] })),
      parserMeta: draft.parserMeta ? { ...draft.parserMeta } : null,
      measurementContext: draft.measurementContext ? { ...draft.measurementContext, evidence: [...(draft.measurementContext.evidence ?? [])] } : null,
      unitDiagnostics: draft.unitDiagnostics ? {
        ...draft.unitDiagnostics,
        evidence: [...(draft.unitDiagnostics.evidence ?? [])],
        fields: Object.fromEntries(Object.entries(draft.unitDiagnostics.fields ?? {}).map(([field, diagnostic]) => [field, {
          ...diagnostic,
          values: [...(diagnostic.values ?? [])],
        }])),
      } : null,
    },
    brand: draft.brand.trim(),
    model: draft.model.trim() || "未命名车型",
    category,
    categoryLabel: getBikeCategoryLabel(category),
    sourceLabel: draft.entryMode === "manual" ? "手动几何数据" : "导入几何数据",
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
