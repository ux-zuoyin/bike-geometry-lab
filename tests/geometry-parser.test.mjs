import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CORE_GEOMETRY_FIELD_KEYS as PARSER_CORE_GEOMETRY_FIELD_KEYS,
  GEOMETRY_PARSER_FIELD_KEYS,
  GEOMETRY_PARSER_INPUT_TYPES,
  GEOMETRY_PARSER_PLAUSIBILITY_RANGES,
  GEOMETRY_PARSER_RAW_TABLE_SCHEMA,
  GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA,
  PRECISION_GEOMETRY_FIELD_KEYS,
} from "../src/services/geometryParserSchema.js";
import {
  GeometryParserValidationError,
  validateAndNormalizeGeometryParserResponse,
} from "../src/services/geometryParserValidator.js";
import { createGeometryParserClient } from "../src/services/geometryParserClient.js";
import {
  analyzeGeometryImage,
  geometryParserResponseToDraft,
} from "../src/services/geometryImageAnalyzer.js";
import {
  isGeometryImportPreviewSafe,
  resolveGeometryImportPreview,
  toggleGeometryImportSize,
} from "../src/state/geometryImportState.js";
import { createGeometryParserWorker } from "../worker/geometry-parser.js";
import { mapRawGeometryTableToParserResponse } from "../src/services/geometryParserRawTableMapper.js";
import { normalizeExplicitGeometryUnits } from "../src/services/geometryUnitNormalizer.js";
import {
  createQuickGeometryParserFixture,
  QUICK_GEOMETRY,
  QUICK_SIZES,
} from "./fixtures/quickGeometryParserResponse.js";
import {
  createQuickGeometryParserMisalignedResponse,
  createQuickGeometryParserPartialResponse,
} from "./fixtures/quickGeometryParserMisalignedResponse.js";
import { createQuickGeometryParserRawTableFixture } from "./fixtures/quickGeometryParserRawTableResponse.js";
import {
  CM_GEOMETRY_SIZES,
  createCmGeometryParserRawTableFixture,
} from "./fixtures/cmGeometryParserRawTableResponse.js";
import { getGeometryProvider } from "../worker/providers/geometryProviderRegistry.js";

const analyzerSource = readFileSync(new URL("../src/services/geometryImageAnalyzer.js", import.meta.url), "utf8");

function createPngFile(name = "quick-geometry.png") {
  return new File([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
  ], name, { type: "image/png" });
}

async function createProviderInput(file = createPngFile()) {
  return {
    imageBuffer: await file.arrayBuffer(),
    mimeType: "image/png",
    prompt: "Extract every size and return only one valid JSON Object.",
    schema: GEOMETRY_PARSER_RAW_TABLE_SCHEMA,
  };
}

const QWEN_TEST_ENV = Object.freeze({
  GEOMETRY_PARSER_PROVIDER: "qwen",
  DASHSCOPE_API_KEY: "test-qwen-secret",
  QWEN_GEOMETRY_MODEL: "qwen3-vl-flash",
  DASHSCOPE_COMPATIBLE_BASE_URL: "https://dashscope.example.test/compatible-mode/v1",
});

const createInputClassification = (type, overrides = {}) => ({
  type,
  confidence: 0.92,
  detectedBikeType: null,
  reason: null,
  ...overrides,
});

async function requestQwenFixture(structuredOutput, { onParse } = {}) {
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      id: "qwen",
      async parse() {
        onParse?.();
        return { structuredOutput, meta: { provider: "qwen", model: "fixture" } };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  return worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), { GEOMETRY_PARSER_PROVIDER: "qwen" });
}

test("raw-table provider schema requires source rows with aligned values", () => {
  assert.deepEqual(GEOMETRY_PARSER_INPUT_TYPES, [
    "road_bike_geometry", "unsupported_bike_geometry", "not_geometry", "unreadable",
  ]);
  assert.deepEqual(GEOMETRY_PARSER_RAW_TABLE_SCHEMA.required, ["inputClassification", "measurementContext"]);
  assert.deepEqual(
    GEOMETRY_PARSER_RAW_TABLE_SCHEMA.properties.inputClassification.properties.type.enum,
    GEOMETRY_PARSER_INPUT_TYPES,
  );
  const rawRowSchema = GEOMETRY_PARSER_RAW_TABLE_SCHEMA.properties.rawRows.items;
  assert.deepEqual(rawRowSchema.required, ["label", "unit", "explicitUnit", "values"]);
  assert.deepEqual(rawRowSchema.properties.explicitUnit.enum, ["mm", "cm", "inch", null]);
  assert.deepEqual(rawRowSchema.properties.values.items.type, ["number", "null"]);
  assert.deepEqual(
    GEOMETRY_PARSER_RAW_TABLE_SCHEMA.properties.measurementContext.properties.defaultLengthUnit.enum,
    ["mm", "cm", "inch", "unknown"],
  );

  const geometrySchema = GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA
    .properties.sizes.items.properties.geometry;
  assert.deepEqual(geometrySchema.required, GEOMETRY_PARSER_FIELD_KEYS);
  assert.equal(geometrySchema.additionalProperties, false);
  assert.deepEqual(geometrySchema.properties.stack.type, ["number", "null"]);
});

test("current Chinese cm table labels map deterministically before any unit handling", () => {
  const mapped = mapRawGeometryTableToParserResponse(createCmGeometryParserRawTableFixture());
  const xs = mapped.sizes.find(({ size }) => size === "XS").geometry;

  assert.deepEqual(mapped.detectedSizes, CM_GEOMETRY_SIZES);
  assert.deepEqual(xs, {
    seatTubeLength: 44.4,
    effectiveTopTube: 52,
    seatTubeAngle: 73.5,
    headTubeAngle: 71.3,
    headTubeLength: 10.6,
    chainstay: 42,
    wheelbase: 98.7,
    forkOffset: 5.3,
    bbDrop: 8,
    reach: 36.8,
    stack: 52.4,
  });
});

