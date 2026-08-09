const DEFAULT_MODEL = "gpt-5.6-terra";
const DEFAULT_REASONING_EFFORT = "low";
const ALLOWED_REASONING_EFFORTS = new Set(["low", "medium"]);
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function providerError(code, message, { status = 502, details = [] } = {}) {
  const error = new Error(message);
  error.name = "GeometryProviderError";
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

function getReasoningEffort(env) {
  const configured = String(env.OPENAI_GEOMETRY_REASONING_EFFORT ?? DEFAULT_REASONING_EFFORT).trim();
  return ALLOWED_REASONING_EFFORTS.has(configured) ? configured : DEFAULT_REASONING_EFFORT;
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const output of payload?.output ?? []) {
    for (const content of output?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
      if (content?.type === "refusal") {
        throw providerError("MODEL_OUTPUT_INVALID", content.refusal || "模型拒绝解析这张图片。", { status: 422 });
      }
    }
  }
  throw providerError("MODEL_OUTPUT_INVALID", "模型没有返回结构化几何数据。", { status: 422 });
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

export function createOpenAIGeometryProvider({ env = {}, fetchImpl = globalThis.fetch } = {}) {
  return {
    id: "openai",

    async parse({ imageBuffer, mimeType, prompt, schema }) {
      if (!env.OPENAI_API_KEY) {
        throw providerError("PARSER_NOT_CONFIGURED", "OpenAI 几何解析服务尚未配置 API Key。", { status: 503 });
      }

      const model = String(env.OPENAI_GEOMETRY_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;
      const reasoningEffort = getReasoningEffort(env);
      const startedAt = Date.now();
      let response;
      try {
        response = await fetchImpl(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            store: false,
            reasoning: { effort: reasoningEffort },
            input: [{
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                {
                  type: "input_image",
                  image_url: `data:${mimeType};base64,${bytesToBase64(imageBuffer)}`,
                  detail: "original",
                },
              ],
            }],
            text: {
              format: {
                type: "json_schema",
                name: "bike_geometry_table",
                strict: true,
                schema,
              },
            },
          }),
        });
      } catch {
        throw providerError("MODEL_UNREACHABLE", "AI 几何解析服务暂时不可用，请稍后重试。");
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        // A non-JSON upstream response is handled below.
      }
      const requestId = response.headers.get("x-request-id") || payload?.id || null;
      if (!response.ok) {
        throw providerError("MODEL_REQUEST_FAILED", "AI 几何解析失败，请稍后重试。", {
          details: [{ status: response.status, requestId }],
        });
      }

      let structuredOutput;
      try {
        structuredOutput = JSON.parse(extractOutputText(payload));
      } catch (error) {
        if (error?.code) throw error;
        throw providerError("MODEL_OUTPUT_INVALID", "AI 返回的数据无法通过完整性校验，请重新识别。", {
          status: 422,
          details: [{ requestId }],
        });
      }

      return {
        structuredOutput,
        meta: {
          provider: "openai",
          model,
          reasoningEffort,
          usage: payload?.usage ?? null,
          requestId,
          elapsedMs: Date.now() - startedAt,
        },
      };
    },
  };
}

