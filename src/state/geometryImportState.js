import {
  CORE_GEOMETRY_FIELD_KEYS as SHARED_CORE_GEOMETRY_FIELD_KEYS,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
  PRECISION_GEOMETRY_FIELD_KEYS as SHARED_PRECISION_GEOMETRY_FIELD_KEYS,
} from "../services/geometryParserSchema.js";
import {
  BIKE_CATEGORIES,
  normalizeBikeCategory,
} from "../config/bikeArchetypes.js";
import { sortBikeSizes } from "../lib/geometry/sizeSorting.js";
import {
  createGeometryValueSources,
  createOfficialGeometry,
  createStructuredGeometrySizeData,
  getGeometryCompleteness,
  getGeometrySourceCounts,
  resolveRenderGeometry,
} from "../lib/geometry/renderGeometryResolver.js";
import { getGeometryDataCompleteness } from "../lib/geometry/geometryCompleteness.js";

export const GEOMETRY_IMPORT_STATUSES = Object.freeze([
  "analyzing",
  "review",
  "ready",
  "error",
]);

export const MANUAL_GEOMETRY_SIZE_PLACEHOLDER = "__manual_size__";

const GEOMETRY_IMPORT_FIELD_DEFINITIONS = [
  { key: "stack", label: "Stack", reviewLabel: "堆高", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.stack },
  { key: "reach", label: "Reach", reviewLabel: "前伸量", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.reach },
  { key: "effectiveTopTube", label: "Effective Top Tube", reviewLabel: "有效上管", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.effectiveTopTube },
  { key: "seatTubeLength", label: "Seat Tube", reviewLabel: "座管长度", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.seatTubeLength },
  { key: "seatTubeAngle", label: "Seat Tube Angle", reviewLabel: "座管角", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.seatTubeAngle },
  { key: "headTubeLength", label: "Head Tube", reviewLabel: "头管长度", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.headTubeLength },
  { key: "headTubeAngle", label: "Head Tube Angle", reviewLabel: "头管角", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.headTubeAngle },
  { key: "chainstay", label: "Chainstay", reviewLabel: "后下叉长度", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.chainstay },
  { key: "wheelbase", label: "Wheelbase", reviewLabel: "轴距", tooltip: "轴距，部分中文几何表也写作轮轴距", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.wheelbase },
  { key: "bbDrop", label: "BB Drop", reviewLabel: "五通下沉", tooltip: "五通下沉，部分几何表也称中轴下沉量", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.bbDrop },
  { key: "forkOffset", label: "Fork Offset", reviewLabel: "前叉偏移", tooltip: "前叉偏移，部分品牌也称前叉调节量 / Fork Rake", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.forkOffset },
];

const EXTENDED_GEOMETRY_IMPORT_FIELD_DEFINITIONS = [
  { key: "frontCenter", label: "Front Center", reviewLabel: "前中心距", storage: "extended", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.frontCenter },
  { key: "forkLength", label: "Fork Length / Axle to Crown", reviewLabel: "前叉长度 / 轴心到叉肩", storage: "extended", ...GEOMETRY_PARSER_PLAUSIBILITY_RANGES.forkLength },
];

export const GEOMETRY_IMPORT_FIELDS = Object.freeze(
  GEOMETRY_IMPORT_FIELD_DEFINITIONS.map((field) => Object.freeze({
    ...field,
    required: SHARED_CORE_GEOMETRY_FIELD_KEYS.includes(field.key),
  })),
);

export const CORE_GEOMETRY_FIELD_KEYS = SHARED_CORE_GEOMETRY_FIELD_KEYS;

export const GEOMETRY_REVIEW_FIELDS = Object.freeze([
  ...GEOMETRY_IMPORT_FIELDS,
  ...EXTENDED_GEOMETRY_IMPORT_FIELD_DEFINITIONS.map((field) => Object.freeze({
    ...field,
    required: false,
  })),
]);

export const PRECISION_GEOMETRY_IMPORT_FIELDS = Object.freeze(
  SHARED_PRECISION_GEOMETRY_FIELD_KEYS.map((key) => (
    GEOMETRY_REVIEW_FIELDS.find((field) => field.key === key)
  )),
);

export const STRUCTURAL_GEOMETRY_FIELD_KEYS = Object.freeze(
  GEOMETRY_IMPORT_FIELDS.filter(({ required }) => !required).map(({ key }) => key),
);