test("explicit centimetre context normalizes mapped lengths once and preserves angles", () => {
  const rawTable = createCmGeometryParserRawTableFixture();
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, rawTable.measurementContext);
  const validated = validateAndNormalizeGeometryParserResponse(normalized);
  const xs = validated.sizes.find(({ size }) => size === "XS").geometry;
  const draft = geometryParserResponseToDraft(validated);

  assert.deepEqual(xs, {
    seatTubeLength: 444,
    effectiveTopTube: 520,
    seatTubeAngle: 73.5,
    headTubeAngle: 71.3,
    headTubeLength: 106,
    chainstay: 420,
    wheelbase: 987,
    forkOffset: 53,
    bbDrop: 80,
    reach: 368,
    stack: 524,
  });
  assert.deepEqual(draft.candidateSizes.XS, xs);
  assert.deepEqual(validated.completenessBySize.XS.core, {
    total: 7,
    available: 7,
    complete: true,
  });
  assert.equal(validated.completenessBySize.XS.renderable, true);
  assert.equal(validated.extendedGeometryBySize.XS.trail, 62);
  assert.equal(validated.extendedGeometryBySize.XS.standover, 721);
  const unresolved = normalizeExplicitGeometryUnits(mapped, { defaultLengthUnit: "unknown" });
  assert.deepEqual(unresolved.sizes, mapped.sizes);
  assert.ok(unresolved.warnings.some(({ code, severity }) => (
    code === "LENGTH_UNIT_UNRESOLVED" && severity === "error"
  )));
});

test("explicit millimetre context is an identity transform for the complete QUICK baseline", () => {
  const rawTable = createQuickGeometryParserRawTableFixture();
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, { defaultLengthUnit: "mm" });
  const validated = validateAndNormalizeGeometryParserResponse(normalized);

  assert.strictEqual(normalized, mapped);
  assert.deepEqual(normalized, mapped);
  assert.deepEqual(validated.detectedSizes, QUICK_SIZES);
  for (const entry of validated.sizes) {
    assert.deepEqual(entry.geometry, QUICK_GEOMETRY[entry.size]);
  }
});

test("Synapse row-level centimetres override an unknown global unit", () => {
  const rawTable = {
    inputClassification: createInputClassification("road_bike_geometry"),
    measurementContext: { defaultLengthUnit: "unknown" },
    detectedSizeCount: 1,
    detectedSizes: ["54"],
    rawRows: [
      { label: "Stack (cm)", unit: "cm", explicitUnit: "cm", values: [57] },
      { label: "Reach (cm)", unit: "cm", explicitUnit: "cm", values: [38.1] },
      { label: "Head Tube Length (cm)", unit: "cm", explicitUnit: "cm", values: [15] },
      { label: "Head Tube Angle", unit: "°", explicitUnit: null, values: [71.3] },
      { label: "Seat Tube Angle", unit: "°", explicitUnit: null, values: [73] },
      { label: "Chain Stay Length (cm)", unit: "cm", explicitUnit: "cm", values: [42.5] },
      { label: "Bottom Bracket Drop (cm)", unit: "cm", explicitUnit: "cm", values: [7.3] },
    ],
  };
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, rawTable.measurementContext);
  const geometry = normalized.sizes[0].geometry;

  assert.equal(mapped.fieldUnits.stack.explicitUnit, "cm");
  assert.deepEqual({
    stack: geometry.stack,
    reach: geometry.reach,
    headTubeLength: geometry.headTubeLength,
    headTubeAngle: geometry.headTubeAngle,
    seatTubeAngle: geometry.seatTubeAngle,
    chainstay: geometry.chainstay,
    bbDrop: geometry.bbDrop,
  }, {
    stack: 570,
    reach: 381,
    headTubeLength: 150,
    headTubeAngle: 71.3,
    seatTubeAngle: 73,
    chainstay: 425,
    bbDrop: 73,
  });
});

test("Domane rows without explicit units inherit the global centimetre context", () => {
  const rawTable = createCmGeometryParserRawTableFixture();
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, rawTable.measurementContext);
  const geometry = normalized.sizes.find(({ size }) => size === "M").geometry;

  assert.equal(mapped.fieldUnits.stack.explicitUnit, null);
  assert.equal(mapped.fieldUnits.reach.explicitUnit, null);
  assert.deepEqual({
    stack: geometry.stack,
    reach: geometry.reach,
    headTubeLength: geometry.headTubeLength,
    headTubeAngle: geometry.headTubeAngle,
    seatTubeAngle: geometry.seatTubeAngle,
    chainstay: geometry.chainstay,
    bbDrop: geometry.bbDrop,
  }, {
    stack: 575,
    reach: 374,
    headTubeLength: 159,
    headTubeAngle: 71.2,
    seatTubeAngle: 73.5,
    chainstay: 420,
    bbDrop: 80,
  });
});

test("mixed explicit mm rows override a global cm unit and angles remain unchanged", () => {
  const rawTable = {
    detectedSizeCount: 1,
    detectedSizes: ["M"],
    rawRows: [
      { label: "Stack | mm", unit: "mm", explicitUnit: "mm", values: [575] },
      { label: "Reach", unit: null, explicitUnit: null, values: [37.4] },
      { label: "Head Tube Angle", unit: "°", explicitUnit: null, values: [71.2] },
    ],
  };
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, { defaultLengthUnit: "cm" });
  const geometry = normalized.sizes[0].geometry;

  assert.equal(geometry.stack, 575);
  assert.equal(geometry.reach, 374);
  assert.equal(geometry.headTubeAngle, 71.2);
});

