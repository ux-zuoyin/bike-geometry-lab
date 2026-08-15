import { productionGeometryParserClient } from "./geometryParserClient.js";
import {
  isBlockingGeometryParserWarning,
  scopeGeometryImportWarnings,
} from "../state/geometryImportState.js";
import { sortBikeSizes } from "../lib/geometry/sizeSorting.js";

const EXTENDED_GEOMETRY_ALIASES = Object.freeze([
  ["frontCenter", ["前轴距", "frontcenter"]],
  ["forkLength", ["前叉长度", "forklength", "axletocrown"]],
  ["trail", ["拖曳距", "trail"]],
  ["standover", ["跨高", "standoverheight", "standover"]],
]);

const normalizeExtendedLabel = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/^\s*[a-n]\s*[.\-—–－:：]\s*/i, "")
  .replace(/[\s/＿_\-—–－()（）:：·.,，]/g, "");

function getExtendedGeometryKey(sourceLabel) {
  const normalized = normalizeExtendedLabel(sourceLabel);
  return EXTENDED_GEOMETRY_ALIASES.find(([, aliases]) => (
    aliases.some((alias) => normalized.includes(alias))
  ))?.[0] ?? null;
}

function createExtendedGeometryBySize(response, detectedSizes) {
  const extendedBySize = Object.fromEntries(detectedSizes.map((size) => [size, {}]));
  for (const field of response.unrecognizedFields ?? []) {
    const key = getExtendedGeometryKey(field.sourceLabel);
    if (!key) continue;
    detectedSizes.forEach((size, index) => {
      const numericValue = Number(field.values?.[index]);
      if (Number.isFinite(numericValue)) extendedBySize[size][key] = numericValue;
    });
  }
  return extendedBySize;
}

function createParserDiagnostics(response) {
  if (!import.meta.env?.DEV) return undefined;
  const meta = response.meta && typeof response.meta === "object" ? response.meta : {};
  const rawRows = Array.isArray(response.rawRows) ? response.rawRows : [];
  const inputClassification = response.inputClassification && typeof response.inputClassification === "object"
    ? response.inputClassification
    : null;
  const diagnostics = {
    rawRows,
    inputClassification,
    provider: meta.provider ?? null,
    model: meta.model ?? null,
    requestId: meta.requestId ?? null,
    elapsedMs: meta.elapsedMs ?? null,
    parserProtocolVersion: meta.parserProtocolVersion ?? null,
  };

  if (typeof console !== "undefined") {
    console.group("Geometry Parser Diagnostics");
    console.log("Provider", diagnostics.provider);
    console.log("Model", diagnostics.model);
    console.log("Parser Protocol Version", diagnostics.parserProtocolVersion);
    console.log("Input Classification", inputClassification?.type ?? null);
    console.log("Detected Bike Type", inputClassification?.detectedBikeType ?? null);
    console.log("Classification Confidence", inputClassification?.confidence ?? null);
    console.log("Classification Reason", inputClassification?.reason ?? null);
    console.log("Detected Sizes", response.detectedSizes ?? []);
    console.log("Raw Row Count", rawRows.length);
    console.log("Raw Rows", rawRows.map((row) => ({ label: row.label, values: row.values })));
    console.log("Unrecognized Fields", response.unrecognizedFields ?? []);
    console.groupEnd();
  }

  return diagnostics;
}

function logParserClassificationError(error) {
  if (!import.meta.env?.DEV || typeof console === "undefined") return;
  const inputClassification = error?.details?.find?.((detail) => detail?.inputClassification)
    ?.inputClassification ?? null;
  if (!inputClassification) return;
  console.group("Geometry Parser Diagnostics");
  console.log("Input Classification", inputClassification.type ?? null);
  console.log("Detected Bike Type", inputClassification.detectedBikeType ?? null);
  console.log("Classification Confidence", inputClassification.confidence ?? null);
  console.log("Classification Reason", inputClassification.reason ?? null);
  console.groupEnd();
}

export function geometryParserResponseToDraft(response) {
  const candidateSizes = Object.fromEntries(
    response.sizes.map(({ size, geometry }) => [String(size), { ...geometry }]),
  );
  const candidateValueSources = Object.fromEntries(
    response.sizes.map(({ size, geometry }) => [String(size), Object.fromEntries(
      Object.entries(geometry).map(([key, value]) => [key, value == null ? null : "ai"]),
    )]),
  );
  const detectedSizes = response.detectedSizes?.map(String) ?? Object.keys(candidateSizes);
  const extractedExtendedGeometry = createExtendedGeometryBySize(response, detectedSizes);
  const extendedGeometryBySize = Object.fromEntries(detectedSizes.map((size) => [
    size,
    {
      ...extractedExtendedGeometry[size],
      ...(response.extendedGeometryBySize?.[size] ?? {}),
    },
  ]));
  const selectedImportSizes = sortBikeSizes(
    detectedSizes.filter((size) => candidateSizes[size]),
    { sourceOrder: detectedSizes },
  );
  const allParserWarnings = response.warnings ?? [];
  const scopedParserFeedback = scopeGeometryImportWarnings(allParserWarnings, selectedImportSizes);
  const parserWarnings = scopedParserFeedback.filter(isBlockingGeometryParserWarning);
  const parserNotices = scopedParserFeedback.filter((warning) => !isBlockingGeometryParserWarning(warning));
  const sizes = Object.fromEntries(selectedImportSizes.map((size) => [size, { ...candidateSizes[size] }]));
  const valueSourcesBySize = Object.fromEntries(selectedImportSizes.map((size) => [
    size,
    { ...candidateValueSources[size] },
  ]));

  const draft = {
    entryMode: "ai",
    geometryValueSource: "ai",
    brand: "",
    model: "",
    category: null,
    sizes,
    candidateSizes,
    valueSourcesBySize,
    candidateValueSources,
    selectedImportSizes,
    selectedSize: selectedImportSizes[0] ?? "",
    detectedSizes,
    detectedSizeCount: response.detectedSizeCount ?? detectedSizes.length,
    allParserWarnings,
    parserWarnings,
    parserNotices,
    parserConfirmationCount: parserWarnings.length,
    completenessBySize: response.completenessBySize ?? {},
    unrecognizedFields: response.unrecognizedFields ?? [],
    parserMeta: response.meta ?? null,
    rawRows: response.rawRows ?? [],
    extendedGeometryBySize,
  };
  const parserDiagnostics = createParserDiagnostics(response);
  return parserDiagnostics ? { ...draft, parserDiagnostics } : draft;
}

export async function analyzeGeometryImage(
  imageFile,
  { parserClient = productionGeometryParserClient, signal } = {},
) {
  if (typeof File === "undefined" || !(imageFile instanceof File)) {
    throw new Error("请选择有效的车架几何图片。");
  }

  try {
    const parsedResponse = await parserClient.parse(imageFile, { signal });
    return geometryParserResponseToDraft(parsedResponse);
  } catch (error) {
    logParserClassificationError(error);
    throw error;
  }
}
