import {
  GEOMETRY_PARSER_INPUT_TYPES,
  GEOMETRY_PARSER_RAW_TABLE_SCHEMA,
} from "../src/services/geometryParserSchema.js";
import {
  GeometryParserValidationError,
  validateAndNormalizeGeometryParserResponse,
} from "../src/services/geometryParserValidator.js";
import { mapRawGeometryTableToParserResponse } from "../src/services/geometryParserRawTableMapper.js";
import { normalizeExplicitGeometryUnits } from "../src/services/geometryUnitNormalizer.js";
import { getGeometryProvider } from "./providers/geometryProviderRegistry.js";

const PARSER_PATH = "/api/geometry/parse";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PARSER_PROTOCOL_VERSION = "raw-table-v3-explicit-unit";

const SYSTEM_PROMPT = `You classify and extract bicycle frame geometry tables from product images in one request.
Read the image itself. Do not use the filename, brand assumptions, known-bike memory, presets, or guessed fallback values.
First classify the complete input into exactly one inputClassification.type:
- road_bike_geometry: a real official road-bike Geometry / frame-geometry table for an Endurance, All-Round, or Aero road bike.
- unsupported_bike_geometry: bicycle geometry content for a clearly unsupported category, including MTB, gravel, folding, city, step-through/lady, BMX, kids, or another non-road-bike category.
- not_geometry: not a geometry table, including an ordinary photo, person, resume, chat/text screenshot, marketing image, unrelated image, or a bicycle photo without a readable geometry data table.
- unreadable: likely a geometry table, but resolution, blur, severe cropping, or missing size/parameter regions prevents reliable extraction.
Use the whole-image meaning plus visible size columns and typical Geometry parameters such as Stack, Reach, Seat Tube, and Head Tube. The presence of a bicycle alone is never enough for road_bike_geometry.
Return classification confidence from 0 to 1 when reliable, otherwise null. detectedBikeType and reason are optional diagnostic strings and must be null when unknown.
Only when inputClassification.type is road_bike_geometry, continue with the raw geometry table extraction below. For every other classification, do not invent sizes, rows, or geometry values; raw table fields may be omitted.
The image may contain multiple frame-size columns. Find the complete geometry table, determine whether sizes are rows or columns, and identify every size.
Preserve every official size label exactly as printed and in source order. Never shorten, normalize, convert, or reinterpret a size label.
Return the raw geometry table, not an interpretation into another schema. rawRows must include every detected source row, including rows whose meaning is uncertain or not useful to a bicycle renderer.
For each raw row, preserve the source label text as printed, record its displayed unit when available, and provide one value per detected size in the exact source column order. Use null only for an unreadable cell; never delete an entire row because its field meaning is uncertain.
For road_bike_geometry, also return measurementContext.defaultLengthUnit as exactly mm, cm, in, or unknown. Set it only from an explicit image-wide or table-wide unit statement, header, or footnote. If the image does not state a reliable default length unit, return unknown. Never infer the unit from numeric magnitude, decimal formatting, plausibility ranges, typical bicycle values, or prior knowledge. Preserve rawRows values exactly as printed and do not convert them.
Do not infer a row's meaning from diagram letters such as A, B, C, D, E, F, G, H, I, J, or K. Do not omit rows such as Wheelbase, Fork Offset, Standover, or Chinese-labelled geometry rows merely because they may not exist in a downstream schema.
Never drop a size because one or more cells are uncertain. Never shift a value into a neighboring size. Return only one valid JSON Object matching the requested raw-table fields.`;

function jsonResponse(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
      } : {}),
      ...extraHeaders,
    },
  });
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const configured = String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.includes(origin) ? origin : null;
}

function detectImageMime(bytes, declaredType) {
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isPng) return "image/png";
  if (isJpeg) return "image/jpeg";
  if (["image/png", "image/jpeg"].includes(declaredType)) return null;
  return null;
}