const fieldsByKey = Object.freeze(Object.fromEntries(
  GEOMETRY_REVIEW_FIELDS.map((field) => [field.key, field]),
));

const toSize = (value) => String(value ?? "").trim();
const cloneGeometry = (geometry) => ({ ...geometry });
const cloneSources = (sources) => ({ ...(sources ?? {}) });
const createEmptyGeometry = () => Object.fromEntries(
  GEOMETRY_IMPORT_FIELDS.map(({ key }) => [key, null]),
);
const createEmptySources = () => Object.fromEntries(
  GEOMETRY_IMPORT_FIELDS.map(({ key }) => [key, null]),
);
const createCompletenessBySize = (sizes, extendedGeometryBySize = {}) => Object.fromEntries(
  Object.entries(sizes ?? {}).map(([size, geometry]) => [
    size,
    getGeometryDataCompleteness({
      officialGeometry: geometry,
      extendedGeometry: extendedGeometryBySize[size] ?? {},
    }),
  ]),
);

export function createManualGeometryImportDraft() {
  const geometry = createEmptyGeometry();
  const valueSources = createEmptySources();
  return {
    entryMode: "manual",
    geometryValueSource: "manual",
    brand: "",
    model: "",
    category: null,
    candidateSizes: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...geometry } },
    sizes: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...geometry } },
    candidateValueSources: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...valueSources } },
    valueSourcesBySize: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: { ...valueSources } },
    selectedImportSizes: [MANUAL_GEOMETRY_SIZE_PLACEHOLDER],
    selectedSize: MANUAL_GEOMETRY_SIZE_PLACEHOLDER,
    detectedSizes: [],
    detectedSizeCount: 0,
    rawRows: [],
    extendedGeometryBySize: { [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: {} },
    completenessBySize: {
      [MANUAL_GEOMETRY_SIZE_PLACEHOLDER]: getGeometryDataCompleteness(),
    },
    allParserWarnings: [],
    parserWarnings: [],
    parserNotices: [],
    parserConfirmationCount: 0,
    unrecognizedFields: [],
    parserMeta: null,
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
      warning?.size == null
        ? isBlockingGeometryParserWarning(warning)
        : selected.has(toSize(warning.size))
    ))
    : [];
}

export function isBlockingGeometryParserWarning(warning) {
  if (warning?.severity) return warning.severity === "error";
  return ["CELL_UNRECOGNIZED", "SIZE_COLUMN_MISSING", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning?.code);
}

function getScopedParserFeedback(warnings, selectedImportSizes) {
  const scoped = scopeGeometryImportWarnings(warnings, selectedImportSizes);
  return {
    parserWarnings: scoped.filter(isBlockingGeometryParserWarning),
    parserNotices: scoped.filter((warning) => !isBlockingGeometryParserWarning(warning)),
  };
}

function applyImportSizeSelection(draft, selectedImportSizes) {
  const candidateSizes = draft?.candidateSizes ?? draft?.sizes ?? {};
  const candidateValueSources = draft?.candidateValueSources ?? draft?.valueSourcesBySize ?? {};
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
  const valueSourcesBySize = Object.fromEntries(selected.map((size) => [
    size,
    cloneSources(candidateValueSources[size]),
  ]));
  const allParserWarnings = Array.isArray(draft?.allParserWarnings)
    ? draft.allParserWarnings
    : (draft?.parserWarnings ?? []);
  const { parserWarnings, parserNotices } = getScopedParserFeedback(allParserWarnings, selected);
  return {
    ...draft,
    candidateSizes,
    candidateValueSources,
    sizes,
    valueSourcesBySize,
    completenessBySize: createCompletenessBySize(sizes, draft.extendedGeometryBySize),
    selectedImportSizes: selected,
    selectedSize: nextSelectedSize,
    allParserWarnings,
    parserWarnings,
    parserNotices,
    parserConfirmationCount: parserWarnings.length,
  };
}

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

