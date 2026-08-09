export const GEOMETRY_IMPORT_STATUSES = Object.freeze([
  "analyzing",
  "review",
  "ready",
  "error",
]);

export const GEOMETRY_IMPORT_FIELDS = Object.freeze([
  { key: "stack", label: "Stack", unit: "mm", required: true, min: 1, max: 900 },
  { key: "reach", label: "Reach", unit: "mm", required: true, min: 1, max: 700 },
  { key: "effectiveTopTube", label: "Effective Top Tube", unit: "mm", required: false, min: 1, max: 800 },
  { key: "seatTubeLength", label: "Seat Tube", unit: "mm", required: true, min: 1, max: 900 },
  { key: "seatTubeAngle", label: "Seat Tube Angle", unit: "°", required: true, min: 60, max: 85 },
  { key: "headTubeLength", label: "Head Tube", unit: "mm", required: true, min: 1, max: 400 },
  { key: "headTubeAngle", label: "Head Tube Angle", unit: "°", required: true, min: 60, max: 85 },
  { key: "chainstay", label: "Chainstay", unit: "mm", required: true, min: 1, max: 700 },
  { key: "wheelbase", label: "Wheelbase", unit: "mm", required: true, min: 1, max: 1500 },
  { key: "bbDrop", label: "BB Drop", unit: "mm", required: true, min: 1, max: 150 },
  { key: "forkOffset", label: "Fork Offset", unit: "mm", required: false, min: 1, max: 120 },
]);

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

  const sizes = draft?.sizes ? Object.keys(draft.sizes) : [];
  if (sizes.length === 0) errors.sizes = "未识别到可用尺码";

  for (const size of sizes) {
    const geometry = draft.sizes[size] ?? {};
    for (const field of GEOMETRY_IMPORT_FIELDS) {
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
  if (!draft || !size || draft.sizes?.[size]) return draft;
  const emptyGeometry = Object.fromEntries(GEOMETRY_IMPORT_FIELDS.map(({ key }) => [key, null]));
  return {
    ...draft,
    sizes: { ...draft.sizes, [size]: emptyGeometry },
    selectedSize: size,
  };
}

export function importGeometryToSizeData(size, geometry) {
  return {
    size: String(size),
    wheelSize: "700c",
    seatTubeLengthMm: geometry.seatTubeLength,
    seatTubeAngleDeg: geometry.seatTubeAngle,
    headTubeLengthMm: geometry.headTubeLength,
    headTubeAngleDeg: geometry.headTubeAngle,
    effectiveTopTubeMm: geometry.effectiveTopTube ?? null,
    bbDropMm: geometry.bbDrop,
    chainstayMm: geometry.chainstay,
    forkOffsetMm: geometry.forkOffset ?? null,
    trailMm: null,
    wheelbaseMm: geometry.wheelbase,
    standoverMm: null,
    reachMm: geometry.reach,
    stackMm: geometry.stack,
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

  return {
    brand: bike.brand,
    model: bike.model,
    category: "endurance",
    sizes,
    selectedSize: String(bike.size),
  };
}
