import {
  CORE_GEOMETRY_FIELD_KEYS,
  GEOMETRY_PARSER_FIELDS,
  GEOMETRY_PARSER_FIELD_KEYS,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
  GEOMETRY_PARSER_SCHEMA_VERSION,
} from "./geometryParserSchema.js";
import { getGeometryDataCompleteness } from "../lib/geometry/geometryCompleteness.js";

const coreFields = new Set(CORE_GEOMETRY_FIELD_KEYS);
const warningSeverities = new Set(["error", "warning", "info"]);

const fieldLabels = Object.fromEntries(
  GEOMETRY_PARSER_FIELDS.map(({ key, label }) => [key, label]),
);

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const toSize = (value) => String(value ?? "").trim();

function warning(code, message, field = null, size = null, value, severity = "warning") {
  return {
    code,
    message,
    field,
    size,
    severity,
    ...(value === undefined ? {} : { value }),
  };
}

function warningIdentity(item) {
  return [item.code, item.field ?? "", item.size ?? "", item.value ?? "", item.message].join("|");
}

function appendWarning(target, seen, item) {
  const identity = warningIdentity(item);
  if (seen.has(identity)) return;
  seen.add(identity);
  target.push(item);
}

function sanitizeModelWarnings(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || !String(item.message ?? "").trim()) return [];
    return [{
      code: String(item.code ?? "MODEL_WARNING").trim() || "MODEL_WARNING",
      message: String(item.message).trim(),
      field: item.field == null ? null : String(item.field),
      size: item.size == null ? null : toSize(item.size),
      severity: warningSeverities.has(item.severity)
        ? item.severity
        : (item.code === "RAW_ROW_COLUMN_COUNT_MISMATCH" ? "error" : "warning"),
    }];
  });
}

function sanitizeExtendedGeometryBySize(value, detectedSizes) {
  if (!isRecord(value)) return Object.fromEntries(detectedSizes.map((size) => [size, {}]));
  return Object.fromEntries(detectedSizes.map((size) => {
    const source = isRecord(value[size]) ? value[size] : {};
    return [size, Object.fromEntries(Object.entries(source).flatMap(([key, cell]) => {
      const numericValue = cell == null || cell === "" ? null : Number(cell);
      return Number.isFinite(numericValue) ? [[key, numericValue]] : [];
    }))];
  }));
}

function sanitizeUnrecognizedFields(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    return [{
      sourceLabel: String(item.sourceLabel ?? "").trim(),
      reason: String(item.reason ?? "").trim(),
      unit: item.unit == null || item.unit === "" ? null : String(item.unit).trim(),
      values: Array.isArray(item.values)
        ? item.values.map((cell) => {
          const numericValue = cell == null || cell === "" ? null : Number(cell);
          return Number.isFinite(numericValue) ? numericValue : null;
        })
        : [],
    }];
  });
}

function sanitizeRawRows(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item) || !String(item.label ?? "").trim()) return [];
    return [{
      label: String(item.label).trim(),
      unit: item.unit == null || item.unit === "" ? null : String(item.unit).trim(),
      explicitUnit: item.explicitUnit == null || item.explicitUnit === ""
        ? null
        : String(item.explicitUnit).trim(),
      values: Array.isArray(item.values)
        ? item.values.map((cell) => {
          const numericValue = cell == null || cell === "" ? null : Number(cell);
          return Number.isFinite(numericValue) ? numericValue : null;
        })
        : [],
    }];
  });
}

export class GeometryParserValidationError extends Error {
  constructor(message, { code = "PARSER_RESPONSE_INVALID", details = [] } = {}) {
    super(message);
    this.name = "GeometryParserValidationError";
    this.code = code;
    this.details = details;
  }
}