export function resolveGeometryImportPreview(geometry, {
  directSource = "ai",
  category = "endurance",
  valueSources: suppliedValueSources,
  extendedGeometry = {},
} = {}) {
  const officialGeometry = createOfficialGeometry(geometry);
  const completeness = getGeometryDataCompleteness({ officialGeometry, extendedGeometry });
  const issues = getGeometryImportPreviewIssues(geometry);
  if (issues.length) {
    return {
      isValid: false,
      issues,
      officialGeometry,
      completeness,
      geometry: null,
      geometrySources: {},
      geometryCompleteness: completeness,
      renderGeometryFidelity: "incomplete",
    };
  }

  const valueSources = createGeometryValueSources(
    officialGeometry,
    directSource,
    suppliedValueSources,
  );
  const resolved = resolveRenderGeometry({
    officialGeometry,
    valueSources,
    category,
    extendedGeometry,
    fallbackValueSource: directSource,
  });
  const renderGeometryFidelity = getGeometryCompleteness(officialGeometry, resolved.renderSources);

  return {
    isValid: true,
    issues: [],
    officialGeometry,
    valueSources,
    renderGeometry: resolved.renderGeometry,
    renderSources: resolved.renderSources,
    completeness,
    geometryCompleteness: completeness,
    renderGeometryFidelity,
    // Compatibility aliases for callers that have not migrated yet.
    geometry: resolved.renderGeometry,
    geometrySources: resolved.renderSources,
  };
}

export function getGeometryDraftSourceCounts(geometry, {
  directSource = "ai",
  category = "endurance",
  valueSources,
  extendedGeometry,
} = {}) {
  const resolved = resolveGeometryImportPreview(geometry, {
    directSource,
    category,
    valueSources,
    extendedGeometry,
  });
  const counts = resolved.isValid
    ? getGeometrySourceCounts(resolved.renderSources)
    : { official: 0, ai: 0, manual: 0, derived: 0, template: 0 };
  return {
    ...counts,
    // The Phase 1 Review UI still reads this legacy count label.
    estimated: counts.template,
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
  const field = fieldsByKey[key];
  if (!field) return draft;
  const value = rawValue === "" ? null : Number(rawValue);
  const normalizedValue = Number.isFinite(value) ? value : null;
  if (field.storage === "extended") {
    const extendedGeometryBySize = {
      ...(draft.extendedGeometryBySize ?? {}),
      [size]: {
        ...(draft.extendedGeometryBySize?.[size] ?? {}),
        [key]: normalizedValue,
      },
    };
    return {
      ...draft,
      extendedGeometryBySize,
      completenessBySize: createCompletenessBySize(draft.sizes, extendedGeometryBySize),
    };
  }
  const valueSourcesBySize = {
    ...(draft.valueSourcesBySize ?? {}),
    [size]: {
      ...(draft.valueSourcesBySize?.[size] ?? {}),
      [key]: normalizedValue == null ? null : "manual",
    },
  };
  const sizes = {
    ...draft.sizes,
    [size]: {
      ...draft.sizes[size],
      [key]: normalizedValue,
    },
  };
  return {
    ...draft,
    sizes,
    valueSourcesBySize,
    completenessBySize: createCompletenessBySize(sizes, draft.extendedGeometryBySize),
  };
}

export function getGeometryImportDraftFieldValue(draft, size, key) {
  const field = fieldsByKey[key];
  if (!field) return null;
  return field.storage === "extended"
    ? draft?.extendedGeometryBySize?.[size]?.[key] ?? null
    : draft?.sizes?.[size]?.[key] ?? null;
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

  const sizes = getSelectedImportSizes(draft);
  const completenessBySize = Object.fromEntries(sizes.map((size) => [
    size,
    getGeometryDataCompleteness({
      officialGeometry: draft.sizes?.[size] ?? {},
      extendedGeometry: draft.extendedGeometryBySize?.[size] ?? {},
    }),
  ]));
  if (sizes.length === 0) errors.sizes = "未识别到可用尺码";
  if (draft?.entryMode === "manual" && sizes.some((size) => size === MANUAL_GEOMETRY_SIZE_PLACEHOLDER)) {
    errors.sizes = "请输入尺码名称";
  }

  for (const size of sizes) {
    const geometry = draft.sizes[size] ?? {};
    for (const key of CORE_GEOMETRY_FIELD_KEYS) {
      const field = fieldsByKey[key];
      const error = getGeometryImportFieldError(field, geometry[field.key]);
      if (error) errors[`sizes.${size}.${field.key}`] = error;
    }
  }

  const errorKeys = Object.keys(errors);
  const firstErrorKey = errorKeys[0] ?? null;
  const firstInvalidSize = firstErrorKey?.startsWith("sizes.")
    ? sizes.find((size) => firstErrorKey.startsWith(`sizes.${size}.`)) ?? null
    : null;

  return {
    isValid: errorKeys.length === 0,
    errors,
    errorCount: errorKeys.length,
    firstErrorKey,
    firstInvalidSize,
    completenessBySize,
  };
}

export function addGeometryImportDraftSize(draft, rawSize) {
  const size = String(rawSize ?? "").trim();
  if (!draft || !size) return draft;
  const alreadySelected = getSelectedImportSizes(draft).includes(size);
  if (alreadySelected && draft.candidateSizes?.[size]) return draft;
  const candidateSizes = { ...(draft.candidateSizes ?? draft.sizes ?? {}) };
  const candidateValueSources = { ...(draft.candidateValueSources ?? draft.valueSourcesBySize ?? {}) };
  const extendedGeometryBySize = { ...(draft.extendedGeometryBySize ?? {}) };
  if (!candidateSizes[size]) {
    candidateSizes[size] = createEmptyGeometry();
    candidateValueSources[size] = createEmptySources();
    extendedGeometryBySize[size] = {};
  }
  const selectedImportSizes = getSelectedImportSizes({ ...draft, candidateSizes });
  if (selectedImportSizes.includes(size)) {
    return { ...draft, candidateSizes, candidateValueSources, extendedGeometryBySize };
  }
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    candidateValueSources,
    extendedGeometryBySize,
    selectedSize: size,
  }, [...selectedImportSizes, size]);
}

