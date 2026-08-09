import { createOpenAIGeometryProvider } from "./openaiGeometryProvider.js";
import { createQwenGeometryProvider } from "./qwenGeometryProvider.js";

function registryError(message) {
  const error = new Error(message);
  error.name = "GeometryProviderError";
  error.code = "PARSER_PROVIDER_INVALID";
  error.status = 503;
  error.details = [];
  return error;
}

export function getGeometryProvider(env = {}, { fetchImpl = globalThis.fetch } = {}) {
  const providerId = String(env.GEOMETRY_PARSER_PROVIDER ?? "").trim().toLowerCase();
  if (providerId === "qwen") return createQwenGeometryProvider({ env, fetchImpl });
  if (providerId === "openai") return createOpenAIGeometryProvider({ env, fetchImpl });
  throw registryError("几何解析 Provider 配置无效，仅支持 qwen 或 openai。");
}

