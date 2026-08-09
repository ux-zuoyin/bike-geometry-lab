const DEFAULT_GEOMETRY_PARSER_ENDPOINT = "/api/geometry/parse";

export class GeometryParserClientError extends Error {
  constructor(message, { code = "GEOMETRY_PARSER_REQUEST_FAILED", status = 0, details = [] } = {}) {
    super(message);
    this.name = "GeometryParserClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getConfiguredEndpoint() {
  return import.meta.env?.VITE_GEOMETRY_PARSER_ENDPOINT?.trim() || DEFAULT_GEOMETRY_PARSER_ENDPOINT;
}

export function createGeometryParserClient({
  endpoint = getConfiguredEndpoint(),
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    async parse(imageFile, { signal } = {}) {
      if (typeof fetchImpl !== "function") {
        throw new GeometryParserClientError("当前环境无法连接几何图片解析服务。", {
          code: "FETCH_UNAVAILABLE",
        });
      }

      const body = new FormData();
      body.append("image", imageFile, imageFile.name);
      let response;
      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          body,
          signal,
          headers: { Accept: "application/json" },
        });
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        throw new GeometryParserClientError("无法连接几何图片解析服务，请稍后重试。", {
          code: "PARSER_ENDPOINT_UNREACHABLE",
        });
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // A non-JSON upstream response is handled by the generic error below.
      }

      if (!response.ok) {
        throw new GeometryParserClientError(
          payload?.error?.message || "几何图片解析失败，请重新识别或更换图片。",
          {
            code: payload?.error?.code || "GEOMETRY_PARSER_REQUEST_FAILED",
            status: response.status,
            details: payload?.error?.details ?? [],
          },
        );
      }

      if (!payload || !Array.isArray(payload.sizes)) {
        throw new GeometryParserClientError("解析服务返回了无效数据，请重新识别。", {
          code: "PARSER_RESPONSE_INVALID",
          status: response.status,
        });
      }
      return payload;
    },
  };
}

export const productionGeometryParserClient = createGeometryParserClient();
