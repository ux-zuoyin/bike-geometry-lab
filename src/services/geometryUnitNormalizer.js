import { GEOMETRY_PARSER_LENGTH_FIELD_KEYS } from "./geometryParserSchema.js";

const LENGTH_FIELDS = new Set(GEOMETRY_PARSER_LENGTH_FIELD_KEYS);
const UNIT_MULTIPLIERS = Object.freeze({ mm: 1, cm: 10, in: 25.4 });
const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function normalizeLengthUnit(value) {
  const token = String(value ?? "").trim().toLowerCase();
  if (token === "mm") return "mm";
  if (token === "cm") return "cm";
  if (["in", "inch", "inches"].includes(token)) return "in";
  return "unknown";
}

function convertLength(value, multiplier) {
  if (value == null || value === "") return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return Math.round(numericValue * multiplier * 1000000) / 1000000;
}

/**
 * Converts only an explicitly declared table-wide length unit into mm.
 * It performs no inference, plausibility scoring, decimal heuristic, warning,
 * validation, or field mapping. Angle and all other fields pass through.
 */
export function normalizeExplicitGeometryUnits(mappedResponse, measurementContext) {
  if (!isRecord(mappedResponse) || !Array.isArray(mappedResponse.sizes)) return mappedResponse;

  const defaultLengthUnit = normalizeLengthUnit(measurementContext?.defaultLengthUnit);
  const multiplier = UNIT_MULTIPLIERS[defaultLengthUnit];
  if (!multiplier) return mappedResponse;

  return {
    ...mappedResponse,
    sizes: mappedResponse.sizes.map((entry) => ({
      ...entry,
      geometry: Object.fromEntries(Object.entries(entry?.geometry ?? {}).map(([field, value]) => [
        field,
        LENGTH_FIELDS.has(field) ? convertLength(value, multiplier) : value,
      ])),
    })),
    extendedGeometryBySize: Object.fromEntries(Object.entries(
      mappedResponse.extendedGeometryBySize ?? {},
    ).map(([size, geometry]) => [
      size,
      Object.fromEntries(Object.entries(geometry ?? {}).map(([field, value]) => [
        field,
        LENGTH_FIELDS.has(field) ? convertLength(value, multiplier) : value,
      ])),
    ])),
  };
}

export const __geometryUnitNormalizerInternals = Object.freeze({
  normalizeLengthUnit,
  convertLength,
});
