import {
  GEOMETRY_PARSER_FIELDS,
  GEOMETRY_PARSER_FIELD_KEYS,
  GEOMETRY_PARSER_LENGTH_FIELD_KEYS,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
} from "./geometryParserSchema.js";

const LENGTH_FIELDS = new Set(GEOMETRY_PARSER_LENGTH_FIELD_KEYS);
const FIELD_LABELS = Object.fromEntries(GEOMETRY_PARSER_FIELDS.map(({ key, label }) => [key, label]));
const KNOWN_LENGTH_UNITS = new Set(["mm", "cm", "in"]);
const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function normalizeUnitToken(value) {
  const token = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s.]/g, "");

  if (!token) return "unknown";
  if (["mm", "毫米", "millimeter", "millimeters", "millimetre", "millimetres"].includes(token)) return "mm";
  if (["cm", "厘米", "centimeter", "centimeters", "centimetre", "centimetres"].includes(token)) return "cm";
  if (["in", "inch", "inches", "\"", "英寸"].includes(token)) return "in";
  if (["°", "deg", "degree", "degrees", "度"].includes(token)) return "deg";
  return "unknown";
}

export function normalizeGeometryMeasurementContext(value) {
  const explicitGlobalUnit = normalizeUnitToken(value?.defaultLengthUnit);
  const defaultLengthUnit = KNOWN_LENGTH_UNITS.has(explicitGlobalUnit)
    ? explicitGlobalUnit
    : "unknown";
  const unitSource = ["global", "inferred", "user"].includes(value?.unitSource)
    ? value.unitSource
    : (defaultLengthUnit === "unknown" ? "unknown" : "global");
  const confidence = Number(value?.confidence);
  return {
    defaultLengthUnit,
    explicitGlobalUnit: value?.explicitGlobalUnit == null
      ? (unitSource === "global" ? defaultLengthUnit : null)
      : (KNOWN_LENGTH_UNITS.has(normalizeUnitToken(value.explicitGlobalUnit))
        ? normalizeUnitToken(value.explicitGlobalUnit)
        : null),
    inferredLengthUnit: KNOWN_LENGTH_UNITS.has(normalizeUnitToken(value?.inferredLengthUnit))
      ? normalizeUnitToken(value.inferredLengthUnit)
      : null,
    unitSource,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    evidence: Array.isArray(value?.evidence)
      ? value.evidence.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [],
    requiresConfirmation: Boolean(value?.requiresConfirmation),
  };
}

function getUnitFromLabel(label) {
  const match = String(label ?? "").match(/(?:[（(]\s*|[\/｜|]\s*)(mm|cm|in|inch|inches|毫米|厘米|英寸)\s*[)）]?\s*$/i);
  return match ? normalizeUnitToken(match[1]) : "unknown";
}

function getExplicitRowUnit(rowUnit, sourceLabel, rowUnitSource = "unknown") {
  const labelUnit = getUnitFromLabel(sourceLabel);
  if (KNOWN_LENGTH_UNITS.has(labelUnit)) return labelUnit;
  if (rowUnitSource !== "explicit_row") return "unknown";
  const explicitUnit = normalizeUnitToken(rowUnit);
  return KNOWN_LENGTH_UNITS.has(explicitUnit) ? explicitUnit : "unknown";
}

function resolveLengthUnit(
  rowUnit,
  defaultLengthUnit,
  sourceLabel,
  defaultSource = "global",
  rowUnitSource = "unknown",
) {
  const explicitUnit = getExplicitRowUnit(rowUnit, sourceLabel, rowUnitSource);
  if (explicitUnit !== "unknown") return { sourceUnit: explicitUnit, source: "row" };
  if (defaultLengthUnit !== "unknown") return { sourceUnit: defaultLengthUnit, source: defaultSource };
  return { sourceUnit: "unknown", source: "unknown" };
}

function normalizeLengthValue(value, sourceUnit) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const multiplier = sourceUnit === "cm" ? 10 : sourceUnit === "in" ? 25.4 : 1;
  return Math.round(Number(value) * multiplier * 1000000) / 1000000;
}

