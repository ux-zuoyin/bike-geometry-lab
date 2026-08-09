import { GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA } from "../src/services/geometryParserSchema.js";
import {
  GeometryParserValidationError,
  validateAndNormalizeGeometryParserResponse,
} from "../src/services/geometryParserValidator.js";
import { getGeometryProvider } from "./providers/geometryProviderRegistry.js";

const PARSER_PATH = "/api/geometry/parse";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const SYSTEM_PROMPT = `You extract bicycle frame geometry tables from official product images.
Read the image itself. Do not use the filename, brand assumptions, known-bike memory, presets, or guessed fallback values.
The image may contain multiple frame-size columns. Find the complete geometry table, determine whether sizes are rows or columns, and identify every size.
Preserve every official size label exactly as printed and in source order. Never shorten, normalize, convert, or reinterpret a size label.
Return one sizes[] object per detected size. Every geometry object must contain every schema field. Use null for any cell that is missing, ambiguous, occluded, or not reliably readable.
Never drop a size because one or more cells are uncertain. Never shift a value into a neighboring size. Never compress parallel arrays.
Map source labels to the canonical schema by meaning. Distances are millimetres and angles are degrees unless the source explicitly states otherwise.
fieldColumnCounts should report the number of reliably read non-null cells for each canonical field; the server will independently recompute it.
Warnings must identify uncertainty without inventing values. Unknown source rows belong in unrecognizedFields.
Return only one valid JSON Object matching the requested fields.`;

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
          schema: GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA,
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
        const validated = validateAndNormalizeGeometryParserResponse(providerResult?.structuredOutput);
        return jsonResponse({
          ...validated,
          meta: providerResult?.meta ?? null,
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
