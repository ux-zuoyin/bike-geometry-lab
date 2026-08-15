import { trekDomane } from "../data/bikes.js";
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
import {
  createStructuredGeometrySizeData,
  toRendererGeometry,
} from "../lib/geometry/renderGeometryResolver.js";

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

const GEOMETRY_TO_CANONICAL_KEY = Object.freeze({
  seatTube: "seatTubeLength",
  seatAngle: "seatTubeAngle",
  headTube: "headTubeLength",
  headAngle: "headTubeAngle",
  effectiveTopTube: "effectiveTopTube",
  bbDrop: "bbDrop",
  chainstay: "chainstay",
  forkRake: "forkOffset",
  wheelbase: "wheelbase",
  reach: "reach",
  stack: "stack",
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

function cloneSizeData(sizeData) {
  const completeness = sizeData.completeness ? {
    core: { ...sizeData.completeness.core },
    precision: { ...sizeData.completeness.precision },
    renderable: sizeData.completeness.renderable,
  } : undefined;
  return {
    ...sizeData,
    officialGeometry: { ...(sizeData.officialGeometry ?? {}) },
    valueSources: { ...(sizeData.valueSources ?? {}) },
    renderGeometry: { ...(sizeData.renderGeometry ?? {}) },
    renderSources: { ...(sizeData.renderSources ?? {}) },
    extendedGeometry: { ...(sizeData.extendedGeometry ?? {}) },
    rawRows: (sizeData.rawRows ?? []).map((row) => ({ ...row, values: [...(row.values ?? [])] })),
    geometrySources: { ...(sizeData.renderSources ?? sizeData.geometrySources ?? {}) },
    geometrySourceCounts: { ...(sizeData.geometrySourceCounts ?? {}) },
    completeness,
    renderGeometryFidelity: sizeData.renderGeometryFidelity,
  };
}

function structureGeometryBySize(entries, category, valueSource = "official") {
  return Object.fromEntries(entries.map((sizeData) => [
    String(sizeData.size),
    createStructuredGeometrySizeData(sizeData, { category, valueSource }),
  ]));
}

function activeGeometryState(sizeData) {
  const officialGeometry = { ...(sizeData.officialGeometry ?? {}) };
  const valueSources = { ...(sizeData.valueSources ?? {}) };
  const renderGeometry = { ...(sizeData.renderGeometry ?? {}) };
  const renderSources = { ...(sizeData.renderSources ?? {}) };
  const extendedGeometry = { ...(sizeData.extendedGeometry ?? {}) };
  const geometry = toRendererGeometry(renderGeometry);

  geometry.trail = extendedGeometry.trail ?? null;
  geometry.standover = extendedGeometry.standover ?? null;
  return {
    officialGeometry,
    valueSources,
    renderGeometry,
    renderSources,
    extendedGeometry,
    // Legacy compact alias. Renderer entry points use renderGeometry directly.
    geometry,
    geometrySources: { ...renderSources },
    geometryCompleteness: sizeData.completeness,
    renderGeometryFidelity: sizeData.renderGeometryFidelity,
    completeness: sizeData.completeness ? {
      core: { ...sizeData.completeness.core },
      precision: { ...sizeData.completeness.precision },
      renderable: sizeData.completeness.renderable,
    } : undefined,
  };
}

export function createComparisonBike(id, setup, size = trekDomane.visualBaseSize) {
  const category = normalizeBikeCategory(trekDomane.category);
  const geometryBySize = structureGeometryBySize(trekDomane.sizes, category);
  const sizeData = cloneSizeData(geometryBySize[String(size)] ?? geometryBySize[trekDomane.visualBaseSize]);
  const colorsAndComponents = splitBikeColors({ ...setup.componentSetup });

  return {
    id,
    source: "preset",
    brand: trekDomane.brand.toUpperCase(),
    model: trekDomane.model,
    category,
    categoryLabel: trekDomane.categoryLabel,
    seatStayStyle: DEFAULT_ENDURANCE_SEAT_STAY_STYLE,
    sourceLabel: "官方几何数据",
    isPreset: true,
    sizes: sortBikeSizes(trekDomane.sizes.map(({ size: bikeSize }) => bikeSize)),
    geometryBySize,
    size: String(size),
    sizeData,
    ...activeGeometryState(sizeData),
    frameColor: colorsAndComponents.frameColor,
    forkColor: colorsAndComponents.forkColor,
    fitSetup: { ...setup.fitSetup },
    componentSetup: { ...colorsAndComponents.componentSetup },
  };
}

export function createPresetExperienceBike(presetId, setup, instanceId = `preset-experience-${presetId}`) {
  const definition = getPresetExperienceDefinition(presetId);
  const category = normalizeBikeCategory(definition.category);
  const geometryBySize = structureGeometryBySize(definition.sizes, category);
  const size = geometryBySize[definition.visualBaseSize]
    ? definition.visualBaseSize
    : definition.sizes[0].size;
  const sizeData = cloneSizeData(geometryBySize[size]);
  const colorsAndComponents = splitBikeColors({ ...setup.componentSetup });

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
    ...activeGeometryState(sizeData),
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
    Object.entries(presetBike.geometryBySize ?? {}).map(([size, geometry]) => [size, cloneSizeData(geometry)]),
  );
  const sizeData = cloneSizeData(geometryBySize[presetBike.size] ?? presetBike.sizeData);

  return {
    ...presetBike,
    id,
    source: "preset",
    geometryBySize,
    sizes: [...presetBike.sizes],
    sizeData,
    ...activeGeometryState(sizeData),
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

  const clonedSizeData = cloneSizeData(sizeData);
  return {
    ...bike,
    size: String(size),
    sizeData: clonedSizeData,
    ...activeGeometryState(clonedSizeData),
  };
}

export function createBikeFromGeometryImport(currentBike, draft, geometryImage = currentBike.geometryImage ?? null) {
  const selectedImportSizes = getSelectedImportSizes(draft);
  const geometryValueSource = draft.geometryValueSource === "manual" ? "manual" : "ai";
  const category = normalizeBikeCategory(draft.category);
  const geometryBySize = Object.fromEntries(
    selectedImportSizes.map((size) => [
      String(size),
      importGeometryToSizeData(size, draft.sizes?.[size] ?? draft.candidateSizes?.[size], {
        valueSource: geometryValueSource,
        valueSources: draft.valueSourcesBySize?.[size] ?? draft.candidateValueSources?.[size],
        category,
        extendedGeometry: draft.extendedGeometryBySize?.[size] ?? {},
        rawRows: draft.rawRows ?? [],
      }),
    ]),
  );
  const sizes = sortBikeSizes(selectedImportSizes, {
    sourceOrder: draft.detectedSizes ?? Object.keys(draft.candidateSizes ?? draft.sizes ?? {}),
  });
  const selectedSize = geometryBySize[draft.selectedSize] ? draft.selectedSize : sizes[0];
  const sizeData = cloneSizeData(geometryBySize[selectedSize]);

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
      candidateValueSources: Object.fromEntries(Object.entries(
        draft.candidateValueSources ?? draft.valueSourcesBySize ?? {},
      ).map(([size, sources]) => [size, { ...sources }])),
      extendedGeometryBySize: Object.fromEntries(Object.entries(
        draft.extendedGeometryBySize ?? {},
      ).map(([size, geometry]) => [size, { ...geometry }])),
      rawRows: (draft.rawRows ?? []).map((row) => ({ ...row, values: [...(row.values ?? [])] })),
      parserWarnings: [...(draft.allParserWarnings ?? draft.parserWarnings ?? [])],
      unrecognizedFields: (draft.unrecognizedFields ?? []).map((field) => ({ ...field, values: [...(field.values ?? [])] })),
      parserMeta: draft.parserMeta ? { ...draft.parserMeta } : null,
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
    ...activeGeometryState(sizeData),
    rawRows: (draft.rawRows ?? []).map((row) => ({ ...row, values: [...(row.values ?? [])] })),
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
  const officialGeometry = { ...(bike.officialGeometry ?? bike.sizeData.officialGeometry ?? {}) };
  const valueSources = { ...(bike.valueSources ?? bike.sizeData.valueSources ?? {}) };
  for (const [key, value] of Object.entries(validPatch)) {
    const canonicalKey = GEOMETRY_TO_CANONICAL_KEY[key];
    if (!canonicalKey) continue;
    officialGeometry[canonicalKey] = value;
    valueSources[canonicalKey] = "manual";
  }
  const sizeData = createStructuredGeometrySizeData({
    ...bike.sizeData,
    ...sizeDataPatch,
    officialGeometry,
  }, {
    category: bike.category,
    valueSource: "manual",
    valueSources,
    extendedGeometry: bike.extendedGeometry,
    rawRows: bike.rawRows,
  });

  return {
    ...bike,
    geometryBySize: {
      ...bike.geometryBySize,
      [bike.size]: sizeData,
    },
    sizeData,
    ...activeGeometryState(sizeData),
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