function collectInferenceFields(sizes, fieldSources) {
  return GEOMETRY_PARSER_LENGTH_FIELD_KEYS.flatMap((field) => {
    const source = isRecord(fieldSources[field]) ? fieldSources[field] : null;
    if (getExplicitRowUnit(source?.unit, source?.label, source?.unitSource) !== "unknown") return [];
    const values = sizes.flatMap((entry) => {
      const value = Number(entry?.geometry?.[field]);
      return Number.isFinite(value) ? [{ size: String(entry?.size ?? ""), value }] : [];
    });
    return values.length ? [{ field, values }] : [];
  });
}

function scoreCandidateUnit(fields, unit) {
  const evaluated = fields.map(({ field, values }) => {
    const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[field];
    const normalizedValues = values.map(({ size, value }) => ({
      size,
      sourceValue: value,
      normalizedValue: normalizeLengthValue(value, unit),
    }));
    const validValues = normalizedValues.filter(({ normalizedValue }) => (
      normalizedValue >= range.min && normalizedValue <= range.max
    ));
    return { field, values: normalizedValues, validCount: validValues.length, totalCount: normalizedValues.length };
  });
  const totalCount = evaluated.reduce((count, item) => count + item.totalCount, 0);
  const validCount = evaluated.reduce((count, item) => count + item.validCount, 0);
  return {
    unit,
    score: totalCount ? validCount / totalCount : 0,
    validFieldCount: evaluated.filter((item) => item.validCount > 0).length,
    totalFieldCount: evaluated.length,
    evidence: evaluated
      .filter((item) => item.validCount > 0)
      .slice(0, 5)
      .map((item) => {
        const sample = item.values.find(({ normalizedValue }) => {
          const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[item.field];
          return normalizedValue >= range.min && normalizedValue <= range.max;
        });
        return `${FIELD_LABELS[item.field]} ${sample.sourceValue} → ${sample.normalizedValue} mm 合理`;
      }),
  };
}

/**
 * Infers only a missing table-level length unit. It compares the complete
 * mapped length set under mm and cm interpretations; it never uses decimal
 * presence, size labels, or angle fields as evidence.
 */
export function inferGeometryLengthUnit(sizes, fieldSources) {
  const fields = collectInferenceFields(sizes, fieldSources);
  if (fields.length < 3) {
    return {
      unit: "unknown",
      confidence: null,
      evidence: [`仅识别到 ${fields.length} 个无单位长度字段，无法可靠判断 mm 或 cm。`],
    };
  }

  const candidates = [scoreCandidateUnit(fields, "mm"), scoreCandidateUnit(fields, "cm")]
    .sort((left, right) => right.score - left.score);
  const [winner, runnerUp] = candidates;
  const scoreGap = winner.score - runnerUp.score;
  const isClear = winner.validFieldCount >= 3 && winner.score >= 0.8 && scoreGap >= 0.3;
  if (!isClear) {
    return {
      unit: "unknown",
      confidence: Math.round(winner.score * 100) / 100,
      evidence: [
        `mm 合理性 ${(candidates.find(({ unit }) => unit === "mm").score * 100).toFixed(0)}%，cm 合理性 ${(candidates.find(({ unit }) => unit === "cm").score * 100).toFixed(0)}%。`,
        "两种解释差异不足，需人工确认。",
      ],
    };
  }

  return {
    unit: winner.unit,
    confidence: Math.round((0.88 + (winner.score * 0.06) + (scoreGap * 0.04)) * 100) / 100,
    evidence: winner.evidence,
  };
}

function createUnitWarning() {
  return {
    code: "UNIT_UNCERTAIN",
    message: "这张几何表没有明确标注长度单位，系统无法可靠判断，请选择 mm 或 cm 后继续。",
    field: null,
    size: null,
  };
}

/**
 * Converts deterministic raw-table length values into the parser's mm
 * contract. rawRows intentionally remain untouched for review diagnostics.
 */
