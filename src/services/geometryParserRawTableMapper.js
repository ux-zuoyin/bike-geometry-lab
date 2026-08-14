import { GEOMETRY_PARSER_FIELD_KEYS } from "./geometryParserSchema.js";

const FIELD_ALIASES = Object.freeze([
  ["stack", ["车架堆高", "堆高", "stack"]],
  ["reach", ["车架前伸量", "前伸量", "reach"]],
  ["seatTubeLength", ["尺寸座管长度", "座管长度", "立管长度", "座管", "seattubelength", "seattube"]],
  ["effectiveTopTube", ["上管长度水平", "水平上管长度", "有效上管", "effectivetoptube", "toptube"]],
  ["seatTubeAngle", ["座管角度", "立管角度", "seattubeangle"]],
  ["headTubeAngle", ["头管角度", "头管角", "头角", "headtubeangle"]],
  ["headTubeLength", ["头管长度", "headtube"]],
  ["chainstay", ["后轮轴距", "后下叉长度", "chainstay"]],
  ["wheelbase", ["车轮轴距", "轮轴距", "轴距", "wheelbase"]],
  ["forkOffset", ["前叉调节量", "前叉偏移量", "前叉偏移", "前叉偏置", "偏移", "forkoffset", "forkrake"]],
  ["bbDrop", ["中轴下沉量", "中轴下沉", "中轴落差", "五通下沉", "bbdrop", "bottombracketdrop"]],
]);

const EXCLUDED_SEMANTICS = Object.freeze([
  ["stemStack", ["把立堆高"]],
  ["stemReach", ["把立前伸量"]],
  ["frontCenter", ["前轴距", "frontcenter"]],
  ["trail", ["拖曳距", "trail"]],
  ["standover", ["standoverheight", "standover", "跨高"]],
]);

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const toSize = (value) => String(value ?? "").trim();
const normalizeLabel = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/^\s*[a-n]\s*[.\-—–－:：]\s*/i, "")
  .replace(/[\s/＿_\-—–－()（）:：·.,，]/g, "");

function warning(code, message, field = null, size = null) {
  return { code, message, field, size };
}

function getCanonicalField(label) {
  const normalized = normalizeLabel(label);
  if (getExcludedSemantic(normalized)) return null;
  const matches = FIELD_ALIASES.flatMap(([field, aliases]) => aliases
    .filter((alias) => normalized.includes(alias))
    .map((alias) => ({ field, alias })));
  matches.sort((left, right) => right.alias.length - left.alias.length);
  return matches[0]?.field ?? null;
}

function getExcludedSemantic(normalizedLabel) {
  return EXCLUDED_SEMANTICS.find(([, aliases]) => (
    aliases.some((alias) => normalizedLabel.includes(alias))
  ))?.[0] ?? null;
}

function getUnrecognizedReason(label) {
  const normalized = normalizeLabel(label);
  const semantic = getExcludedSemantic(normalized);
  if (semantic === "stemStack") return "把立堆高不属于车架 Stack，已禁止映射。";
  if (semantic === "stemReach") return "把立前伸量不属于车架 Reach，已禁止映射。";
  if (semantic === "frontCenter") return "Front Center / 前轴距不属于当前 Geometry Schema，已禁止映射到 Wheelbase。";
  if (semantic === "trail") return "Trail / 拖曳距不属于当前 Geometry Schema。";
  if (semantic === "standover") return "Standover / 跨高不属于当前 Geometry Schema。";
  return "未命中当前 Geometry Schema 的确定性字段别名。";
}

function normalizeRawRows(value, sizeCount, warnings) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row, rowIndex) => {
    if (!isRecord(row) || !toSize(row.label)) return [];
    const sourceValues = Array.isArray(row.values) ? row.values : [];
    const values = Array.from({ length: sizeCount }, (_, index) => {
      const rawValue = sourceValues[index];
      const numericValue = rawValue == null || rawValue === "" ? null : Number(rawValue);
      return Number.isFinite(numericValue) ? numericValue : null;
    });
    if (sourceValues.length !== sizeCount) {
      warnings.push(warning(
        "RAW_ROW_COLUMN_COUNT_MISMATCH",
        `原始行“${toSize(row.label)}”包含 ${sourceValues.length} 个单元格，已按 ${sizeCount} 个尺码列对齐。`,
      ));
    }
    return [{
      label: toSize(row.label),
      unit: row.unit == null || row.unit === "" ? null : String(row.unit).trim(),
      values,
      sourceIndex: rowIndex,
    }];
  });
}

export function mapRawGeometryTableToParserResponse(rawResponse) {
  if (!isRecord(rawResponse) || !Array.isArray(rawResponse.rawRows)) return rawResponse;

  const detectedSizes = Array.isArray(rawResponse.detectedSizes)
    ? rawResponse.detectedSizes.map(toSize).filter(Boolean)
    : [];
  const warnings = [];
  const rawRowsWithIndex = normalizeRawRows(rawResponse.rawRows, detectedSizes.length, warnings);
  const rawRows = rawRowsWithIndex.map(({ sourceIndex, ...row }) => row);
  const rowsByField = new Map();
  const unrecognizedFields = [];

  for (const row of rawRowsWithIndex) {
    const field = getCanonicalField(row.label);
    if (!field) {
      unrecognizedFields.push({
        sourceLabel: row.label,
        reason: getUnrecognizedReason(row.label),
        unit: row.unit,
        values: row.values,
      });
      continue;
    }
    if (rowsByField.has(field)) {
      warnings.push(warning(
        "RAW_ROW_DUPLICATE_FIELD",
        `原始行“${row.label}”与“${rowsByField.get(field).label}”都映射到 ${field}，已保留第一行。`,
        field,
      ));
      continue;
    }
    rowsByField.set(field, row);
  }

  const sizes = detectedSizes.map((size, index) => ({
    size,
    geometry: Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((field) => [
      field,
      rowsByField.get(field)?.values[index] ?? null,
    ])),
  }));

  const fieldColumnCounts = Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((field) => [
    field,
    sizes.reduce((count, entry) => count + (entry.geometry[field] == null ? 0 : 1), 0),
  ]));

  return {
    detectedSizeCount: detectedSizes.length,
    detectedSizes,
    fieldColumnCounts,
    sizes,
    warnings,
    unrecognizedFields,
    rawRows,
  };
}
