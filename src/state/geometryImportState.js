import {
  GEOMETRY_PARSER_LENGTH_FIELD_KEYS,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
} from "../services/geometryParserSchema.js";
import { ENDURANCE_VISUAL_BASE_GEOMETRY } from "../data/enduranceGeometry.js";
import {
  BIKE_CATEGORIES,
  normalizeBikeCategory,
} from "../config/bikeArchetypes.js";
import { sortBikeSizes } from "../lib/geometry/sizeSorting.js";

export const GEOMETRY_IMPORT_STATUSES = Object.freeze([
  "analyzing",
  "review",
  "ready",
  "error",
]);

export const MANUAL_GEOMETRY_SIZE_PLACEHOLDER = "__manual_size__";

export const GEOMETRY_IMPORT_FIELDS = Object.freeze([
  { key: "stack", label: "Stack", reviewLabel: "堆高", required: true, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.stack },
  { key: "reach", label: "Reach", reviewLabel: "前伸量", required: true, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.reach },
  { key: "effectiveTopTube", label: "Effective Top Tube", reviewLabel: "有效上管", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.effectiveTopTube },
  { key: "seatTubeLength", label: "Seat Tube", reviewLabel: "座管长度", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.seatTubeLength },
  { key: "seatTubeAngle", label: "Seat Tube Angle", reviewLabel: "座管角", required: true, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.seatTubeAngle },
  { key: "headTubeLength", label: "Head Tube", reviewLabel: "头管长度", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.headTubeLength },
  { key: "headTubeAngle", label: "Head Tube Angle", reviewLabel: "头管角", required: true, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.headTubeAngle },
  { key: "chainstay", label: "Chainstay", reviewLabel: "后下叉长度", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.chainstay },
  { key: "wheelbase", label: "Wheelbase", reviewLabel: "轴距", tooltip: "轴距，部分中文几何表也写作轮轴距", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.wheelbase },
  { key: "bbDrop", label: "BB Drop", reviewLabel: "五通下沉", tooltip: "五通下沉，部分几何表也称中轴下沉量", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.bbDrop },
  { key: "forkOffset", label: "Fork Offset", reviewLabel: "前叉偏移", tooltip: "前叉偏移，部分品牌也称前叉调节量 / Fork Rake", required: false, ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.forkOffset },
]);

export const CORE_GEOMETRY_FIELD_KEYS = Object.freeze(
  GEOMETRY_IMPORT_FIELDS.filter(({ required }) => required).map(({ key }) => key),
);

export const STRUCTURAL_GEOMETRY_FIELD_KEYS = Object.freeze(
  GEOMETRY_IMPORT_FIELDS.filter(({ required }) => !required).map(({ key }) => key),
);

const fieldsByKey = Object.freeze(Object.fromEntries(
  GEOMETRY_IMPORT_FIELDS.map((field) => [field.key, field]),
));

const toSize = (value) => String(value ?? "").trim();
const cloneGeometry = (geometry) => ({ ...geometry });
const createEmptyGeometry = () => Object.fromEntries(
  GEOMETRY_IMPORT_FIELDS.map(({ key }) => [key, null]),
);

export function createManualGeometryImportDraft() {
  const geometry = createEmptyGeometry();
  return {
    entryMode: "manual",
    geometryValueSource: "manual",
    brand: "",
    model: "",
    category: null,
    candidateSizes: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...geometry } },
    sizes: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...geometry } },
    selectedImportSizes: [MANUAL_GEOMETRY_SIZE_PLACEHOLDER],
    selectedSize: MANUAL_GEOMETRY_SIZE_PLACEHOLDER,
    detectedSizes: [],
    detectedSizeCount: 0,
    rawRows: [],
    allParserWarnings: [],
    parserWarnings: [],
    parserConfirmationCount: 0,
    unrecognizedFields: [],
    parserMeta: null,
    measurementContext: null,
    unitDiagnostics: null,
  };
}

