import {
  CORE_GEOMETRY_FIELD_KEYS,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
  PRECISION_GEOMETRY_FIELD_KEYS,
} from "../../services/geometryParserSchema.js";

function toFiniteNumber(value) {
  if (value == null || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function isAvailableGeometryValue(key, value) {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null) return false;
  const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[key];
  return !range || (numericValue >= range.min && numericValue <= range.max);
}

function getGeometryValue(key, officialGeometry, extendedGeometry) {
  if (Object.prototype.hasOwnProperty.call(officialGeometry ?? {}, key)) {
    return officialGeometry[key];
  }
  if (key === "forkLength") {
    return extendedGeometry?.forkLength ?? extendedGeometry?.axleToCrown;
  }
  return extendedGeometry?.[key];
}

export function getGeometryDataCompleteness({
  officialGeometry = {},
  extendedGeometry = {},
} = {}) {
  const coreAvailable = CORE_GEOMETRY_FIELD_KEYS.filter((key) => (
    isAvailableGeometryValue(key, getGeometryValue(key, officialGeometry, extendedGeometry))
  )).length;
  const precisionAvailable = PRECISION_GEOMETRY_FIELD_KEYS.filter((key) => (
    isAvailableGeometryValue(key, getGeometryValue(key, officialGeometry, extendedGeometry))
  )).length;
  const coreComplete = coreAvailable === CORE_GEOMETRY_FIELD_KEYS.length;

  return {
    core: {
      total: CORE_GEOMETRY_FIELD_KEYS.length,
      available: coreAvailable,
      complete: coreComplete,
    },
    precision: {
      total: PRECISION_GEOMETRY_FIELD_KEYS.length,
      available: precisionAvailable,
    },
    renderable: coreComplete,
  };
}
