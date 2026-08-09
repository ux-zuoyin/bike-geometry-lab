import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  GEOMETRY_PARSER_FIELD_KEYS,
  GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA,
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
import { createGeometryParserWorker } from "../worker/geometry-parser.js";
import {
  createQuickGeometryParserFixture,
  QUICK_GEOMETRY,
  QUICK_SIZES,
} from "./fixtures/quickGeometryParserResponse.js";
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
    schema: GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA,
  };
}

const QWEN_TEST_ENV = Object.freeze({
  GEOMETRY_PARSER_PROVIDER: "qwen",
  DASHSCOPE_API_KEY: "test-qwen-secret",
  QWEN_GEOMETRY_MODEL: "qwen3-vl-flash",
  DASHSCOPE_COMPATIBLE_BASE_URL: "https://dashscope.example.test/compatible-mode/v1",
});

test("structured output schema requires complete keyed geometry objects", () => {
  const geometrySchema = GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA
    .properties.sizes.items.properties.geometry;
  assert.deepEqual(geometrySchema.required, GEOMETRY_PARSER_FIELD_KEYS);
  assert.equal(geometrySchema.additionalProperties, false);
  assert.deepEqual(geometrySchema.properties.stack.type, ["number", "null"]);
});

test("QUICK fixture preserves all five official size labels and benchmark columns", () => {
  const result = validateAndNormalizeGeometryParserResponse(createQuickGeometryParserFixture());
  assert.deepEqual(result.detectedSizes, QUICK_SIZES);
  assert.equal(result.detectedSizeCount, 5);
  assert.equal(result.confirmationCount, 0);
  assert.deepEqual(result.warnings, []);
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
  assert.equal(draft.sizes["550"].stack, 610.6);
  assert.equal(draft.selectedSize, "430");
  assert.equal(draft.parserWarnings.length, 0);
  assert.doesNotMatch(analyzerSource, /createMockGeometryImportDraft|mockGeometryImport/);
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
  const fixture = createQuickGeometryParserFixture();
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
  assert.match(providerRequest.body.messages[0].content[0].text, /seatTubeLength/);
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
  fixture.warnings.push({ code: "TEST", message: "550 尺码 Stack 未可靠识别。", field: "stack", size: "550" });
  const draft = geometryParserResponseToDraft(fixture);
  assert.deepEqual(Object.keys(draft.sizes), QUICK_SIZES);
  assert.equal(draft.detectedSizeCount, 5);
  assert.equal(draft.parserWarnings[0].size, "550");
});