export function getSelectedImportSizes(draft) {
  const candidateSizes = draft?.candidateSizes ?? draft?.sizes ?? {};
  const candidateKeys = Object.keys(candidateSizes);
  const requested = Array.isArray(draft?.selectedImportSizes)
    ? draft.selectedImportSizes.map(toSize)
    : [];
  const selected = [...new Set(requested.filter((size) => candidateKeys.includes(size)))];
  const sourceOrder = [...new Set([
    ...(draft?.detectedSizes ?? []).map(toSize),
    ...candidateKeys,
  ])];
  if (Array.isArray(draft?.selectedImportSizes)) {
    return sortBikeSizes(selected, { sourceOrder });
  }
  const selectedSize = toSize(draft?.selectedSize);
  if (candidateKeys.includes(selectedSize)) return [selectedSize];
  return candidateKeys[0] ? [candidateKeys[0]] : [];
}

export function scopeGeometryImportWarnings(warnings, selectedImportSizes) {
  const selected = new Set((selectedImportSizes ?? []).map(toSize));
  return Array.isArray(warnings)
    ? warnings.filter((warning) => (
      warning?.code === "UNIT_UNCERTAIN"
      || (warning?.size != null && selected.has(toSize(warning.size)))
    ))
    : [];
}

export function confirmGeometryImportLengthUnit(draft, rawUnit) {
  const unit = rawUnit === "cm" || rawUnit === "mm" ? rawUnit : null;
  if (!draft || !unit || !draft.measurementContext?.requiresConfirmation) return draft;

  const diagnosticsByField = draft.unitDiagnostics?.fields ?? {};
  const candidateSizes = Object.fromEntries(Object.entries(draft.candidateSizes ?? draft.sizes ?? {}).map(([size, geometry]) => {
    const nextGeometry = { ...geometry };
    for (const field of GEOMETRY_PARSER_LENGTH_FIELD_KEYS) {
      const diagnostic = diagnosticsByField[field];
      if (diagnostic?.sourceUnit !== "unknown") continue;
      const sourceValue = diagnostic.values?.find((item) => String(item.size) === String(size))?.sourceValue;
      if (!Number.isFinite(Number(sourceValue))) continue;
      nextGeometry[field] = unit === "cm" ? Number(sourceValue) * 10 : Number(sourceValue);
    }
    return [size, nextGeometry];
  }));
  const unitDiagnostics = draft.unitDiagnostics ? {
    ...draft.unitDiagnostics,
    defaultLengthUnit: unit,
    unitSource: "user",
    confidence: 1,
    evidence: [`用户在 Review 中确认无单位长度按 ${unit} 处理。`],
    requiresConfirmation: false,
    fields: Object.fromEntries(Object.entries(diagnosticsByField).map(([field, diagnostic]) => [field, (
      diagnostic?.sourceUnit === "unknown"
        ? {
          ...diagnostic,
          sourceUnit: unit,
          unitSource: "user",
          values: (diagnostic.values ?? []).map((item) => ({
            ...item,
            sourceUnit: unit,
            normalizedValue: unit === "cm" ? Number(item.sourceValue) * 10 : Number(item.sourceValue),
          })),
        }
        : diagnostic
    )])),
  } : null;
  const allParserWarnings = (draft.allParserWarnings ?? draft.parserWarnings ?? []).filter(({ code }) => code !== "UNIT_UNCERTAIN");
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    measurementContext: {
      ...draft.measurementContext,
      defaultLengthUnit: unit,
      unitSource: "user",
      confidence: 1,
      evidence: [`用户在 Review 中确认无单位长度按 ${unit} 处理。`],
      requiresConfirmation: false,
    },
    unitDiagnostics,
    allParserWarnings,
  }, getSelectedImportSizes({ ...draft, candidateSizes }));
}