export function normalizeGeometryParserUnits(mappedResponse) {
  if (!isRecord(mappedResponse) || !Array.isArray(mappedResponse.sizes)) return mappedResponse;

  const suppliedContext = normalizeGeometryMeasurementContext(mappedResponse.measurementContext);
  const fieldSources = isRecord(mappedResponse.fieldSources) ? mappedResponse.fieldSources : {};
  const inference = suppliedContext.defaultLengthUnit === "unknown"
    ? inferGeometryLengthUnit(mappedResponse.sizes, fieldSources)
    : null;
  const defaultLengthUnit = suppliedContext.defaultLengthUnit !== "unknown"
    ? suppliedContext.defaultLengthUnit
    : inference?.unit ?? "unknown";
  const unitSource = suppliedContext.defaultLengthUnit !== "unknown"
    ? "global"
    : (defaultLengthUnit === "unknown" ? "unknown" : "inferred");
  const measurementContext = {
    defaultLengthUnit,
    explicitGlobalUnit: suppliedContext.defaultLengthUnit === "unknown" ? null : suppliedContext.defaultLengthUnit,
    inferredLengthUnit: unitSource === "inferred" ? defaultLengthUnit : null,
    unitSource,
    confidence: unitSource === "global" ? 1 : inference?.confidence ?? null,
    evidence: unitSource === "global"
      ? [`表格明确标注默认长度单位为 ${defaultLengthUnit}。`]
      : (inference?.evidence ?? []),
    requiresConfirmation: false,
  };
  const warnings = Array.isArray(mappedResponse.warnings) ? [...mappedResponse.warnings] : [];
  const unitDiagnostics = {
    ...measurementContext,
    fields: {},
  };
  let hasUncertainLengthValues = false;

  const sizes = mappedResponse.sizes.map((entry) => {
    const geometry = isRecord(entry?.geometry) ? entry.geometry : {};
    const normalizedGeometry = {};

    for (const field of GEOMETRY_PARSER_FIELD_KEYS) {
      const rawValue = geometry[field] == null || geometry[field] === "" ? null : Number(geometry[field]);
      const source = isRecord(fieldSources[field]) ? fieldSources[field] : null;
      if (!LENGTH_FIELDS.has(field)) {
        normalizedGeometry[field] = Number.isFinite(rawValue) ? rawValue : null;
        continue;
      }

      const resolvedUnit = resolveLengthUnit(
        source?.unit,
        measurementContext.defaultLengthUnit,
        source?.label,
        measurementContext.unitSource,
        source?.unitSource,
      );
      const normalizedValue = normalizeLengthValue(rawValue, resolvedUnit.sourceUnit);
      normalizedGeometry[field] = normalizedValue;

      if (!unitDiagnostics.fields[field]) {
        unitDiagnostics.fields[field] = {
          sourceLabel: source?.label ?? null,
          sourceUnit: resolvedUnit.sourceUnit,
          unitSource: resolvedUnit.source,
          normalizedUnit: "mm",
          values: [],
        };
      }
      if (normalizedValue != null) {
        unitDiagnostics.fields[field].values.push({
          size: String(entry?.size ?? ""),
          sourceValue: rawValue,
          sourceUnit: resolvedUnit.sourceUnit,
          normalizedValue,
        });
        hasUncertainLengthValues ||= resolvedUnit.sourceUnit === "unknown";
      }
    }

    return { ...entry, geometry: normalizedGeometry };
  });

  measurementContext.requiresConfirmation = hasUncertainLengthValues;
  unitDiagnostics.requiresConfirmation = hasUncertainLengthValues;
  if (hasUncertainLengthValues) warnings.push(createUnitWarning());

  const { fieldSources: _fieldSources, ...response } = mappedResponse;
  return {
    ...response,
    measurementContext,
    sizes,
    warnings,
    unitDiagnostics,
  };
}

export const __unitNormalizerInternals = Object.freeze({
  normalizeUnitToken,
  getUnitFromLabel,
  getExplicitRowUnit,
  resolveLengthUnit,
  normalizeLengthValue,
  scoreCandidateUnit,
});
