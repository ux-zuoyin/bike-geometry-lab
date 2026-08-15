import { GEOMETRY_PARSER_FIELD_KEYS, GEOMETRY_PARSER_PLAUSIBILITY_RANGES } from "../../services/geometryParserSchema.js";
import { ENDURANCE_VISUAL_BASE_GEOMETRY } from "../../data/enduranceGeometry.js";
import { getPresetExperienceDefinition } from "../../data/presetExperience.js";
import { getGeometryDataCompleteness } from "./geometryCompleteness.js";

export const GEOMETRY_VALUE_SOURCES = Object.freeze(["official", "ai", "manual"]);
export const GEOMETRY_RENDER_SOURCES = Object.freeze([
  ...GEOMETRY_VALUE_SOURCES,
  "derived",
  "template",
]);

const SIZE_DATA_KEYS = Object.freeze({
  stack: "stackMm",
  reach: "reachMm",
  effectiveTopTube: "effectiveTopTubeMm",
  seatTubeLength: "seatTubeLengthMm",
  seatTubeAngle: "seatTubeAngleDeg",
  headTubeLength: "headTubeLengthMm",
  headTubeAngle: "headTubeAngleDeg",
  chainstay: "chainstayMm",
  wheelbase: "wheelbaseMm",
  bbDrop: "bbDropMm",
  forkOffset: "forkOffsetMm",
});

const TEMPLATE_REQUIRED_FIELDS = Object.freeze([
  "stack",
  "reach",
  "seatTubeAngle",
  "headTubeLength",
  "headTubeAngle",
  "chainstay",
  "bbDrop",
]);

const toNumberOrNull = (value) => {
  if (value == null || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const radians = (degrees) => (degrees * Math.PI) / 180;

function compactGeometryToCanonical(geometry) {
  return {
    stack: geometry.stack,
    reach: geometry.reach,
    effectiveTopTube: geometry.effectiveTopTube,
    seatTubeLength: geometry.seatTube,
    seatTubeAngle: geometry.seatAngle,
    headTubeLength: geometry.headTube,
    headTubeAngle: geometry.headAngle,
    chainstay: geometry.chainstay,
    wheelbase: geometry.wheelbase,
    bbDrop: geometry.bbDrop,
    forkOffset: geometry.forkRake,
  };
}

function sizeDataToCanonical(sizeData) {
  return Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((key) => [
    key,
    toNumberOrNull(sizeData?.[SIZE_DATA_KEYS[key]]),
  ]));
}

function createCategoryTemplates() {
  const endurance = compactGeometryToCanonical(ENDURANCE_VISUAL_BASE_GEOMETRY);
  const allRoundDefinition = getPresetExperienceDefinition("arone");
  const aeroDefinition = getPresetExperienceDefinition("erone");
  const allRound = sizeDataToCanonical(
    allRoundDefinition.sizes.find(({ size }) => size === allRoundDefinition.visualBaseSize),
  );
  const aero = sizeDataToCanonical(
    aeroDefinition.sizes.find(({ size }) => size === aeroDefinition.visualBaseSize),
  );
  return Object.freeze({
    endurance: Object.freeze(endurance),
    allRound: Object.freeze(allRound),
    aero: Object.freeze(aero),
  });
}

const CATEGORY_RENDER_TEMPLATES = createCategoryTemplates();

function getCategoryTemplate(category) {
  return CATEGORY_RENDER_TEMPLATES[category] ?? CATEGORY_RENDER_TEMPLATES.endurance;
}

function isUsableGeometryValue(key, value) {
  const numericValue = toNumberOrNull(value);
  if (numericValue == null) return false;
  const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[key];
  return !range || (numericValue >= range.min && numericValue <= range.max);
}

function sourceForValue(valueSources, key, fallbackSource) {
  const source = valueSources?.[key];
  if (GEOMETRY_VALUE_SOURCES.includes(source)) return source;
  return GEOMETRY_VALUE_SOURCES.includes(fallbackSource) ? fallbackSource : "official";
}

function deriveSeatTubeLength(renderGeometry) {
  const effectiveTopTube = renderGeometry.effectiveTopTube;
  const reach = renderGeometry.reach;
  const seatTubeAngle = renderGeometry.seatTubeAngle;
  if (![effectiveTopTube, reach, seatTubeAngle].every(Number.isFinite)) return null;
  const cosine = Math.cos(radians(seatTubeAngle));
  if (Math.abs(cosine) < 1e-6) return null;
  const derived = (effectiveTopTube - reach) / cosine;
  return isUsableGeometryValue("seatTubeLength", derived) ? derived : null;
}

function deriveWheelbaseFromFrontCenter(renderGeometry, extendedGeometry) {
  const frontCenter = toNumberOrNull(extendedGeometry?.frontCenter);
  if (frontCenter == null) return null;
  const rearProjection = Math.sqrt(Math.max(
    0,
    renderGeometry.chainstay ** 2 - renderGeometry.bbDrop ** 2,
  ));
  // Frame charts define Front Center as the horizontal BB → front-axle distance.
  const derived = rearProjection + frontCenter;
  return isUsableGeometryValue("wheelbase", derived) ? derived : null;
}

function deriveWheelbaseFromForkGeometry(renderGeometry, extendedGeometry) {
  const forkLength = toNumberOrNull(extendedGeometry?.forkLength ?? extendedGeometry?.axleToCrown);
  const forkOffset = renderGeometry.forkOffset;
  if (forkLength == null || !Number.isFinite(forkOffset)) return null;
  const headAngle = radians(renderGeometry.headTubeAngle);
  const headBottomX = renderGeometry.reach + renderGeometry.headTubeLength * Math.cos(headAngle);
  const frontAxleX = headBottomX
    + forkLength * Math.cos(headAngle)
    + forkOffset * Math.sin(headAngle);
  const rearAxleX = -Math.sqrt(Math.max(
    0,
    renderGeometry.chainstay ** 2 - renderGeometry.bbDrop ** 2,
  ));
  const derived = frontAxleX - rearAxleX;
  return isUsableGeometryValue("wheelbase", derived) ? derived : null;
}

export function createOfficialGeometry(value = {}) {
  return Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((key) => [
    key,
    toNumberOrNull(value?.[key]),
  ]));
}