function applyImportSizeSelection(draft, selectedImportSizes) {
  const candidateSizes = draft?.candidateSizes ?? draft?.sizes ?? {};
  const sourceOrder = [...new Set([
    ...(draft?.detectedSizes ?? []).map(toSize),
    ...Object.keys(candidateSizes),
  ])];
  const selected = sortBikeSizes(
    selectedImportSizes.filter((size) => candidateSizes[size]),
    { sourceOrder },
  );
  const previousSelectedSize = toSize(draft.selectedSize);
  const previousSelectedIndex = sourceOrder.indexOf(previousSelectedSize);
  const nextSelectedSize = selected.includes(previousSelectedSize)
    ? previousSelectedSize
    : (
      selected.find((size) => sourceOrder.indexOf(size) > previousSelectedIndex)
      ?? selected[selected.length - 1]
      ?? ""
    );
  const sizes = Object.fromEntries(selected.map((size) => [size, cloneGeometry(candidateSizes[size])]));
  const allParserWarnings = Array.isArray(draft?.allParserWarnings)
    ? draft.allParserWarnings
    : (draft?.parserWarnings ?? []);
  const parserWarnings = scopeGeometryImportWarnings(allParserWarnings, selected);
  return {
    ...draft,
    candidateSizes,
    sizes,
    selectedImportSizes: selected,
    selectedSize: nextSelectedSize,
    allParserWarnings,
    parserWarnings,
    parserConfirmationCount: parserWarnings.filter((warning) => (
      ["CELL_UNRECOGNIZED", "SIZE_COLUMN_MISSING", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning.code)
    )).length,
  };
}

const TEMPLATE_GEOMETRY_DEFAULTS = Object.freeze({
  stack: ENDURANCE_VISUAL_BASE_GEOMETRY.stack,
  reach: ENDURANCE_VISUAL_BASE_GEOMETRY.reach,
  effectiveTopTube: ENDURANCE_VISUAL_BASE_GEOMETRY.effectiveTopTube,
  seatTubeLength: ENDURANCE_VISUAL_BASE_GEOMETRY.seatTube,
  seatTubeAngle: ENDURANCE_VISUAL_BASE_GEOMETRY.seatAngle,
  headTubeLength: ENDURANCE_VISUAL_BASE_GEOMETRY.headTube,
  headTubeAngle: ENDURANCE_VISUAL_BASE_GEOMETRY.headAngle,
  chainstay: ENDURANCE_VISUAL_BASE_GEOMETRY.chainstay,
  wheelbase: ENDURANCE_VISUAL_BASE_GEOMETRY.wheelbase,
  bbDrop: ENDURANCE_VISUAL_BASE_GEOMETRY.bbDrop,
  forkOffset: ENDURANCE_VISUAL_BASE_GEOMETRY.forkRake,
});

export function isGeometryImportPreviewSafe(geometry) {
  return getGeometryImportPreviewIssues(geometry).length === 0;
}

export function getGeometryImportPreviewIssues(geometry) {
  return CORE_GEOMETRY_FIELD_KEYS.flatMap((key) => {
    const field = fieldsByKey[key];
    const value = geometry?.[field.key];
    const error = value == null || value === ""
      ? `${field.label} 不能为空`
      : getGeometryImportFieldError(field, value);
    return error ? [{ key: field.key, label: field.label, error }] : [];
  });
}

function isOfficialGeometryValue(field, value) {
  return value != null && value !== "" && getGeometryImportFieldError(field, value) == null;
}

function deriveWheelbase(resolved, sources) {
  const inputKeys = ["reach", "chainstay", "bbDrop", "forkOffset"];
  if (!inputKeys.every((key) => ["official", "manual"].includes(sources[key]))) return null;
  const rearProjection = Math.sqrt(Math.max(0, resolved.chainstay ** 2 - resolved.bbDrop ** 2));
  const templateRearProjection = Math.sqrt(Math.max(
    0,
    TEMPLATE_GEOMETRY_DEFAULTS.chainstay ** 2 - TEMPLATE_GEOMETRY_DEFAULTS.bbDrop ** 2,
  ));
  const templateFrontCenter = TEMPLATE_GEOMETRY_DEFAULTS.wheelbase - templateRearProjection;
  return rearProjection
    + templateFrontCenter
    + (resolved.reach - TEMPLATE_GEOMETRY_DEFAULTS.reach)
    + (resolved.forkOffset - TEMPLATE_GEOMETRY_DEFAULTS.forkOffset);
}