test("a hallucinated legacy or explicit row unit without label evidence cannot override global cm", () => {
  const rawTable = {
    detectedSizeCount: 1,
    detectedSizes: ["M"],
    rawRows: [
      { label: "Stack", unit: "mm", explicitUnit: "mm", values: [57.5] },
    ],
  };
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, { defaultLengthUnit: "cm" });

  assert.equal(mapped.rawRows[0].unit, "mm");
  assert.equal(mapped.rawRows[0].explicitUnit, null);
  assert.equal(mapped.fieldUnits.stack.explicitUnit, null);
  assert.equal(normalized.sizes[0].geometry.stack, 575);
});

test("unknown length units preserve values without magnitude inference and emit a unit error", () => {
  const rawTable = {
    detectedSizeCount: 1,
    detectedSizes: ["M"],
    rawRows: [
      { label: "Stack", unit: null, explicitUnit: null, values: [57.5] },
      { label: "Head Tube Angle", unit: "°", explicitUnit: null, values: [71.2] },
    ],
  };
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const normalized = normalizeExplicitGeometryUnits(mapped, { defaultLengthUnit: "unknown" });

  assert.equal(normalized.sizes[0].geometry.stack, 57.5);
  assert.equal(normalized.sizes[0].geometry.headTubeAngle, 71.2);
  assert.deepEqual(normalized.warnings.find(({ code }) => code === "LENGTH_UNIT_UNRESOLVED"), {
    code: "LENGTH_UNIT_UNRESOLVED",
    message: "无法确定长度字段的明示单位：stack。请确认原图的行级或全局单位。",
    field: null,
    size: null,
    severity: "error",
  });
  assert.equal(
    validateAndNormalizeGeometryParserResponse(normalized).warnings
      .find(({ code }) => code === "LENGTH_UNIT_UNRESOLVED")?.severity,
    "error",
  );
});

test("raw QUICK table preserves Wheelbase and Fork Offset rows before deterministic mapping", () => {
  const rawTable = createQuickGeometryParserRawTableFixture();
  const mapped = mapRawGeometryTableToParserResponse(rawTable);
  const result = validateAndNormalizeGeometryParserResponse(mapped);
  const wheelbaseRow = result.rawRows.find(({ label }) => label === "G 轮轴距");
  const forkOffsetRow = result.rawRows.find(({ label }) => label === "H 前叉调节量");

  assert.deepEqual(wheelbaseRow.values, [986, 988, 998.5, 999, 1013]);
  assert.deepEqual(forkOffsetRow.values, [45, 45, 45, 45, 45]);
  assert.equal(result.sizes.find(({ size }) => size === "430").geometry.wheelbase, 986);
  assert.equal(result.sizes.find(({ size }) => size === "430").geometry.forkOffset, 45);
  assert.equal(result.sizes.find(({ size }) => size === "550").geometry.wheelbase, 1013);
  assert.equal(result.sizes.find(({ size }) => size === "550").geometry.forkOffset, 45);
  assert.deepEqual(result.unrecognizedFields.find(({ sourceLabel }) => sourceLabel === "跨高"), {
    sourceLabel: "跨高",
    reason: "Standover / 跨高不属于当前 Geometry Schema。",
    unit: "mm",
    values: [725, 747, 769, 790, 812],
  });
});

test("mapper gives Specialized-specific labels precedence and preserves non-schema semantics", () => {
  const mapped = mapRawGeometryTableToParserResponse({
    detectedSizeCount: 1,
    detectedSizes: ["52"],
    rawRows: [
      { label: "车架堆高", unit: "mm", values: [555] },
      { label: "把立堆高", unit: "mm", values: [40] },
      { label: "车架前伸量", unit: "mm", values: [380] },
      { label: "把立前伸量", unit: "mm", values: [80] },
      { label: "立管长度", unit: "mm", values: [470] },
      { label: "立管角度", unit: "°", values: [73.5] },
      { label: "上管长度，水平", unit: "mm", values: [535] },
      { label: "轴距", unit: "mm", values: [997] },
      { label: "前轴距", unit: "mm", values: [590] },
      { label: "前叉偏移量", unit: "mm", values: [44] },
      { label: "中轴下沉", unit: "mm", values: [72] },
      { label: "拖曳距", unit: "mm", values: [58] },
      { label: "跨高", unit: "mm", values: [760] },
    ],
  });
  const geometry = mapped.sizes[0].geometry;

  assert.equal(geometry.stack, 555);
  assert.equal(geometry.reach, 380);
  assert.equal(geometry.seatTubeLength, 470);
  assert.equal(geometry.seatTubeAngle, 73.5);
  assert.equal(geometry.effectiveTopTube, 535);
  assert.equal(geometry.wheelbase, 997);
  assert.equal(geometry.forkOffset, 44);
  assert.equal(geometry.bbDrop, 72);
  assert.deepEqual(mapped.unrecognizedFields.map(({ sourceLabel, reason }) => ({ sourceLabel, reason })), [
    { sourceLabel: "把立堆高", reason: "把立堆高不属于车架 Stack，已禁止映射。" },
    { sourceLabel: "把立前伸量", reason: "把立前伸量不属于车架 Reach，已禁止映射。" },
    { sourceLabel: "前轴距", reason: "Front Center / 前轴距属于 Precision Geometry，已保留且不会映射为 Wheelbase。" },
    { sourceLabel: "拖曳距", reason: "Trail / 拖曳距不属于当前 Geometry Schema。" },
    { sourceLabel: "跨高", reason: "Standover / 跨高不属于当前 Geometry Schema。" },
  ]);
  assert.equal(mapped.extendedGeometryBySize[52].frontCenter, 590);
  assert.equal(mapped.extendedGeometryBySize[52].trail, 58);
  assert.equal(mapped.extendedGeometryBySize[52].standover, 760);
});