export function renameGeometryImportDraftSize(draft, rawSize) {
  if (!draft) return draft;
  const currentSize = toSize(draft.selectedSize);
  const nextSize = toSize(rawSize) || MANUAL_GEOMETRY_SIZE_PLACEHOLDER;
  if (!currentSize || currentSize === nextSize) return draft;
  const candidateSizes = { ...(draft.candidateSizes ?? draft.sizes ?? {}) };
  const candidateValueSources = { ...(draft.candidateValueSources ?? draft.valueSourcesBySize ?? {}) };
  const extendedGeometryBySize = { ...(draft.extendedGeometryBySize ?? {}) };
  if (candidateSizes[nextSize]) return draft;
  const currentGeometry = draft.sizes?.[currentSize] ?? candidateSizes[currentSize] ?? createEmptyGeometry();
  const currentSources = draft.valueSourcesBySize?.[currentSize]
    ?? candidateValueSources[currentSize]
    ?? createEmptySources();
  delete candidateSizes[currentSize];
  delete candidateValueSources[currentSize];
  const currentExtendedGeometry = extendedGeometryBySize[currentSize] ?? {};
  delete extendedGeometryBySize[currentSize];
  candidateSizes[nextSize] = { ...currentGeometry };
  candidateValueSources[nextSize] = { ...currentSources };
  extendedGeometryBySize[nextSize] = { ...currentExtendedGeometry };
  const selectedImportSizes = getSelectedImportSizes(draft).map((size) => (
    size === currentSize ? nextSize : size
  ));
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    candidateValueSources,
    extendedGeometryBySize,
    selectedSize: nextSize,
  }, selectedImportSizes);
}