export function resolveGeometryImportPreview(geometry, { directSource = "official" } = {}) {
  const issues = getGeometryImportPreviewIssues(geometry);
  if (issues.length) {
    return {
      isValid: false,
      issues,
      geometry: null,
      geometrySources: {},
      geometryCompleteness: "incomplete",
    };
  }

  const resolved = {};
  const geometrySources = {};
  for (const field of GEOMETRY_IMPORT_FIELDS) {
    const value = geometry?.[field.key];
    if (isOfficialGeometryValue(field, value)) {
      resolved[field.key] = Number(value);
      geometrySources[field.key] = directSource;
    } else {
      resolved[field.key] = TEMPLATE_GEOMETRY_DEFAULTS[field.key];
      geometrySources[field.key] = "estimated";
    }
  }

  if (geometrySources.wheelbase === "estimated") {
    const derivedWheelbase = deriveWheelbase(resolved, geometrySources);
    if (derivedWheelbase != null && Number.isFinite(derivedWheelbase)) {
      resolved.wheelbase = derivedWheelbase;
      geometrySources.wheelbase = "derived";
    }
  }

  const sourceValues = Object.values(geometrySources);
  const geometryCompleteness = sourceValues.includes("estimated")
    ? "approximate"
    : (sourceValues.includes("derived") ? "derived" : "exact");

  return {
    isValid: true,
    issues: [],
    geometry: resolved,
    geometrySources,
    geometryCompleteness,
  };
}

export function getGeometryDraftSourceCounts(geometry, { directSource = "official" } = {}) {
  const resolved = resolveGeometryImportPreview(geometry, { directSource });
  const sources = resolved.isValid
    ? Object.values(resolved.geometrySources)
    : GEOMETRY_IMPORT_FIELDS.flatMap((field) => {
      if (isOfficialGeometryValue(field, geometry?.[field.key])) return [directSource];
      return field.required ? [] : ["estimated"];
    });
  return {
    official: sources.filter((source) => source === "official").length,
    manual: sources.filter((source) => source === "manual").length,
    derived: sources.filter((source) => source === "derived").length,
    estimated: sources.filter((source) => source === "estimated").length,
  };
}

export function isSupportedGeometryImage(file) {
  if (typeof File === "undefined" || !(file instanceof File)) return false;
  const supportedMimeTypes = ["image/png", "image/jpeg"];
  const supportedExtension = /\.(png|jpe?g)$/i.test(file.name);
  return supportedMimeTypes.includes(file.type) || (!file.type && supportedExtension);
}

export function updateGeometryImportDraftField(draft, size, key, rawValue) {
  if (!draft?.sizes?.[size]) return draft;
  const value = rawValue === "" ? null : Number(rawValue);
  return {
    ...draft,
    sizes: {
      ...draft.sizes,
      [size]: {
        ...draft.sizes[size],
        [key]: Number.isFinite(value) ? value : null,
      },
    },
  };
}

export function getGeometryImportFieldError(field, value) {
  if (!field) return null;
  if (value == null || value === "") {
    return field.required ? `${field.label} 不能为空` : null;
  }
  if (!Number.isFinite(Number(value)) || Number(value) < field.min || Number(value) > field.max) {
    return `${field.label} 需在 ${field.min}–${field.max}${field.unit} 范围内`;
  }
  return null;
}