test("ETT semantic priority beats source order, generic Top Tube, and Top Tube Actual", () => {
  const mapped = mapRawGeometryTableToParserResponse({
    detectedSizeCount: 1,
    detectedSizes: ["54"],
    rawRows: [
      { label: "Top Tube Actual", unit: "mm", values: [515] },
      { label: "Top Tube Length", unit: "mm", values: [520] },
      { label: "Effective Top Tube", unit: "mm", values: [525] },
      { label: "Horizontal Top Tube", unit: "mm", values: [530] },
      { label: "Top Tube Horizontal", unit: "mm", values: [535] },
    ],
  });

  assert.equal(mapped.sizes[0].geometry.effectiveTopTube, 535);
  assert.equal(mapped.extendedGeometryBySize[54].topTubeActual, 515);
  assert.ok(mapped.warnings.some(({ code, field }) => code === "RAW_ROW_DUPLICATE_FIELD" && field === "effectiveTopTube"));
});

test("QUICK fixture preserves all five official size labels and benchmark columns", () => {
  const result = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserFixture());
  assert.deepEqual(result.detectedSizes, QUICK_SIZES);
  assert.equal(result.detectedSizeCount, 5);
  assert.equal(result.confirmationCount, 0);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.sizes.find(({ size }) => size === "430").geometry.wheelbase, 986);
  assert.equal(result.sizes.find(({ size }) => size === "430").geometry.forkOffset, 45);
  for (const entry of result.sizes) assert.deepEqual(entry.geometry, QUICK_GEOMETRY[entry.size]);
  for (const field of GEOMETRY_PARSER_FIELD_KEYS) assert.equal(result.fieldColumnCounts[field], 5);
});

test("validator recomputes field counts, retains null cells, and never drops a size", () => {
  const raw = createQuickGeometryParserFixture();
  raw.sizes[4].geometry.stack = null;
  raw.fieldColumnCounts.stack = 5;
  const result = validateAndNormalizeGeometryParserResponse(raw);

  assert.deepEqual(result.detectedSizes, QUICK_SIZES);
  assert.equal(result.sizes.length, 5);
  assert.equal(result.sizes[4].size, "550");
  assert.equal(result.sizes[4].geometry.stack, null);
  assert.equal(result.fieldColumnCounts.stack, 4);
  assert.ok(result.warnings.some(({ code, field, size }) => code === "CELL_UNRECOGNIZED" && field === "stack" && size === "550"));
  assert.ok(result.warnings.some(({ code, field }) => code === "COLUMN_COUNT_MISMATCH" && field === "stack"));
  assert.ok(result.warnings.some(({ code, field }) => code === "REPORTED_COLUMN_COUNT_MISMATCH" && field === "stack"));
});

test("validator flags the real QUICK standover-to-BB-Drop regression without passing 812 into Draft Preview", () => {
  const result = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserMisalignedResponse());
  const size550 = result.sizes.find(({ size }) => size === "550");
  const rangeWarning = result.warnings.find(({ code, field, size }) => (
    code === "GEOMETRY_VALUE_OUT_OF_RANGE" && field === "bbDrop" && size === "550"
  ));

  assert.equal(size550.geometry.bbDrop, 812);
  assert.equal(size550.geometry.forkOffset, 73);
  assert.deepEqual(rangeWarning, {
    code: "GEOMETRY_VALUE_OUT_OF_RANGE",
    field: "bbDrop",
    size: "550",
    value: 812,
    message: "550 尺码的 BB Drop 识别为 812 mm，数值明显异常，请核对。",
    severity: "error",
  });
  assert.equal(result.confirmationCount, 1);

  assert.equal(isGeometryImportPreviewSafe(size550.geometry), false);
  const preview = resolveGeometryImportPreview(size550.geometry);
  assert.equal(preview.officialGeometry.bbDrop, 812);
  assert.equal(preview.completeness.core.available, 6);
  assert.equal(preview.completeness.renderable, false);
  assert.equal(preview.geometry, null);
});

test("validator applies every mapped Geometry plausibility guardrail", () => {
  for (const field of GEOMETRY_PARSER_FIELD_KEYS) {
    const range = GEOMETRY_PARSER_PLAUSIBILITY_RANGES[field];
    const raw = createQuickGeometryParserFixture();
    raw.sizes[0].geometry[field] = range.max + 1;
    const result = validateAndNormalizeGeometryParserResponse(raw);
    assert.ok(result.warnings.some((item) => (
      item.code === "GEOMETRY_VALUE_OUT_OF_RANGE"
      && item.field === field
      && item.size === "430"
      && item.value === range.max + 1
    )), `${field} should reject ${range.max + 1}`);
  }
});

