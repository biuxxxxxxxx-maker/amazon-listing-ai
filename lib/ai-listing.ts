import { amazonListingSystemPrompt } from "@/lib/prompts/amazon-listing-system-prompt";
import { amazonListingUserPromptTemplate } from "@/lib/prompts/amazon-listing-user-prompt";
import { mockGenerationResult, normalizeGenerationResult } from "@/lib/mock-generation-result";
import { readServerEnv } from "@/lib/cloudflare-env";

export const amazonListingResultSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "title_cn",
    "bullet_points",
    "description",
    "search_terms",
    "keyword_suggestions",
    "image_suggestions",
  ],
  properties: {
    title: { type: "string" },
    title_cn: { type: "string" },
    bullet_points: {
      type: "array",
      items: {
        type: "object",
        required: ["en", "cn"],
        additionalProperties: false,
        properties: {
          en: { type: "string" },
          cn: { type: "string" },
        },
      },
    },
    description: {
      type: "object",
      required: ["en", "cn"],
      additionalProperties: false,
      properties: {
        en: { type: "string" },
        cn: { type: "string" },
      },
    },
    search_terms: {
      type: "array",
      items: { type: "string" },
    },
    keyword_suggestions: {
      type: "array",
      items: {
        type: "object",
        required: ["keyword", "reason_cn"],
        additionalProperties: false,
        properties: {
          keyword: { type: "string" },
          reason_cn: { type: "string" },
        },
      },
    },
    image_suggestions: {
      type: "array",
      items: {
        type: "object",
        required: ["scene", "cn"],
        additionalProperties: false,
        properties: {
          scene: { type: "string" },
          cn: { type: "string" },
        },
      },
    },
  },
} as const;

type GenerateListingInput = {
  projectId?: string;
  projectData?: unknown;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const AI_REQUEST_TIMEOUT_MS = 20000;
const AI_UNAVAILABLE_STATUS_CODES = new Set([401, 403, 429]);
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const STRICT_JSON_INSTRUCTIONS = `
Return strict JSON only. Do not use Markdown code fences. Do not add any fields outside this shape:
{
  "title": "Amazon title in English",
  "title_cn": "中文标题解释",
  "bullet_points": [
    {
      "en": "English bullet point",
      "cn": "中文解释"
    }
  ],
  "description": {
    "en": "English product description",
    "cn": "中文解释"
  },
  "search_terms": ["keyword1", "keyword2", "keyword3"],
  "keyword_suggestions": [
    {
      "keyword": "keyword",
      "reason_cn": "中文原因"
    }
  ],
  "image_suggestions": [
    {
      "scene": "image suggestion in English",
      "cn": "中文图片建议"
    }
  ]
}

Content requirements:
- Generate 5 bullet_points unless the product material is too limited.
- Keep title and bullet_points in natural Amazon US English.
- Keep title_cn, bullet point cn, keyword reasons, and image suggestion cn in Chinese.
- Do not mention dimensions, weight, load capacity, heavy-duty claims, colors,
  certifications, waterproof performance, reinforced stitching, or package
  contents unless they are explicitly present in the user productInfo.
- If the input lacks a detail, write around the benefit in general terms instead
  of inventing numbers or specifications.
`;

export function buildListingUserPrompt(projectData: unknown) {
  return amazonListingUserPromptTemplate.replace(
    "{{PROJECT_JSON}}",
    JSON.stringify(projectData || {}, null, 2),
  );
}

export function extractDeepSeekText(response: DeepSeekResponse) {
  return response.choices?.[0]?.message?.content?.trim() || "";
}

export function isUsableDeepSeekKey(apiKey: string) {
  const normalizedKey = apiKey.trim();

  if (!normalizedKey || normalizedKey === "your-deepseek-api-key") {
    return false;
  }

  return normalizedKey.length > 10;
}

export async function readAIProvider() {
  await readServerEnv("AI_PROVIDER");
  return "deepseek";
}

function mockListingResult(fallbackReason?: string) {
  return {
    source: "mock",
    model: "mock-local",
    demoMode: true,
    ...(fallbackReason ? { fallbackReason: `演示模式：${fallbackReason}` } : { fallbackReason: "演示模式：当前使用本地 mock 结果。" }),
    result: mockGenerationResult,
  };
}

export async function hasAIProviderKeyAsync() {
  return isUsableDeepSeekKey(await readServerEnv("DEEPSEEK_API_KEY"));
}

function parseGeneratedJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function generateWithDeepSeek(input: GenerateListingInput) {
  const apiKey = await readServerEnv("DEEPSEEK_API_KEY");

  if (!isUsableDeepSeekKey(apiKey)) {
    return mockListingResult(
      "当前未配置可用的 DeepSeek API key，已使用本地 mock 结果。请在 DeepSeek 平台购买 API 余额后再使用真实生成。",
    );
  }

  const model = (await readServerEnv("DEEPSEEK_MODEL")) || "deepseek-chat";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(DEEPSEEK_BASE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `${amazonListingSystemPrompt}\n\n${STRICT_JSON_INSTRUCTIONS}`,
          },
          {
            role: "user",
            content: buildListingUserPrompt({
              project_id: input.projectId,
              project_data: input.projectData || {},
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    return mockListingResult("DeepSeek 请求超时或连接失败，已使用本地 mock 结果。");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as DeepSeekResponse & {
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    if (AI_UNAVAILABLE_STATUS_CODES.has(response.status)) {
      return mockListingResult(
        "DeepSeek API key 暂不可用或当前账号没有 API 余额，已使用本地 mock 结果。请在 DeepSeek 平台购买 API 余额后再使用真实生成。",
      );
    }

    throw new Error(payload?.error?.message || `DeepSeek 生成失败，状态码：${response.status}`);
  }

  const text = extractDeepSeekText(payload || {});

  if (!text) {
    return mockListingResult("DeepSeek 没有返回可解析的 Listing 结果，已使用本地 mock 结果。");
  }

  const parsedResult = parseGeneratedJson(text);

  if (!parsedResult) {
    return mockListingResult("DeepSeek 返回了非 JSON 文本，已使用本地 mock 结果。");
  }

  return {
    source: "deepseek",
    model,
    result: normalizeGenerationResult(parsedResult, input.projectData),
  };
}

export async function generateAmazonListing(input: GenerateListingInput) {
  await readAIProvider();
  return generateWithDeepSeek(input);
}