export function createOfficialGeometryFromSizeData(sizeData = {}) {
  if (sizeData.officialGeometry) return createOfficialGeometry(sizeData.officialGeometry);
  return sizeDataToCanonical(sizeData);
}

export function createGeometryValueSources(officialGeometry, source = "official", existingSources = {}) {
  return Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((key) => [
    key,
    officialGeometry?.[key] == null ? null : sourceForValue(existingSources, key, source),
  ]));
}

export function resolveRenderGeometry({
  officialGeometry: inputGeometry,
  valueSources = {},
  category = "endurance",
  extendedGeometry = {},
  fallbackValueSource = "official",
} = {}) {
  const officialGeometry = createOfficialGeometry(inputGeometry);
  const template = getCategoryTemplate(category);
  const renderGeometry = Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((key) => [key, null]));
  const renderSources = Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((key) => [key, null]));

  for (const key of GEOMETRY_PARSER_FIELD_KEYS) {
    if (!isUsableGeometryValue(key, officialGeometry[key])) continue;
    renderGeometry[key] = officialGeometry[key];
    renderSources[key] = sourceForValue(valueSources, key, fallbackValueSource);
  }

  for (const key of TEMPLATE_REQUIRED_FIELDS) {
    if (renderGeometry[key] != null) continue;
    renderGeometry[key] = template[key];
    renderSources[key] = "template";
  }

  if (renderGeometry.seatTubeLength == null) {
    const derivedSeatTubeLength = deriveSeatTubeLength(renderGeometry);
    if (derivedSeatTubeLength != null) {
      renderGeometry.seatTubeLength = derivedSeatTubeLength;
      renderSources.seatTubeLength = "derived";
    } else {
      renderGeometry.seatTubeLength = template.seatTubeLength;
      renderSources.seatTubeLength = "template";
    }
  }

  if (renderGeometry.wheelbase == null) {
    const derivedWheelbase = deriveWheelbaseFromFrontCenter(renderGeometry, extendedGeometry)
      ?? deriveWheelbaseFromForkGeometry(renderGeometry, extendedGeometry);
    if (derivedWheelbase != null) {
      renderGeometry.wheelbase = derivedWheelbase;
      renderSources.wheelbase = "derived";
    } else {
      renderGeometry.wheelbase = template.wheelbase;
      renderSources.wheelbase = "template";
    }
  }

  return {
    officialGeometry,
    renderGeometry,
    renderSources,
  };
}