export function copyGeometryImportDraftSize(draft, rawSize) {
  const size = toSize(rawSize);
  if (!draft || !size || draft.candidateSizes?.[size]) return draft;
  const sourceGeometry = draft.sizes?.[draft.selectedSize];
  if (!sourceGeometry) return draft;
  const sourceValueSources = draft.valueSourcesBySize?.[draft.selectedSize] ?? createEmptySources();
  const candidateSizes = {
    ...(draft.candidateSizes ?? draft.sizes ?? {}),
    [draft.selectedSize]: { ...sourceGeometry },
    [size]: { ...sourceGeometry },
  };
  const candidateValueSources = {
    ...(draft.candidateValueSources ?? draft.valueSourcesBySize ?? {}),
    [draft.selectedSize]: { ...sourceValueSources },
    [size]: { ...sourceValueSources },
  };
  const sourceExtendedGeometry = draft.extendedGeometryBySize?.[draft.selectedSize] ?? {};
  const extendedGeometryBySize = {
    ...(draft.extendedGeometryBySize ?? {}),
    [draft.selectedSize]: { ...sourceExtendedGeometry },
    [size]: { ...sourceExtendedGeometry },
  };
  return applyImportSizeSelection({
    ...draft,
    candidateSizes,
    candidateValueSources,
    extendedGeometryBySize,
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

export function importGeometryToSizeData(size, geometry, options = {}) {
  const normalizedOptions = typeof options === "string"
    ? { valueSource: options }
    : options;
  const {
    valueSource = "ai",
    valueSources,
    category = "endurance",
    extendedGeometry = {},
    rawRows = [],
  } = normalizedOptions;
  const officialGeometry = createOfficialGeometry(geometry);
  return createStructuredGeometrySizeData({
    size: String(size),
    wheelSize: "700c",
    trailMm: null,
    standoverMm: null,
    officialGeometry,
  }, {
    category,
    valueSource,
    valueSources,
    extendedGeometry,
    rawRows,
  });
}

export function bikeToGeometryImportDraft(bike) {
  const sizes = Object.fromEntries(Object.entries(bike.geometryBySize ?? {}).map(([size, data]) => [
    String(size),
    createOfficialGeometry(data.officialGeometry ?? {
      stack: data.stackMm,
      reach: data.reachMm,
      effectiveTopTube: data.effectiveTopTubeMm,
      seatTubeLength: data.seatTubeLengthMm,
      seatTubeAngle: data.seatTubeAngleDeg,
      headTubeLength: data.headTubeLengthMm,
      headTubeAngle: data.headTubeAngleDeg,
      chainstay: data.chainstayMm,
      wheelbase: data.wheelbaseMm,
      bbDrop: data.bbDropMm,
      forkOffset: data.forkOffsetMm,
    }),
  ]));
  const valueSourcesBySize = Object.fromEntries(Object.entries(bike.geometryBySize ?? {}).map(([size, data]) => [
    String(size),
    cloneSources(data.valueSources),
  ]));
  const candidateSizes = Object.fromEntries(Object.entries(bike.importSource?.candidateSizes ?? sizes).map(([size, geometry]) => [
    String(size),
    cloneGeometry(geometry),
  ]));
  const candidateValueSources = Object.fromEntries(Object.entries(
    bike.importSource?.candidateValueSources ?? valueSourcesBySize,
  ).map(([size, sources]) => [String(size), cloneSources(sources)]));
  for (const [size, geometry] of Object.entries(sizes)) {
    candidateSizes[size] = cloneGeometry(geometry);
    candidateValueSources[size] = cloneSources(valueSourcesBySize[size]);
  }
  const selectedImportSizes = getSelectedImportSizes({
    candidateSizes,
    selectedImportSizes: bike.importSource?.selectedImportSizes ?? Object.keys(sizes),
    selectedSize: bike.size,
  });
  const allParserWarnings = bike.importSource?.parserWarnings ?? [];
  const { parserWarnings, parserNotices } = getScopedParserFeedback(allParserWarnings, selectedImportSizes);

  return {
    entryMode: bike.importSource?.entryMode ?? "ai",
    geometryValueSource: bike.importSource?.geometryValueSource ?? (bike.source === "preset" ? "official" : "ai"),
    brand: bike.brand,
    model: bike.model,
    category: normalizeBikeCategory(bike.category),
    candidateSizes,
    candidateValueSources,
    valueSourcesBySize: Object.fromEntries(selectedImportSizes.map((size) => [
      size,
      cloneSources(candidateValueSources[size]),
    ])),
    sizes: Object.fromEntries(selectedImportSizes.map((size) => [size, cloneGeometry(candidateSizes[size])])),
    completenessBySize: createCompletenessBySize(
      Object.fromEntries(selectedImportSizes.map((size) => [size, candidateSizes[size]])),
      bike.importSource?.extendedGeometryBySize,
    ),
    selectedImportSizes,
    selectedSize: selectedImportSizes.includes(String(bike.size)) ? String(bike.size) : selectedImportSizes[0] ?? "",
    detectedSizes: bike.importSource?.detectedSizes ?? Object.keys(candidateSizes),
    detectedSizeCount: bike.importSource?.detectedSizeCount ?? Object.keys(candidateSizes).length,
    rawRows: bike.importSource?.rawRows ?? [],
    extendedGeometryBySize: bike.importSource?.extendedGeometryBySize ?? {},
    allParserWarnings,
    parserWarnings,
    parserNotices,
    parserConfirmationCount: parserWarnings.length,
    unrecognizedFields: bike.importSource?.unrecognizedFields ?? [],
    parserMeta: bike.importSource?.parserMeta ?? null,
  };
}