test("partial QUICK response retains 430 and warns for missing Wheelbase and Fork Offset", () => {
  const result = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserPartialResponse());
  const size430 = result.sizes.find(({ size }) => size === "430");

  assert.deepEqual(result.detectedSizes, QUICK_SIZES);
  assert.equal(size430.geometry.wheelbase, null);
  assert.equal(size430.geometry.forkOffset, null);
  assert.ok(result.warnings.some(({ code, field, size }) => code === "CELL_UNRECOGNIZED" && field === "wheelbase" && size === "430"));
  assert.ok(result.warnings.some(({ code, field, size }) => code === "CELL_UNRECOGNIZED" && field === "forkOffset" && size === "430"));
  assert.equal(result.warnings.find(({ code, field, size }) => code === "CELL_UNRECOGNIZED" && field === "wheelbase" && size === "430").severity, "info");
  assert.equal(result.confirmationCount, 0);

  const preview = resolveGeometryImportPreview(geometryParserResponseToDraft(result).sizes["430"]);
  assert.equal(preview.isValid, true);
  assert.equal(preview.officialGeometry.wheelbase, null);
  assert.equal(preview.officialGeometry.forkOffset, null);
  assert.equal(preview.geometry.wheelbase, 1010);
  assert.equal(preview.geometrySources.wheelbase, "template");
  assert.equal(preview.geometry.forkOffset, null);
  assert.equal(preview.geometrySources.forkOffset, null);
  assert.equal(preview.geometryCompleteness.renderable, true);
  assert.equal(preview.renderGeometryFidelity, "approximate");
  const draft = geometryParserResponseToDraft(result);
  assert.equal(draft.parserWarnings.length, 0);
  assert.ok(draft.parserNotices.some(({ field }) => field === "wheelbase"));
});

test("Core and Precision definitions remain explicit and non-overlapping", () => {
  assert.deepEqual(PARSER_CORE_GEOMETRY_FIELD_KEYS, [
    "stack", "reach", "headTubeLength", "headTubeAngle", "seatTubeAngle", "chainstay", "bbDrop",
  ]);
  assert.deepEqual(PRECISION_GEOMETRY_FIELD_KEYS, [
    "wheelbase", "effectiveTopTube", "seatTubeLength", "forkOffset", "frontCenter", "forkLength",
  ]);
  assert.deepEqual(PARSER_CORE_GEOMETRY_FIELD_KEYS.filter((key) => PRECISION_GEOMETRY_FIELD_KEYS.includes(key)), []);
});

test("validator uses detectedSizes as source order without shifting keyed geometry", () => {
  const raw = createQuickGeometryParserFixture();
  raw.sizes.reverse();
  const result = validateAndNormalizeGeometryParserResponse(raw);
  assert.deepEqual(result.sizes.map(({ size }) => size), QUICK_SIZES);
  assert.equal(result.sizes[0].geometry.stack, 532.8);
  assert.equal(result.sizes[4].geometry.stack, 610.6);
  assert.ok(result.warnings.some(({ code }) => code === "SIZE_ORDER_NORMALIZED"));
});

test("validator rejects duplicate or unalignable size columns", () => {
  const duplicated = createQuickGeometryParserFixture();
  duplicated.detectedSizes[4] = "520";
  assert.throws(
    () => validateAndNormalizeGeometryParserResponse(duplicated),
    (error) => error instanceof GeometryParserValidationError && error.code === "DUPLICATE_SIZE",
  );

  const mismatched = createQuickGeometryParserFixture();
  mismatched.sizes[4].size = "580";
  assert.throws(
    () => validateAndNormalizeGeometryParserResponse(mismatched),
    (error) => error instanceof GeometryParserValidationError && error.code === "SIZE_SET_MISMATCH",
  );
});

test("production client uploads the current File as multipart and returns parser JSON", async () => {
  const fixture = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserFixture());
  let uploadedFile = null;
  const client = createGeometryParserClient({
    endpoint: "https://parser.example.test/api/geometry/parse",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://parser.example.test/api/geometry/parse");
      assert.equal(options.method, "POST");
      uploadedFile = options.body.get("image");
      return Response.json(fixture);
    },
  });
  const file = createPngFile();
  const response = await client.parse(file);
  assert.equal(uploadedFile.name, file.name);
  assert.equal(uploadedFile.size, file.size);
  assert.deepEqual(response.detectedSizes, QUICK_SIZES);
});

test("production client preserves classified business error codes", async () => {
  const client = createGeometryParserClient({
    endpoint: "https://parser.example.test/api/geometry/parse",
    fetchImpl: async () => Response.json({
      error: {
        code: "NOT_GEOMETRY_IMAGE",
        message: "这似乎不是车架几何图，请上传包含尺码与 Geometry 参数的公路车官方几何表。",
        details: [{
          inputClassification: createInputClassification("not_geometry"),
        }],
      },
    }, { status: 422 }),
  });

  await assert.rejects(
    () => client.parse(createPngFile()),
    (error) => (
      error.code === "NOT_GEOMETRY_IMAGE"
      && error.status === 422
      && error.details[0].inputClassification.type === "not_geometry"
    ),
  );
});

test("analyzer uses an injected parser and maps response into the existing draft schema", async () => {
  const fixture = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserFixture());
  let receivedFile = null;
  const parserClient = {
    async parse(file) {
      receivedFile = file;
      return fixture;
    },
  };
  const file = createPngFile();
  const draft = await analyzeGeometryImage(file, { parserClient });
  assert.strictEqual(receivedFile, file);
  assert.deepEqual(Object.keys(draft.sizes), QUICK_SIZES);
  assert.deepEqual(Object.keys(draft.candidateSizes), QUICK_SIZES);
  assert.deepEqual(draft.selectedImportSizes, QUICK_SIZES);
  assert.equal(draft.candidateSizes["550"].stack, 610.6);
  assert.equal(draft.selectedSize, "430");
  assert.equal(draft.category, null);
  assert.equal(draft.parserWarnings.length, 0);
  assert.doesNotMatch(analyzerSource, /createMockGeometryImportDraft|mockGeometryImport/);
});

