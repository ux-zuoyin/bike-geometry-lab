const DEFAULT_MODEL = "qwen3-vl-flash";
const CHAT_COMPLETIONS_PATH = "/chat/completions";

function providerError(code, message, { status = 502, details = [] } = {}) {
  const error = new Error(message);
  error.name = "GeometryProviderError";
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function getEndpoint(env) {
  const configured = String(env.DASHSCOPE_COMPATIBLE_BASE_URL ?? "").trim();
  if (!configured || configured.includes("YOUR_WORKSPACE_ID")) {
    throw providerError(
      "PARSER_NOT_CONFIGURED",
      "百炼几何解析服务尚未配置 Workspace Endpoint。",
      { status: 503 },
    );
  }

  let baseUrl;
  try {
    baseUrl = new URL(configured);
  } catch {
    throw providerError("PARSER_NOT_CONFIGURED", "百炼几何解析服务 Endpoint 配置无效。", { status: 503 });
  }
  if (baseUrl.protocol !== "https:") {
    throw providerError("PARSER_NOT_CONFIGURED", "百炼几何解析服务 Endpoint 必须使用 HTTPS。", { status: 503 });
  }
  return `${baseUrl.toString().replace(/\/$/, "")}${CHAT_COMPLETIONS_PATH}`;
}

function extractMessageContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content;
  if (Array.isArray(content)) {
    const text = content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  throw providerError("MODEL_OUTPUT_INVALID", "百炼模型没有返回可解析的 JSON 对象。", { status: 422 });
}

function getRequestId(response, payload) {
  return response.headers.get("x-request-id")
    || payload?.request_id
    || payload?.requestId
    || payload?.id
    || null;
}

function getUpstreamErrorCode(payload) {
  return payload?.error?.code || payload?.code || null;
}

export function createQwenGeometryProvider({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  return {
    id: "qwen",

    async parse({ imageBuffer, mimeType, prompt, schema }) {
      if (!env.DASHSCOPE_API_KEY) {
        throw providerError("PARSER_NOT_CONFIGURED", "百炼几何解析服务尚未配置 API Key。", { status: 503 });
      }
      const endpoint = getEndpoint(env);
      const model = String(env.QWEN_GEOMETRY_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
      const startedAt = Date.now();
      const jsonPrompt = `${prompt}\n\nReturn only one valid JSON Object and no Markdown, code fence, commentary, or extra text. Preserve every source size label exactly as printed; never shorten, normalize, or convert it. The JSON Object must follow this schema shape:\n${JSON.stringify(schema)}`;

      let response;
      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            enable_thinking: false,
            messages: [
              {
                role: "system",
                content: [{ type: "text", text: jsonPrompt }],
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${bytesToBase64(imageBuffer)}`,
                    },
                  },
                  {
                    type: "text",
                    text: "Classify this image first. Only if it is a supported official road-bike geometry table, extract every raw table row. Return only the requested JSON Object.",
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });
      } catch {
        throw providerError("MODEL_UNREACHABLE", "百炼几何解析服务暂时不可用，请稍后重试。");
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // A non-JSON upstream response is handled below.
      }
      const requestId = getRequestId(response, payload);
      if (!response.ok) {
        const upstreamCode = getUpstreamErrorCode(payload);
        const details = [{ status: response.status, upstreamCode, requestId }];
        if (upstreamCode === "AllocationQuota.FreeTierOnly") {
          throw providerError(
            "FREE_QUOTA_EXHAUSTED",
            "百炼免费额度已用完，解析请求已停止。",
            { status: 429, details },
          );
        }
        throw providerError("MODEL_REQUEST_FAILED", "百炼几何解析失败，请稍后重试。", { details });
      }

      let structuredOutput;
      try {
        structuredOutput = JSON.parse(extractMessageContent(payload));
      } catch (error) {
        if (error?.code) throw error;
        throw providerError("MODEL_OUTPUT_INVALID", "百炼模型没有返回合法的 JSON 对象。", {
          status: 422,
          details: [{ requestId }],
        });
      }

      return {
        structuredOutput,
        meta: {
          provider: "qwen",
          model,
          usage: payload?.usage ?? null,
          requestId,
          elapsedMs: Date.now() - startedAt,
        },
      };
    },
  };
}
