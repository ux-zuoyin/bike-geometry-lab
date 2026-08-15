import { GEOMETRY_PARSER_LENGTH_FIELD_KEYS } from "./geometryParserSchema.js";

const LENGTH_FIELDS = new Set(GEOMETRY_PARSER_LENGTH_FIELD_KEYS);
const UNIT_MULTIPLIERS = Object.freeze({ mm: 1, cm: 10, inch: 25.4 });
const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function normalizeLengthUnit(value) {
  const token = String(value ?? "").trim().toLowerCase();
  if (token === "mm") return "mm";
  if (token === "cm") return "cm";
  if (["in", "inch", "inches"].includes(token)) return "inch";
  return "unknown";
}

function convertLength(value, multiplier) {
  if (value == null || value === "") return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return Math.round(numericValue * multiplier * 1000000) / 1000000;
}

/**
 * Converts only row-level or table-wide explicitly declared length units into mm.
 * It performs no inference, plausibility scoring, decimal heuristic, warning,
 * validation, or field mapping. Angle and all other fields pass through.
 */
export function normalizeExplicitGeometryUnits(mappedResponse, measurementContext) {
  if (!isRecord(mappedResponse) || !Array.isArray(mappedResponse.sizes)) return mappedResponse;

  const defaultLengthUnit = normalizeLengthUnit(measurementContext?.defaultLengthUnit);
  const unitForField = (field) => {
    const explicitUnit = normalizeLengthUnit(mappedResponse.fieldUnits?.[field]?.explicitUnit);
    return explicitUnit === "unknown" ? defaultLengthUnit : explicitUnit;
  };
  const unresolvedFields = new Set();
  let changed = false;

  const normalizeGeometry = (geometry) => Object.fromEntries(Object.entries(geometry ?? {}).map(([field, value]) => {
    if (!LENGTH_FIELDS.has(field) || value == null || value === "") return [field, value];
    const resolvedUnit = unitForField(field);
    const multiplier = UNIT_MULTIPLIERS[resolvedUnit];
    if (!multiplier) {
      unresolvedFields.add(field);
      return [field, value];
    }
    if (multiplier === 1) return [field, value];
    changed = true;
    return [field, convertLength(value, multiplier)];
  }));

  const sizes = mappedResponse.sizes.map((entry) => ({
    ...entry,
    geometry: normalizeGeometry(entry?.geometry),
  }));
  const extendedGeometryBySize = Object.fromEntries(Object.entries(
    mappedResponse.extendedGeometryBySize ?? {},
  ).map(([size, geometry]) => [size, normalizeGeometry(geometry)]));

  if (unresolvedFields.size === 0 && !changed) return mappedResponse;

  const warnings = unresolvedFields.size === 0
    ? mappedResponse.warnings
    : [
      ...(Array.isArray(mappedResponse.warnings) ? mappedResponse.warnings : []),
      {
        code: "LENGTH_UNIT_UNRESOLVED",
        message: `无法确定长度字段的明示单位：${[...unresolvedFields].join("、")}。请确认原图的行级或全局单位。`,
        field: null,
        size: null,
        severity: "error",
      },
    ];

  return {
    ...mappedResponse,
    sizes,
    extendedGeometryBySize,
    warnings,
  };
}

export const __geometryUnitNormalizerInternals = Object.freeze({
  normalizeLengthUnit,
  convertLength,
});