export function validateGeometryImportDraft(draft) {
  const errors = {};
  if (!draft?.brand?.trim()) errors.brand = "请输入品牌名称";
  if (!BIKE_CATEGORIES.includes(draft?.category)) errors.category = "请选择车架类型";
  if (draft?.measurementContext?.requiresConfirmation) errors.unit = "请选择长度单位";

  const sizes = getSelectedImportSizes(draft);
  if (sizes.length === 0) errors.sizes = "未识别到可用尺码";
  if (draft?.entryMode === "manual" && sizes.some((size) => size === MANUAL_GEOMETRY_SIZE_PLACEHOLDER)) {
    errors.sizes = "请输入尺码名称";
  }

  for (const size of sizes) {
    const geometry = draft.sizes[size] ?? {};
    for (const field of GEOMETRY_IMPORT_FIELDS.filter(({ required }) => required)) {
      const error = getGeometryImportFieldError(field, geometry[field.key]);
      if (error) errors[`sizes.${size}.${field.key}`] = error;
    }
  }

  const errorKeys = Object.keys(errors);
  const firstErrorKey = errorKeys[0] ?? null;
  const firstInvalidSize = firstErrorKey?.startsWith("sizes.")
    ? sizes.find((size) => firstErrorKey.startsWith(`sizes.${size}.`)) ?? null
    : null;

  return { isValid: errorKeys.length === 0, errors, errorCount: errorKeys.length, firstErrorKey, firstInvalidSize };
}

export function addGeometryImportDraftSize(draft, rawSize) {
  const size = String(rawSize ?? "").trim();
  if (!draft || !size) return draft;
  const alreadySelected = getSelectedImportSizes(draft).includes(size);
  if (alreadySelected && draft.candidateSizes?.[size]) return draft;
  const candidateSizes = { ...(draft.candidateSizes ?? draft.sizes ?? {}) };
  if (!candidateSizes[size]) {
    candidateSizes[size] = createEmptyGeometry();
  }
  const selectedImportSizes = getSelectedImportSizes({ ...draft, candidateSizes });
  if (selectedImportSizes.includes(size)) return { ...draft, candidateSizes };
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    selectedSize: size,
  }, [...selectedImportSizes, size]);
}

export function renameGeometryImportDraftSize(draft, rawSize) {
  if (!draft) return draft;
  const currentSize = toSize(draft.selectedSize);
  const nextSize = toSize(rawSize) || MANUAL_GEOMETRY_SIZE_PLACEHOLDER;
  if (!currentSize || currentSize === nextSize) return draft;
  const candidateSizes = { ...(draft.candidateSizes ?? draft.sizes ?? {}) };
  if (candidateSizes[nextSize]) return draft;
  const currentGeometry = draft.sizes?.[currentSize] ?? candidateSizes[currentSize] ?? createEmptyGeometry();
  delete candidateSizes[currentSize];
  candidateSizes[nextSize] = { ...currentGeometry };
  const selectedImportSizes = getSelectedImportSizes(draft).map((size) => (
    size === currentSize ? nextSize : size
  ));
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    selectedSize: nextSize,
  }, selectedImportSizes);
}

export function copyGeometryImportDraftSize(draft, rawSize) {
  const size = toSize(rawSize);
  if (!draft || !size || draft.candidateSizes?.[size]) return draft;
  const sourceGeometry = draft.sizes?.[draft.selectedSize];
  if (!sourceGeometry) return draft;
  const candidateSizes = {
    ...(draft.candidateSizes ?? draft.sizes ?? {}),
    [draft.selectedSize]: { ...sourceGeometry },
    [size]: { ...sourceGeometry },
  };
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    selectedSize: size,
  }, [...getSelectedImportSizes(draft), size]);
}

export function toggleGeometryImportSize(draft, rawSize) {
  const size = toSize(rawSize);
  if (!draft || !size) return draft;
  const selectedImportSizes = getSelectedImportSizes(draft);
  if (!selectedImportSizes.includes(size)) {
    return applyImportSizeSelection({ ...draft, selectedSize: size }, [...selectedImportSizes, size]);
  }
  if (selectedImportSizes.length === 1) return draft;
  return applyImportSizeSelection(draft, selectedImportSizes.filter((candidate) => candidate !== size));
}

