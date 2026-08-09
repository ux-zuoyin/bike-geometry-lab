import { productionGeometryParserClient } from "./geometryParserClient.js";
import { scopeGeometryImportWarnings } from "../state/geometryImportState.js";

function createParserDiagnostics(response) {
  if (!import.meta.env?.DEV) return undefined;
  const meta = response.meta && typeof response.meta === "object" ? response.meta : {};
  const rawRows = Array.isArray(response.rawRows) ? response.rawRows : [];
  const diagnostics = {
    rawRows,
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
    console.log("Detected Sizes", response.detectedSizes ?? []);
    console.log("Raw Row Count", rawRows.length);
    console.log("Raw Rows", rawRows.map((row) => ({ label: row.label, values: row.values })));
    console.log("Unrecognized Fields", response.unrecognizedFields ?? []);
    console.groupEnd();
  }

  return diagnostics;
}

export function geometryParserResponseToDraft(response) {
  const candidateSizes = Object.fromEntries(
    response.sizes.map(({ size, geometry }) => [String(size), { ...geometry }]),
  );
  const detectedSizes = response.detectedSizes?.map(String) ?? Object.keys(candidateSizes);
  const selectedImportSizes = detectedSizes[0] ? [detectedSizes[0]] : [];
  const allParserWarnings = response.warnings ?? [];
  const parserWarnings = scopeGeometryImportWarnings(allParserWarnings, selectedImportSizes);
  const sizes = Object.fromEntries(selectedImportSizes.map((size) => [size, { ...candidateSizes[size] }]));

  const draft = {
    brand: "",
    model: "",
    category: "endurance",
    sizes,
    candidateSizes,
    selectedImportSizes,
    selectedSize: selectedImportSizes[0] ?? "",
    detectedSizes,
    detectedSizeCount: response.detectedSizeCount ?? detectedSizes.length,
    allParserWarnings,
    parserWarnings,
    parserConfirmationCount: parserWarnings.filter((warning) => ["CELL_UNRECOGNIZED", "SIZE_COLUMN_MISSING", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning.code)).length,
    unrecognizedFields: response.unrecognizedFields ?? [],
    parserMeta: response.meta ?? null,
    rawRows: response.rawRows ?? [],
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

  const parsedResponse = await parserClient.parse(imageFile, { signal });
  return geometryParserResponseToDraft(parsedResponse);
}