test("AI draft marks recognized values as ai and retains precision rows as extended geometry", () => {
  const rawTable = createQuickGeometryParserRawTableFixture();
  rawTable.rawRows.push({
    label: "Front Center",
    unit: "mm",
    values: [575, 580, 590, 600, 615],
  });
  rawTable.rawRows.push({
    label: "Axle to Crown",
    unit: "mm",
    values: [370, 372, 374, 376, 378],
  });
  const parsed = validateAndNormalizeGeometryParserResponse(
    mapRawGeometryTableToParserResponse(rawTable),
  );
  const draft = geometryParserResponseToDraft(parsed);

  assert.equal(draft.geometryValueSource, "ai");
  assert.equal(draft.valueSourcesBySize["430"].stack, "ai");
  assert.equal(draft.candidateValueSources["430"].wheelbase, "ai");
  assert.equal(draft.extendedGeometryBySize["430"].frontCenter, 575);
  assert.equal(draft.extendedGeometryBySize["430"].forkLength, 370);
  assert.equal(draft.extendedGeometryBySize["430"].standover, 725);
  assert.deepEqual(draft.completenessBySize["430"].precision, { total: 6, available: 6 });
  assert.ok(draft.rawRows.some(({ label }) => label === "Front Center"));
});

test("provider registry explicitly selects qwen or openai and rejects invalid values", () => {
  const fetchImpl = async () => {
    throw new Error("provider selection must not make a request");
  };
  assert.equal(getGeometryProvider({ GEOMETRY_PARSER_PROVIDER: "qwen" }, { fetchImpl }).id, "qwen");
  assert.equal(getGeometryProvider({ GEOMETRY_PARSER_PROVIDER: "openai" }, { fetchImpl }).id, "openai");
  assert.throws(
    () => getGeometryProvider({ GEOMETRY_PARSER_PROVIDER: "automatic" }, { fetchImpl }),
    (error) => error.code === "PARSER_PROVIDER_INVALID" && error.status === 503,
  );
  assert.throws(
    () => getGeometryProvider({}, { fetchImpl }),
    (error) => error.code === "PARSER_PROVIDER_INVALID" && error.status === 503,
  );
});

test("qwen provider requires DASHSCOPE_API_KEY without making a request", async () => {
  let requestCount = 0;
  const provider = getGeometryProvider({
    GEOMETRY_PARSER_PROVIDER: "qwen",
    DASHSCOPE_COMPATIBLE_BASE_URL: QWEN_TEST_ENV.DASHSCOPE_COMPATIBLE_BASE_URL,
  }, {
    fetchImpl: async () => {
      requestCount += 1;
      return Response.json({});
    },
  });
  const input = await createProviderInput();

  await assert.rejects(
    () => provider.parse(input),
    (error) => error.code === "PARSER_NOT_CONFIGURED" && error.status === 503,
  );
  assert.equal(requestCount, 0);
});

test("qwen provider sends image bytes in non-thinking JSON Object mode", async () => {
  const fixture = createQuickGeometryParserRawTableFixture();
  let providerRequest = null;
  const provider = getGeometryProvider(QWEN_TEST_ENV, {
    fetchImpl: async (url, options) => {
      providerRequest = { url, body: JSON.parse(options.body) };
      return Response.json({
        id: "qwen-response-id",
        choices: [{ message: { content: JSON.stringify(fixture) } }],
        usage: { prompt_tokens: 123, completion_tokens: 45, total_tokens: 168 },
      }, { headers: { "x-request-id": "qwen-request-id" } });
    },
  });

  const result = await provider.parse(await createProviderInput());

  assert.equal(providerRequest.url, "https://dashscope.example.test/compatible-mode/v1/chat/completions");
  assert.equal(providerRequest.body.model, "qwen3-vl-flash");
  assert.equal(providerRequest.body.enable_thinking, false);
  assert.deepEqual(providerRequest.body.response_format, { type: "json_object" });
  assert.match(providerRequest.body.messages[0].content[0].text, /valid JSON Object/);
  assert.match(providerRequest.body.messages[0].content[0].text, /rawRows/);
  assert.match(providerRequest.body.messages[1].content[1].text, /Classify this image first/);
  assert.match(providerRequest.body.messages[1].content[0].image_url.url, /^data:image\/png;base64,/);
  assert.deepEqual(result.structuredOutput.detectedSizes, QUICK_SIZES);
  assert.equal(result.meta.provider, "qwen");
  assert.equal(result.meta.model, "qwen3-vl-flash");
  assert.equal(result.meta.requestId, "qwen-request-id");
  assert.equal(result.meta.usage.total_tokens, 168);
  assert.ok(result.meta.elapsedMs >= 0);
});

test("qwen provider rejects invalid JSON output", async () => {
  const provider = getGeometryProvider(QWEN_TEST_ENV, {
    fetchImpl: async () => Response.json({
      choices: [{ message: { content: "not valid json" } }],
    }),
  });
  const input = await createProviderInput();

  await assert.rejects(
    () => provider.parse(input),
    (error) => error.code === "MODEL_OUTPUT_INVALID" && error.status === 422,
  );
});

