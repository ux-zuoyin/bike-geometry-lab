import { GEOMETRY_PARSER_FIELD_KEYS } from "./geometryParserSchema.js";

const FIELD_ALIASES = Object.freeze([
  { field: "stack", priority: 200, aliases: ["车架堆高", "堆高", "stack"] },
  { field: "reach", priority: 200, aliases: ["车架前伸量", "前伸量", "reach"] },
  { field: "seatTubeLength", priority: 200, aliases: ["尺寸座管长度", "座管长度", "立管长度", "座管", "seattubelength", "seattube"] },
  { field: "effectiveTopTube", priority: 500, aliases: ["上管长度水平", "toptubehorizontal"] },
  { field: "effectiveTopTube", priority: 450, aliases: ["水平上管长度", "horizontaltoptube"] },
  { field: "effectiveTopTube", priority: 400, aliases: ["有效上管", "effectivetoptube"] },
  { field: "effectiveTopTube", priority: 100, aliases: ["上管长度", "toptubelength", "toptube"] },
  { field: "seatTubeAngle", priority: 200, aliases: ["座管角度", "立管角度", "seattubeangle"] },
  { field: "headTubeAngle", priority: 200, aliases: ["头管角度", "头管角", "头角", "headtubeangle"] },
  { field: "headTubeLength", priority: 200, aliases: ["头管长度", "headtube"] },
  { field: "chainstay", priority: 200, aliases: ["后轮轴距", "后下叉长度", "chainstay"] },
  { field: "wheelbase", priority: 200, aliases: ["车轮轴距", "轮轴距", "轴距", "wheelbase"] },
  { field: "forkOffset", priority: 200, aliases: ["前叉调节量", "前叉偏移量", "前叉偏移", "前叉偏置", "偏移", "forkoffset", "forkrake"] },
  { field: "bbDrop", priority: 200, aliases: ["中轴下沉量", "中轴下沉", "中轴落差", "五通下沉", "bbdrop", "bottombracketdrop"] },
]);

const EXCLUDED_SEMANTICS = Object.freeze([
  ["stemStack", ["把立堆高"]],
  ["stemReach", ["把立前伸量"]],
  ["frontCenter", ["前轴距", "frontcenter"]],
  ["forkLength", ["前叉长度", "forklength", "axletocrown"]],
  ["trail", ["拖曳距", "trail"]],
  ["standover", ["standoverheight", "standover", "跨高"]],
  ["bbHeight", ["五通高度", "中轴高度", "bbheight", "bottombracketheight"]],
  ["topTubeActual", ["实际上管", "上管实际", "toptubeactual", "actualtoptube"]],
  ["str", ["stackreachratio", "str"]],
  ["handlebarWidth", ["车把宽度", "把横宽度", "handlebarwidth"]],
  ["stemLength", ["把立长度", "stemlength"]],
  ["crankLength", ["曲柄长度", "cranklength"]],
]);

const EXTENDED_SEMANTICS = new Set([
  "frontCenter",
  "forkLength",
  "trail",
  "standover",
  "bbHeight",
  "topTubeActual",
  "str",
  "handlebarWidth",
  "stemLength",
  "crankLength",
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
  const matches = FIELD_ALIASES.flatMap(({ field, priority, aliases }) => aliases
    .filter((alias) => normalized.includes(alias))
    .map((alias) => ({ field, priority, alias })));
  matches.sort((left, right) => (
    right.priority - left.priority || right.alias.length - left.alias.length
  ));
  return matches[0] ?? null;
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
  if (semantic === "frontCenter") return "Front Center / 前轴距属于 Precision Geometry，已保留且不会映射为 Wheelbase。";
  if (semantic === "forkLength") return "Fork Length / Axle to Crown 属于 Precision Geometry，已保留为扩展数据。";
  if (semantic === "trail") return "Trail / 拖曳距不属于当前 Geometry Schema。";
  if (semantic === "standover") return "Standover / 跨高不属于当前 Geometry Schema。";
  if (semantic === "topTubeActual") return "Top Tube Actual 属于 Reference Geometry，不能映射为 Effective Top Tube。";
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
  const extendedRowsByKey = new Map();
  const unrecognizedFields = [];

  for (const row of rawRowsWithIndex) {
    const fieldMatch = getCanonicalField(row.label);
    if (!fieldMatch) {
      const semantic = getExcludedSemantic(normalizeLabel(row.label));
      if (EXTENDED_SEMANTICS.has(semantic) && !extendedRowsByKey.has(semantic)) {
        extendedRowsByKey.set(semantic, row);
      }
      unrecognizedFields.push({
        sourceLabel: row.label,
        reason: getUnrecognizedReason(row.label),
        unit: row.unit,
        values: row.values,
      });
      continue;
    }
    const existing = rowsByField.get(fieldMatch.field);
    if (existing && existing.priority >= fieldMatch.priority) {
      warnings.push(warning(
        "RAW_ROW_DUPLICATE_FIELD",
        `原始行“${row.label}”与“${existing.row.label}”都映射到 ${fieldMatch.field}，已保留语义更明确的行。`,
        fieldMatch.field,
      ));
      continue;
    }
    if (existing) {
      warnings.push(warning(
        "RAW_ROW_DUPLICATE_FIELD",
        `原始行“${existing.row.label}”与“${row.label}”都映射到 ${fieldMatch.field}，已改用语义更明确的“${row.label}”。`,
        fieldMatch.field,
      ));
    }
    rowsByField.set(fieldMatch.field, { row, priority: fieldMatch.priority });
  }

  const sizes = detectedSizes.map((size, index) => ({
    size,
    geometry: Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((field) => [
      field,
      rowsByField.get(field)?.row.values[index] ?? null,
    ])),
  }));

  const extendedGeometryBySize = Object.fromEntries(detectedSizes.map((size, index) => [
    size,
    Object.fromEntries([...extendedRowsByKey].flatMap(([key, row]) => (
      row.values[index] == null ? [] : [[key, row.values[index]]]
    ))),
  ]));

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
    extendedGeometryBySize,
    rawRows,
  };
}