function errorPayload(code, message, details = []) {
  return { error: { code, message, details } };
}

function isQwenProvider(env) {
  return String(env.GEOMETRY_PARSER_PROVIDER ?? "").trim().toLowerCase() === "qwen";
}

const inputClassificationTypes = new Set(GEOMETRY_PARSER_INPUT_TYPES);

function normalizeInputClassification(structuredOutput, { required = false } = {}) {
  const value = structuredOutput?.inputClassification;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (!required) return null;
    throw new GeometryParserValidationError("模型未返回输入图片类型判断，请重新识别。", {
      code: "INPUT_CLASSIFICATION_REQUIRED",
    });
  }
  const type = String(value.type ?? "").trim();
  const confidence = value.confidence == null ? null : Number(value.confidence);
  if (!inputClassificationTypes.has(type)
    || (confidence != null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1))) {
    throw new GeometryParserValidationError("模型返回的输入图片类型判断无效，请重新识别。", {
      code: "INPUT_CLASSIFICATION_INVALID",
    });
  }
  return {
    type,
    confidence,
    detectedBikeType: value.detectedBikeType == null ? null : String(value.detectedBikeType).trim() || null,
    reason: value.reason == null ? null : String(value.reason).trim() || null,
  };
}

function rejectUnsupportedInput(classification) {
  const errorsByType = {
    not_geometry: {
      code: "NOT_GEOMETRY_IMAGE",
      message: "这似乎不是车架几何图，请上传包含尺码与 Geometry 参数的公路车官方几何表。",
    },
    unsupported_bike_geometry: {
      code: "UNSUPPORTED_BIKE_TYPE",
      message: "当前暂不支持这种车型。Bike Geometry Lab 目前仅支持耐力、综合和破风三类公路车几何。",
    },
    unreadable: {
      code: "GEOMETRY_IMAGE_UNREADABLE",
      message: "暂时无法可靠读取这张几何图，请上传更清晰、完整的官方几何表。",
    },
  };
  const businessError = errorsByType[classification?.type];
  if (!businessError) return;
  throw new GeometryParserValidationError(businessError.message, {
    code: businessError.code,
    details: [{ inputClassification: classification }],
  });
}

function requireRawGeometryTable(structuredOutput) {
  const rawRows = structuredOutput?.rawRows;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new GeometryParserValidationError("模型未返回完整原始几何表结构，请重新识别。", {
      code: "RAW_TABLE_REQUIRED",
    });
  }

  const detectedSizes = structuredOutput?.detectedSizes;
  if (!Array.isArray(detectedSizes) || detectedSizes.length === 0) {
    throw new GeometryParserValidationError("模型未返回可对齐的原始尺码列，请重新识别。", {
      code: "RAW_TABLE_DETECTED_SIZES_REQUIRED",
    });
  }

  for (const [rowIndex, row] of rawRows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)
      || !String(row.label ?? "").trim() || !Array.isArray(row.values)) {
      throw new GeometryParserValidationError("模型返回的原始几何表行不完整，请重新识别。", {
        code: "RAW_TABLE_ROW_INVALID",
        details: [{ rowIndex }],
      });
    }
    if (row.values.length !== detectedSizes.length) {
      throw new GeometryParserValidationError(
        `原始几何表的“${String(row.label).trim()}”包含 ${row.values.length} 个单元格，与 ${detectedSizes.length} 个尺码列不一致，请重新识别。`,
        {
          code: "RAW_TABLE_COLUMN_COUNT_MISMATCH",
          details: [{ rowIndex, label: String(row.label).trim(), valueCount: row.values.length, detectedSizeCount: detectedSizes.length }],
        },
      );
    }
  }
}