export function importGeometryToSizeData(size, geometry, directSource = "official") {
  const resolved = resolveGeometryImportPreview(geometry, { directSource });
  const values = resolved.geometry ?? geometry;
  return {
    size: String(size),
    wheelSize: "700c",
    seatTubeLengthMm: values.seatTubeLength,
    seatTubeAngleDeg: values.seatTubeAngle,
    headTubeLengthMm: values.headTubeLength,
    headTubeAngleDeg: values.headTubeAngle,
    effectiveTopTubeMm: values.effectiveTopTube,
    bbDropMm: values.bbDrop,
    chainstayMm: values.chainstay,
    forkOffsetMm: values.forkOffset,
    trailMm: null,
    wheelbaseMm: values.wheelbase,
    standoverMm: null,
    reachMm: values.reach,
    stackMm: values.stack,
    geometrySources: resolved.geometrySources,
    geometryCompleteness: resolved.geometryCompleteness,
    geometrySourceCounts: getGeometryDraftSourceCounts(geometry, { directSource }),
  };
}

export function bikeToGeometryImportDraft(bike) {
  const sizes = Object.fromEntries(Object.entries(bike.geometryBySize ?? {}).map(([size, data]) => [
    String(size),
    {
      stack: data.stackMm ?? null,
      reach: data.reachMm ?? null,
      effectiveTopTube: data.effectiveTopTubeMm ?? null,
      seatTubeLength: data.seatTubeLengthMm ?? null,
      seatTubeAngle: data.seatTubeAngleDeg ?? null,
      headTubeLength: data.headTubeLengthMm ?? null,
      headTubeAngle: data.headTubeAngleDeg ?? null,
      chainstay: data.chainstayMm ?? null,
      wheelbase: data.wheelbaseMm ?? null,
      bbDrop: data.bbDropMm ?? null,
      forkOffset: data.forkOffsetMm ?? null,
    },
  ]));
  const candidateSizes = Object.fromEntries(Object.entries(bike.importSource?.candidateSizes ?? sizes).map(([size, geometry]) => [
    String(size),
    cloneGeometry(geometry),
  ]));
  for (const [size, geometry] of Object.entries(sizes)) candidateSizes[size] = cloneGeometry(geometry);
  const selectedImportSizes = getSelectedImportSizes({
    candidateSizes,
    selectedImportSizes: bike.importSource?.selectedImportSizes ?? Object.keys(sizes),
    selectedSize: bike.size,
  });
  const allParserWarnings = bike.importSource?.parserWarnings ?? [];
  const parserWarnings = scopeGeometryImportWarnings(allParserWarnings, selectedImportSizes);

  return {
    entryMode: bike.importSource?.entryMode ?? "ai",
    geometryValueSource: bike.importSource?.geometryValueSource ?? "official",
    brand: bike.brand,
    model: bike.model,
    category: normalizeBikeCategory(bike.category),
    candidateSizes,
    sizes: Object.fromEntries(selectedImportSizes.map((size) => [size, cloneGeometry(candidateSizes[size])])),
    selectedImportSizes,
    selectedSize: selectedImportSizes.includes(String(bike.size)) ? String(bike.size) : selectedImportSizes[0] ?? "",
    detectedSizes: bike.importSource?.detectedSizes ?? Object.keys(candidateSizes),
    detectedSizeCount: bike.importSource?.detectedSizeCount ?? Object.keys(candidateSizes).length,
    rawRows: bike.importSource?.rawRows ?? [],
    allParserWarnings,
    parserWarnings,
    parserConfirmationCount: parserWarnings.filter((warning) => ["CELL_UNRECOGNIZED", "SIZE_COLUMN_MISSING", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning.code)).length,
    unrecognizedFields: bike.importSource?.unrecognizedFields ?? [],
    parserMeta: bike.importSource?.parserMeta ?? null,
    measurementContext: bike.importSource?.measurementContext ?? null,
    unitDiagnostics: bike.importSource?.unitDiagnostics ?? null,
  };
}