export function validateAndNormalizeGeometryParserResponse(rawResponse) {
  if (!isRecord(rawResponse)) {
    throw new GeometryParserValidationError("几何解析结果不是有效对象。");
  }

  const rawSizeEntries = Array.isArray(rawResponse.sizes) ? rawResponse.sizes : [];
  const rawDetectedSizes = Array.isArray(rawResponse.detectedSizes)
    ? rawResponse.detectedSizes.map(toSize).filter(Boolean)
    : [];
  const entrySizes = rawSizeEntries.map((entry) => toSize(entry?.size)).filter(Boolean);
  const detectedSizes = rawDetectedSizes.length ? rawDetectedSizes : entrySizes;

  if (!detectedSizes.length) {
    throw new GeometryParserValidationError("没有从图片中识别到任何车型尺码。", {
      code: "NO_SIZES_DETECTED",
    });
  }

  const duplicateDetectedSizes = detectedSizes.filter((size, index) => detectedSizes.indexOf(size) !== index);
  const duplicateEntrySizes = entrySizes.filter((size, index) => entrySizes.indexOf(size) !== index);
  const duplicates = [...new Set([...duplicateDetectedSizes, ...duplicateEntrySizes])];
  if (duplicates.length) {
    throw new GeometryParserValidationError(`解析结果包含重复尺码：${duplicates.join("、")}。`, {
      code: "DUPLICATE_SIZE",
      details: duplicates,
    });
  }

  const unexpectedSizes = entrySizes.filter((size) => !detectedSizes.includes(size));
  if (unexpectedSizes.length) {
    throw new GeometryParserValidationError("尺码列与几何数据列无法可靠对齐。", {
      code: "SIZE_SET_MISMATCH",
      details: unexpectedSizes,
    });
  }

  const warnings = [];
  const seenWarnings = new Set();
  for (const item of sanitizeModelWarnings(rawResponse.warnings)) {
    appendWarning(warnings, seenWarnings, item);
  }

  if (!rawDetectedSizes.length) {
    appendWarning(
      warnings,
      seenWarnings,
      warning("DETECTED_SIZE_LIST_REBUILT", "模型未返回独立尺码列表，已按几何列顺序重建。"),
    );
  }

  if (Number(rawResponse.detectedSizeCount) !== detectedSizes.length) {
    appendWarning(
      warnings,
      seenWarnings,
      warning(
        "DETECTED_SIZE_COUNT_RECOMPUTED",
        `模型报告 ${Number(rawResponse.detectedSizeCount) || 0} 个尺码，实际解析到 ${detectedSizes.length} 个尺码。`,
      ),
    );
  }

  if (entrySizes.length === detectedSizes.length && entrySizes.some((size, index) => size !== detectedSizes[index])) {
    appendWarning(
      warnings,
      seenWarnings,
      warning("SIZE_ORDER_NORMALIZED", "几何列顺序与原图尺码顺序不一致，已按原图尺码顺序重新对齐。"),
    );
  }

  const entriesBySize = new Map(
    rawSizeEntries.flatMap((entry) => {
      const size = toSize(entry?.size);
      return size ? [[size, entry]] : [];
    }),
  );
  const extendedGeometryBySize = sanitizeExtendedGeometryBySize(
    rawResponse.extendedGeometryBySize,
    detectedSizes,
  );

  const sizes = detectedSizes.map((size) => {
    const entry = entriesBySize.get(size);
    const sourceGeometry = isRecord(entry?.geometry) ? entry.geometry : {};
    if (!entry) {
      appendWarning(
        warnings,
        seenWarnings,
        warning("SIZE_COLUMN_MISSING", `${size} 尺码的几何数据列未被可靠识别。`, null, size, undefined, "error"),
      );
    }

    const geometry = Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((field) => {
      const rawValue = Object.prototype.hasOwnProperty.call(sourceGeometry, field)
        ? sourceGeometry[field]
        : null;
      const numericValue = rawValue == null || rawValue === "" ? null : Number(rawValue);
      const value = Number.isFinite(numericValue) ? numericValue : null;
      if (value == null) {
        appendWarning(
          warnings,
          seenWarnings,
          warning(
            "CELL_UNRECOGNIZED",
            `${size} 尺码 ${fieldLabels[field]} 未可靠识别。`,
            field,
            size,
            undefined,
            coreFields.has(field) ? "error" : "info",
          ),
        );
      } else {
        const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[field];
        if (range && (value < range.min || value > range.max)) {
          appendWarning(
            warnings,
            seenWarnings,
            warning(
              "GEOMETRY_VALUE_OUT_OF_RANGE",
              `${size} 尺码的 ${fieldLabels[field]} 识别为 ${value} ${range.unit}，数值明显异常，请核对。`,
              field,
              size,
              value,
              coreFields.has(field) ? "error" : "warning",
            ),
          );
        }
      }
      return [field, value];
    }));

    return { size, geometry };
  });

  for (const size of detectedSizes) {
    for (const [field, value] of Object.entries(extendedGeometryBySize[size] ?? {})) {
      const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[field];
      if (!range || (value >= range.min && value <= range.max)) continue;
      appendWarning(
        warnings,
        seenWarnings,
        warning(
          "GEOMETRY_VALUE_OUT_OF_RANGE",
          `${size} 尺码的 ${field} 识别为 ${value} ${range.unit}，数值明显异常，已作为非阻塞扩展数据保留。`,
          field,
          size,
          value,
          "warning",
        ),
      );
    }
  }

  const fieldColumnCounts = Object.fromEntries(GEOMETRY_PARSER_FIELD_KEYS.map((field) => [
    field,
    sizes.reduce((count, entry) => count + (entry.geometry[field] == null ? 0 : 1), 0),
  ]));

  for (const field of GEOMETRY_PARSER_FIELD_KEYS) {
    const reportedCount = Number(rawResponse.fieldColumnCounts?.[field]);
    const actualCount = fieldColumnCounts[field];
    if (!Number.isInteger(reportedCount) || reportedCount !== actualCount) {
      appendWarning(
        warnings,
        seenWarnings,
        warning(
          "REPORTED_COLUMN_COUNT_MISMATCH",
          `模型报告 ${fieldLabels[field]} 有 ${Number.isInteger(reportedCount) ? reportedCount : 0} 个值，服务端复核为 ${actualCount} 个。`,
          field,
          null,
          undefined,
          coreFields.has(field) ? "warning" : "info",
        ),
      );
    }
    if (actualCount !== detectedSizes.length) {
      appendWarning(
        warnings,
        seenWarnings,
        warning(
          "COLUMN_COUNT_MISMATCH",
          `检测到 ${detectedSizes.length} 个尺码，但 ${fieldLabels[field]} 仅识别到 ${actualCount} 个值，请人工确认。`,
          field,
          null,
          undefined,
          coreFields.has(field) ? "error" : "info",
        ),
      );
    }
  }

  const confirmationCount = warnings.filter(({ code, severity }) => (
    severity === "error"
    && (
      code === "CELL_UNRECOGNIZED"
      || code === "SIZE_COLUMN_MISSING"
      || code === "GEOMETRY_VALUE_OUT_OF_RANGE"
    )
  )).length;
  const completenessBySize = Object.fromEntries(sizes.map(({ size, geometry }) => [
    size,
    getGeometryDataCompleteness({
      officialGeometry: geometry,
      extendedGeometry: extendedGeometryBySize[size],
    }),
  ]));

  return {
    schemaVersion: GEOMETRY_PARSER_SCHEMA_VERSION,
    detectedSizeCount: detectedSizes.length,
    detectedSizes,
    fieldColumnCounts,
    sizes,
    warnings,
    confirmationCount,
    completenessBySize,
    extendedGeometryBySize,
    unrecognizedFields: sanitizeUnrecognizedFields(rawResponse.unrecognizedFields),
    rawRows: sanitizeRawRows(rawResponse.rawRows),
  };
}