export function createGeometryParserWorker({
  fetchImpl = globalThis.fetch,
  providerResolver = getGeometryProvider,
} = {}) {
  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      const origin = getAllowedOrigin(request, env);
      const requestOrigin = request.headers.get("Origin");

      if (request.method === "OPTIONS" && url.pathname === PARSER_PATH) {
        if (requestOrigin && !origin) return jsonResponse(errorPayload("ORIGIN_NOT_ALLOWED", "请求来源不被允许。"), 403, null);
        return new Response(null, {
          status: 204,
          headers: {
            ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      if (url.pathname !== PARSER_PATH) return jsonResponse(errorPayload("NOT_FOUND", "接口不存在。"), 404, origin);
      if (request.method !== "POST") return jsonResponse(errorPayload("METHOD_NOT_ALLOWED", "仅支持 POST 请求。"), 405, origin, { Allow: "POST, OPTIONS" });
      if (requestOrigin && !origin) return jsonResponse(errorPayload("ORIGIN_NOT_ALLOWED", "请求来源不被允许。"), 403, null);

      let formData;
      try {
        formData = await request.formData();
      } catch {
        return jsonResponse(errorPayload("INVALID_MULTIPART", "请上传有效的图片文件。"), 400, origin);
      }
      const image = formData.get("image");
      if (!(image instanceof File)) return jsonResponse(errorPayload("IMAGE_REQUIRED", "缺少几何图片文件。"), 400, origin);
      if (image.size <= 0 || image.size > MAX_IMAGE_BYTES) {
        return jsonResponse(errorPayload("IMAGE_SIZE_INVALID", "图片大小必须在 10MB 以内。"), 413, origin);
      }

      const imageBuffer = await image.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);
      const mimeType = detectImageMime(imageBytes, image.type);
      if (!mimeType) return jsonResponse(errorPayload("IMAGE_TYPE_UNSUPPORTED", "仅支持有效的 PNG、JPG 或 JPEG 图片。"), 415, origin);

      let providerResult;
      try {
        const provider = providerResolver(env, { fetchImpl });
        providerResult = await provider.parse({
          imageBuffer,
          mimeType,
          prompt: SYSTEM_PROMPT,
          schema: GEOMETRY_PARSER_RAW_TABLE_SCHEMA,
        });
      } catch (error) {
        return jsonResponse(
          errorPayload(
            error?.code || "MODEL_REQUEST_FAILED",
            error?.message || "AI 几何解析失败，请稍后重试。",
            Array.isArray(error?.details) ? error.details : [],
          ),
          Number.isInteger(error?.status) ? error.status : 502,
          origin,
        );
      }

      try {
        const qwenProvider = isQwenProvider(env);
        const inputClassification = normalizeInputClassification(providerResult?.structuredOutput, {
          required: qwenProvider,
        });
        if (inputClassification) rejectUnsupportedInput(inputClassification);
        if (qwenProvider && inputClassification?.type === "road_bike_geometry") {
          requireRawGeometryTable(providerResult?.structuredOutput);
        }
        const mappedResponse = mapRawGeometryTableToParserResponse(providerResult?.structuredOutput);
        const unitNormalizedResponse = normalizeExplicitGeometryUnits(
          mappedResponse,
          providerResult?.structuredOutput?.measurementContext,
        );
        const validated = validateAndNormalizeGeometryParserResponse(unitNormalizedResponse);
        return jsonResponse({
          ...validated,
          ...(inputClassification ? { inputClassification } : {}),
          meta: {
            ...(providerResult?.meta && typeof providerResult.meta === "object" ? providerResult.meta : {}),
            parserProtocolVersion: PARSER_PROTOCOL_VERSION,
          },
        }, 200, origin);
      } catch (error) {
        const validationError = error instanceof GeometryParserValidationError;
        return jsonResponse(
          errorPayload(
            validationError ? error.code : "MODEL_OUTPUT_INVALID",
            validationError ? error.message : "AI 返回的数据无法通过完整性校验，请重新识别。",
            validationError ? error.details : [],
          ),
          422,
          origin,
        );
      }
    },
  };
}

export default createGeometryParserWorker();