test("qwen provider maps exhausted free quota without fallback", async () => {
  const provider = getGeometryProvider(QWEN_TEST_ENV, {
    fetchImpl: async () => Response.json({
      error: {
        code: "AllocationQuota.FreeTierOnly",
        message: "Free tier quota exhausted",
      },
    }, { status: 429, headers: { "x-request-id": "quota-request-id" } }),
  });
  const input = await createProviderInput();

  await assert.rejects(
    () => provider.parse(input),
    (error) => (
      error.code === "FREE_QUOTA_EXHAUSTED"
      && error.status === 429
      && error.message === "百炼免费额度已用完，解析请求已停止。"
      && error.details[0].requestId === "quota-request-id"
    ),
  );
});

test("openai provider preserves the extracted Responses request contract", async () => {
  const fixture = createQuickGeometryParserFixture();
  let providerRequest = null;
  const provider = getGeometryProvider({
    GEOMETRY_PARSER_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-secret",
    OPENAI_GEOMETRY_MODEL: "gpt-5.6-terra",
    OPENAI_GEOMETRY_REASONING_EFFORT: "low",
  }, {
    fetchImpl: async (url, options) => {
      providerRequest = { url, body: JSON.parse(options.body) };
      return Response.json({
        output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(fixture) }] }],
      });
    },
  });

  const result = await provider.parse(await createProviderInput());

  assert.equal(providerRequest.url, "https://api.openai.com/v1/responses");
  assert.equal(providerRequest.body.model, "gpt-5.6-terra");
  assert.deepEqual(providerRequest.body.reasoning, { effort: "low" });
  assert.equal(providerRequest.body.text.format.type, "json_schema");
  assert.equal(providerRequest.body.text.format.strict, true);
  assert.match(providerRequest.body.input[0].content[1].image_url, /^data:image\/png;base64,/);
  assert.deepEqual(result.structuredOutput.detectedSizes, QUICK_SIZES);
  assert.equal(result.meta.provider, "openai");
});

test("worker validates an injected fixture provider result without network access", async () => {
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      id: "fixture",
      async parse() {
        return {
          structuredOutput: createQuickGeometryParserFixture(),
          meta: { provider: "fixture", model: "quick" },
        };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), {});
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.detectedSizeCount, 5);
  assert.deepEqual(payload.detectedSizes, QUICK_SIZES);
  assert.equal(payload.meta.provider, "fixture");
  assert.equal(payload.meta.parserProtocolVersion, "raw-table-v3-explicit-unit");
  assert.equal(response.headers.get("X-Geometry-Parser-Protocol"), "raw-table-v3-explicit-unit");
});

test("road-bike classification enters Raw Table mapping with one provider request", async () => {
  let providerCalls = 0;
  const response = await requestQwenFixture(createQuickGeometryParserRawTableFixture(), {
    onParse: () => { providerCalls += 1; },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(providerCalls, 1);
  assert.equal(payload.inputClassification.type, "road_bike_geometry");
  assert.deepEqual(payload.detectedSizes, QUICK_SIZES);
  assert.equal(payload.sizes[0].geometry.wheelbase, 986);
});

test("qwen raw-table path applies only an explicit centimetre context before validation", async () => {
  const response = await requestQwenFixture(createCmGeometryParserRawTableFixture());
  const payload = await response.json();
  const xs = payload.sizes.find(({ size }) => size === "XS").geometry;

  assert.equal(response.status, 200);
  assert.equal(payload.meta.parserProtocolVersion, "raw-table-v3-explicit-unit");
  assert.equal(payload.schemaVersion, "2");
  assert.equal(payload.measurementContext.defaultLengthUnit, "cm");
  assert.equal(payload.fieldUnits.stack.explicitUnit, null);
  assert.equal(xs.stack, 524);
  assert.equal(xs.reach, 368);
  assert.equal(xs.seatTubeLength, 444);
  assert.equal(xs.headTubeAngle, 71.3);
});

test("qwen rejects normalized output that omits required rawRows", async () => {
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      async parse() {
        return {
          structuredOutput: {
            ...createQuickGeometryParserFixture(),
            inputClassification: createInputClassification("road_bike_geometry"),
          },
          meta: { provider: "qwen" },
        };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), { GEOMETRY_PARSER_PROVIDER: "qwen" });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "RAW_TABLE_REQUIRED");
  assert.equal(payload.error.message, "模型未返回完整原始几何表结构，请重新识别。");
  assert.equal(payload.sizes, undefined);
});

test("qwen rejects an empty raw table before deterministic mapping", async () => {
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      async parse() {
        return {
          structuredOutput: {
            inputClassification: createInputClassification("road_bike_geometry"),
            detectedSizeCount: 5,
            detectedSizes: QUICK_SIZES,
            rawRows: [],
          },
          meta: { provider: "qwen" },
        };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), { GEOMETRY_PARSER_PROVIDER: "qwen" });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "RAW_TABLE_REQUIRED");
});