export function toRendererGeometry(renderGeometry = {}) {
  return {
    wheel: "700c",
    seatTube: renderGeometry.seatTubeLength,
    seatAngle: renderGeometry.seatTubeAngle,
    headTube: renderGeometry.headTubeLength,
    headAngle: renderGeometry.headTubeAngle,
    effectiveTopTube: renderGeometry.effectiveTopTube,
    bbDrop: renderGeometry.bbDrop,
    chainstay: renderGeometry.chainstay,
    forkRake: renderGeometry.forkOffset,
    trail: null,
    wheelbase: renderGeometry.wheelbase,
    standover: null,
    reach: renderGeometry.reach,
    stack: renderGeometry.stack,
  };
}

export function officialGeometryToSizeDataFields(officialGeometry) {
  return Object.fromEntries(Object.entries(SIZE_DATA_KEYS).map(([key, sizeDataKey]) => [
    sizeDataKey,
    officialGeometry?.[key] ?? null,
  ]));
}

export function getGeometrySourceCounts(renderSources = {}) {
  return Object.fromEntries(GEOMETRY_RENDER_SOURCES.map((source) => [
    source,
    Object.values(renderSources).filter((candidate) => candidate === source).length,
  ]));
}

export function getGeometryCompleteness(officialGeometry, renderSources) {
  if (Object.values(renderSources).includes("template")) return "approximate";
  if (Object.values(renderSources).includes("derived")) return "derived";
  if (Object.values(officialGeometry).includes(null)) return "approximate";
  return "exact";
}

export function createStructuredGeometrySizeData(sizeData, {
  category = "endurance",
  valueSource = "official",
  valueSources: suppliedValueSources,
  extendedGeometry: suppliedExtendedGeometry,
  rawRows = [],
} = {}) {
  const officialGeometry = createOfficialGeometryFromSizeData(sizeData);
  const valueSources = createGeometryValueSources(
    officialGeometry,
    valueSource,
    suppliedValueSources ?? sizeData.valueSources,
  );
  const extendedGeometry = {
    ...(sizeData.extendedGeometry ?? {}),
    ...(sizeData.trailMm == null ? {} : { trail: sizeData.trailMm }),
    ...(sizeData.standoverMm == null ? {} : { standover: sizeData.standoverMm }),
    ...(suppliedExtendedGeometry ?? {}),
  };
  const resolved = resolveRenderGeometry({
    officialGeometry,
    valueSources,
    category,
    extendedGeometry,
    fallbackValueSource: valueSource,
  });
  const renderSources = resolved.renderSources;
  const geometrySourceCounts = getGeometrySourceCounts(renderSources);
  const completeness = getGeometryDataCompleteness({ officialGeometry, extendedGeometry });
  const renderGeometryFidelity = getGeometryCompleteness(officialGeometry, renderSources);
  return {
    ...sizeData,
    ...officialGeometryToSizeDataFields(officialGeometry),
    officialGeometry,
    valueSources,
    renderGeometry: resolved.renderGeometry,
    renderSources,
    extendedGeometry,
    rawRows: rawRows.map((row) => ({ ...row, values: [...(row.values ?? [])] })),
    completeness,
    geometrySources: renderSources,
    geometryCompleteness: completeness,
    renderGeometryFidelity,
    geometrySourceCounts: {
      ...geometrySourceCounts,
      // Transitional read alias for the unchanged Phase 1 Review copy.
      estimated: geometrySourceCounts.template,
    },
  };
}

export const __renderGeometryResolverInternals = Object.freeze({
  CATEGORY_RENDER_TEMPLATES,
  deriveSeatTubeLength,
  deriveWheelbaseFromFrontCenter,
  deriveWheelbaseFromForkGeometry,
  isUsableGeometryValue,
});