test("not-geometry classification returns NOT_GEOMETRY_IMAGE without requiring rawRows", async () => {
  const response = await requestQwenFixture({
    inputClassification: createInputClassification("not_geometry", {
      reason: "The image is a resume screenshot without a geometry table.",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "NOT_GEOMETRY_IMAGE");
  assert.equal(payload.error.details[0].inputClassification.type, "not_geometry");
  assert.doesNotMatch(payload.error.code, /RAW_TABLE/);
});

test("unsupported bicycle classification returns UNSUPPORTED_BIKE_TYPE", async () => {
  const response = await requestQwenFixture({
    inputClassification: createInputClassification("unsupported_bike_geometry", {
      detectedBikeType: "mountain bike",
      reason: "The table is for an MTB frame.",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "UNSUPPORTED_BIKE_TYPE");
  assert.equal(payload.error.details[0].inputClassification.detectedBikeType, "mountain bike");
});

test("unreadable classification returns GEOMETRY_IMAGE_UNREADABLE", async () => {
  const response = await requestQwenFixture({
    inputClassification: createInputClassification("unreadable", {
      confidence: 0.61,
      reason: "The size columns are severely cropped.",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "GEOMETRY_IMAGE_UNREADABLE");
});

test("an ordinary bicycle photo without a Geometry table remains not_geometry", async () => {
  const response = await requestQwenFixture({
    inputClassification: createInputClassification("not_geometry", {
      detectedBikeType: "road bicycle photo",
      reason: "A bicycle is visible, but there are no size columns or Geometry parameters.",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "NOT_GEOMETRY_IMAGE");
  assert.match(payload.error.details[0].inputClassification.reason, /no size columns or Geometry parameters/);
});

test("qwen rejects raw rows whose value count does not match the detected sizes", async () => {
  const malformedRawTable = createQuickGeometryParserRawTableFixture();
  malformedRawTable.rawRows.find(({ label }) => label === "G 轮轴距").values.pop();
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      async parse() {
        return { structuredOutput: malformedRawTable, meta: { provider: "qwen" } };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), { GEOMETRY_PARSER_PROVIDER: "qwen" });
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "RAW_TABLE_COLUMN_COUNT_MISMATCH");
  assert.deepEqual(payload.error.details, [{
    rowIndex: 6,
    label: "G 轮轴距",
    valueCount: 4,
    detectedSizeCount: 5,
  }]);
});

test("qwen requires an explicit-unit field for every road-bike raw row", async () => {
  const rawTable = createQuickGeometryParserRawTableFixture();
  delete rawTable.rawRows[0].explicitUnit;
  const response = await requestQwenFixture(rawTable);
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "RAW_TABLE_ROW_EXPLICIT_UNIT_INVALID");
  assert.deepEqual(payload.error.details, [{ rowIndex: 0, label: "尺寸/座管长度" }]);
});

test("worker requests raw table extraction and maps source labels deterministically", async () => {
  let receivedPrompt = "";
  let receivedSchema = null;
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      id: "fixture",
      async parse({ prompt, schema }) {
        receivedPrompt = prompt;
        receivedSchema = schema;
        return { structuredOutput: createQuickGeometryParserRawTableFixture(), meta: { provider: "fixture" } };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), {});

  assert.equal(response.status, 200);
  assert.equal(receivedSchema, GEOMETRY_PARSER_RAW_TABLE_SCHEMA);
  assert.match(receivedPrompt, /rawRows/);
  assert.match(receivedPrompt, /The presence of a bicycle alone is never enough/);
  assert.match(receivedPrompt, /gravel/);
  assert.match(receivedPrompt, /preserve the source label text/);
  assert.match(receivedPrompt, /Do not infer a row's meaning from diagram letters/);
});

test("qwen failure never calls openai or substitutes mock data", async () => {
  const requestedUrls = [];
  const worker = createGeometryParserWorker({
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      return Response.json({ error: { code: "InternalError" } }, { status: 500 });
    },
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), {
    ...QWEN_TEST_ENV,
    OPENAI_API_KEY: "must-not-be-used",
  });
  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.equal(payload.error.code, "MODEL_REQUEST_FAILED");
  assert.equal(payload.sizes, undefined);
  assert.deepEqual(requestedUrls, ["https://dashscope.example.test/compatible-mode/v1/chat/completions"]);
});

test("worker requires a server-side API key before accepting an analysis", async () => {
  const worker = createGeometryParserWorker();
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), {
    GEOMETRY_PARSER_PROVIDER: "qwen",
    DASHSCOPE_COMPATIBLE_BASE_URL: QWEN_TEST_ENV.DASHSCOPE_COMPATIBLE_BASE_URL,
  });
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.error.code, "PARSER_NOT_CONFIGURED");
});

test("worker ignores model-reported field counts and returns its own recomputation", async () => {
  const fixture = createQuickGeometryParserFixture();
  fixture.fieldColumnCounts.stack = 3;
  const worker = createGeometryParserWorker({
    providerResolver: () => ({
      id: "fixture",
      async parse() {
        return { structuredOutput: fixture, meta: { provider: "fixture" } };
      },
    }),
  });
  const formData = new FormData();
  formData.append("image", createPngFile());
  const response = await worker.fetch(new Request("https://parser.example.test/api/geometry/parse", {
    method: "POST",
    body: formData,
  }), {});
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.fieldColumnCounts.stack, 5);
  assert.ok(payload.warnings.some(({ code, field }) => code === "REPORTED_COLUMN_COUNT_MISMATCH" && field === "stack"));
});

test("draft adapter preserves official size strings and parser warnings", () => {
  const fixture = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserFixture());
  fixture.warnings.push({ code: "TEST", message: "550 尺码 Stack 未可靠识别。", field: "stack", size: "550", severity: "error" });
  let draft = geometryParserResponseToDraft(fixture);
  assert.deepEqual(Object.keys(draft.sizes), QUICK_SIZES);
  assert.deepEqual(Object.keys(draft.candidateSizes), QUICK_SIZES);
  assert.deepEqual(draft.selectedImportSizes, QUICK_SIZES);
  assert.equal(draft.detectedSizeCount, 5);
  assert.equal(draft.parserWarnings.length, 1);
  assert.equal(draft.allParserWarnings[0].size, "550");
  draft = toggleGeometryImportSize(draft, "550");
  assert.deepEqual(draft.selectedImportSizes, ["430", "460", "490", "520"]);
  assert.equal(draft.parserWarnings.length, 0);
  assert.equal(draft.allParserWarnings.length, 1);
});
