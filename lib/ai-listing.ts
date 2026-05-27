import { analyzeCompetitorInput } from "@/lib/competitor-insights";
import {
  type GenerationValidationContext,
  validateGenerationResult,
} from "@/lib/generation-result-validation";
import {
  buildListingPrompt,
  WORKUP_LISTING_PROMPT_VERSION,
  type ListingPrompt,
} from "@/lib/listing-prompt";
import { buildListingStrategy } from "@/lib/listing-strategy";
import { buildProductBrief, type BuildProductBriefInput } from "@/lib/product-brief";
import { readServerEnv } from "@/lib/cloudflare-env";
import type {
  CompetitorInsights,
  GenerationInputSnapshot,
  GenerationResult,
  ListingStrategy,
  Marketplace,
  ProductBrief,
} from "@/lib/workup-schema";

type GenerateListingInput = {
  projectId?: string;
  userId?: string;
  projectData?: unknown;
  allowDevelopmentMock?: boolean;
};

type DeepSeekGenerationInput = {
  projectId?: string;
  userId?: string;
  productBrief: ProductBrief;
  competitorInsights: CompetitorInsights;
  listingStrategy: ListingStrategy;
  inputSnapshot: GenerationInputSnapshot;
  prompt?: ListingPrompt;
  allowDevelopmentMock?: boolean;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type GenerationResponse =
  | {
      ok: true;
      source: "deepseek";
      model: string;
      result: GenerationResult;
      inputSnapshot: GenerationInputSnapshot;
      promptVersion: typeof WORKUP_LISTING_PROMPT_VERSION;
    }
  | {
      ok: true;
      source: "mock";
      model: string;
      result: GenerationResult;
      inputSnapshot: GenerationInputSnapshot;
      promptVersion: typeof WORKUP_LISTING_PROMPT_VERSION;
      fallbackReason: string;
    };

const AI_REQUEST_TIMEOUT_MS = 55000;
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";
const SYSTEM_PROMPT_ID = "workup-listing-system-prompt";
const USER_PROMPT_ID = "workup-listing-user-prompt";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  return "";
}

function pickText(
  source: Record<string, unknown>,
  formData: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const directValue = textValue(source[key]);

    if (directValue) {
      return directValue;
    }

    const formValue = textValue(formData[key]);

    if (formValue) {
      return formValue;
    }
  }

  return fallback;
}

function normalizeMarketplace(value: string): Marketplace {
  return value === "UK" || value === "CA" || value === "AU" ? value : "US";
}

function normalizeFormData(value: unknown): Record<string, string | boolean | null> {
  const record = asRecord(value);
  const normalized: Record<string, string | boolean | null> = {};

  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "string") {
      normalized[key] = item;
    } else if (typeof item === "number") {
      normalized[key] = String(item);
    } else if (typeof item === "boolean") {
      normalized[key] = item;
    } else if (item === null) {
      normalized[key] = null;
    }
  }

  return normalized;
}

function projectFormData(projectData: unknown) {
  const project = asRecord(projectData);
  const nestedFormData = asRecord(project.form_data);

  return Object.keys(nestedFormData).length > 0 ? nestedFormData : project;
}

export function buildProductBriefInputFromProject(projectData: unknown): BuildProductBriefInput {
  const project = asRecord(projectData);
  const formData = projectFormData(projectData);
  const productNameCn = pickText(
    project,
    formData,
    ["productNameCn", "product_name_cn", "productName"],
  );
  const productNameEn = pickText(project, formData, ["productNameEn", "product_name_en"]);
  const marketplace = normalizeMarketplace(
    pickText(project, formData, ["marketplace"], "US"),
  );
  const category = pickText(
    project,
    formData,
    ["category"],
    productNameCn ? "General Amazon Product" : "",
  );
  const targetPrice = pickText(project, formData, ["targetPrice", "target_price"]);
  const targetCustomer = pickText(project, formData, [
    "targetCustomer",
    "target_customer",
    "targetAudience",
    "target_user",
  ]);

  return {
    productNameCn,
    productNameEn,
    marketplace,
    category,
    targetPrice,
    targetCustomer,
    formData,
  };
}

export function buildWorkUpGenerationContext(input: GenerateListingInput) {
  const projectData = input.projectData || {};
  const productBriefInput = buildProductBriefInputFromProject(projectData);
  const productBrief = buildProductBrief(productBriefInput);
  const competitorInsights = analyzeCompetitorInput(productBriefInput.formData);
  const listingStrategy = buildListingStrategy(productBrief, competitorInsights);
  const prompt = buildListingPrompt(productBrief, competitorInsights, listingStrategy);
  const modelName = "deepseek-chat";
  const inputSnapshot = createGenerationInputSnapshot({
    projectId: input.projectId || "",
    userId: input.userId || "",
    projectData,
    productBrief,
    competitorInsights,
    listingStrategy,
    promptVersion: prompt.promptVersion,
    modelName,
  });

  return {
    productBrief,
    competitorInsights,
    listingStrategy,
    prompt,
    inputSnapshot,
  };
}

export function createGenerationInputSnapshot(input: {
  projectId: string;
  userId: string;
  projectData: unknown;
  productBrief: ProductBrief;
  competitorInsights: CompetitorInsights;
  listingStrategy: ListingStrategy;
  promptVersion: string;
  modelName: string;
}): GenerationInputSnapshot {
  const project = asRecord(input.projectData);
  const formData = normalizeFormData(projectFormData(input.projectData));

  return {
    schemaVersion: "workup.v1",
    projectId: input.projectId,
    userId: input.userId,
    projectSnapshot: {
      productNameCn: input.productBrief.product.nameCn,
      productNameEn: input.productBrief.product.nameEn,
      marketplace: input.productBrief.product.marketplace,
      category: input.productBrief.product.category,
      targetPrice: input.productBrief.product.targetPrice,
      targetCustomer: input.productBrief.product.targetCustomer,
      formData,
    },
    productBrief: input.productBrief,
    competitorInsights: input.competitorInsights,
    listingStrategy: input.listingStrategy,
    prompt: {
      version: input.promptVersion,
      systemPromptId: SYSTEM_PROMPT_ID,
      userPromptId: USER_PROMPT_ID,
    },
    model: {
      provider: "deepseek",
      name: textValue(project.model) || input.modelName,
    },
    createdAt: new Date().toISOString(),
  };
}

export function extractDeepSeekText(response: DeepSeekResponse) {
  return response.choices?.[0]?.message?.content?.trim() || "";
}

export function parseDeepSeekJsonResponse(responseText: string) {
  const trimmed = responseText.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start < 0 || end <= start) {
    throw new Error("DeepSeek 返回了非 JSON 文本，无法保存为正式 Work UP GenerationResult。");
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `DeepSeek JSON 解析失败：${error.message}`
        : "DeepSeek JSON 解析失败。",
    );
  }
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildFallbackQualityScore(context: GenerationValidationContext) {
  const completeness = context.productBrief.rawInputCompleteness;
  const requiredScore = completeness.requiredFieldsProvided * 20;
  const optionalScore = completeness.optionalFieldsProvided * 4;
  const completenessScore = clamp(Math.round(requiredScore + optionalScore), 0, 100);
  const keywordScore = context.listingStrategy.primaryKeyword ? 74 : 62;
  const compliancePenalty =
    context.productBrief.prohibitedClaims.length +
    context.listingStrategy.avoidClaims.length > 0
      ? 0
      : 4;
  const complianceSafety = clamp(90 - compliancePenalty, 0, 100);
  const amazonReadiness = clamp(
    Math.round((completenessScore + keywordScore + complianceSafety) / 3),
    0,
    100,
  );
  const copyClarity = clamp(
    Math.round(
      68 +
        Math.min(context.productBrief.confirmedFacts.length, 8) * 2 +
        Math.min(context.listingStrategy.safeClaims.length, 4) * 2,
    ),
    0,
    100,
  );
  const overall = clamp(
    Math.round(
      (completenessScore + keywordScore + complianceSafety + amazonReadiness + copyClarity) / 5,
    ),
    0,
    100,
  );
  const level: GenerationResult["qualityScore"]["level"] =
    overall >= 78 ? "strong" : overall >= 60 ? "good" : "basic";

  return {
    overall,
    level,
    dimensions: {
      inputCompleteness: completenessScore,
      keywordRelevance: keywordScore,
      complianceSafety,
      amazonReadiness,
      copyClarity,
    },
    summary: context.productBrief.rawInputCompleteness.optionalFieldsProvided > 0
      ? "服务端根据当前产品资料生成稳定评分，保证前端可用。"
      : "服务端根据有限产品资料生成保守评分，保证前端可用。",
  };
}

function buildFallbackAnalysis(context: GenerationValidationContext) {
  const primaryKeyword = context.listingStrategy.primaryKeyword || context.productBrief.product.category;
  const competitorNote = context.competitorInsights.opportunities.length
    ? `保留竞品机会点：${context.competitorInsights.opportunities[0].opportunity}。`
    : "竞品线索仅用于策略，不直接写入最终文案。";

  return {
    productSummary: `${context.productBrief.product.category} listing centered on ${primaryKeyword}.`,
    strategySummary: context.listingStrategy.positioning.direction,
    competitorSummary: competitorNote,
    complianceSummary:
      context.listingStrategy.avoidClaims.length > 0
        ? `已避开 ${context.listingStrategy.avoidClaims.length} 个高风险 claim。`
        : "当前策略未发现额外高风险 claim。",
    beginnerExplanation: "服务端补齐分析字段，保证结果页稳定展示。",
  };
}

function normalizeDeepSeekResult(
  rawResult: unknown,
  context: GenerationValidationContext,
  model: string,
): GenerationResult {
  const result = isRecord(rawResult) ? rawResult : {};

  return {
    schemaVersion: "workup.v1",
    source: "deepseek",
    generatedAt: new Date().toISOString(),
    model,
    qualityScore: buildFallbackQualityScore(context),
    productBrief: context.productBrief,
    competitorInsights: context.competitorInsights,
    listingStrategy: context.listingStrategy,
    finalListing: result.finalListing as GenerationResult["finalListing"],
    complianceNotes: asArray(result.complianceNotes) as GenerationResult["complianceNotes"],
    missingInfo: (asArray(result.missingInfo).length > 0
      ? asArray(result.missingInfo)
      : context.productBrief.missingInfo) as GenerationResult["missingInfo"],
    assumptions: asArray(result.assumptions) as GenerationResult["assumptions"],
    improvementSuggestions: asArray(result.improvementSuggestions) as GenerationResult["improvementSuggestions"],
    analysis: (isRecord(result.analysis) ? result.analysis : buildFallbackAnalysis(context)) as GenerationResult["analysis"],
  };
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

export async function hasAIProviderKeyAsync() {
  return isUsableDeepSeekKey(await readServerEnv("DEEPSEEK_API_KEY"));
}

export async function isGenerationMockEnabled() {
  return (await readServerEnv("ENABLE_GENERATION_MOCK")).toLowerCase() === "true";
}

function isDevelopmentLikeEnvironment() {
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

function createDevelopmentPlaceholderResult(
  input: DeepSeekGenerationInput,
  model: string,
): GenerationResult {
  const { productBrief, competitorInsights, listingStrategy } = input;
  const safeClaims = listingStrategy.safeClaims.map((item) => item.claim).join(", ");
  const titleKeyword = listingStrategy.primaryKeyword || productBrief.product.category;

  return {
    schemaVersion: "workup.v1",
    source: "deepseek",
    generatedAt: new Date().toISOString(),
    model,
    qualityScore: {
      overall: 60,
      level: "basic",
      dimensions: {
        inputCompleteness: productBrief.rawInputCompleteness.optionalFieldsProvided * 10,
        keywordRelevance: 60,
        complianceSafety: 90,
        amazonReadiness: 55,
        copyClarity: 70,
      },
      summary: "开发环境 mock：基于 Work UP 新链路生成的占位结果，不能保存为真实项目结果。",
    },
    productBrief,
    competitorInsights,
    listingStrategy,
    finalListing: {
      title: {
        english: `${titleKeyword} for Practical Amazon Listing Preview`,
        chineseExplanation: "开发环境占位标题，只用于本地调试。",
      },
      bulletPoints: [
        {
          english: `Built around confirmed product facts: ${safeClaims || "basic category information"}.`,
          chineseExplanation: "只引用已确认事实。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["safeClaims"],
        },
        {
          english: "Conservative wording avoids unverified specifications or compliance-sensitive promises.",
          chineseExplanation: "避免未经确认的规格和强承诺。",
          sourceBasis: "safe_inference",
          evidenceFields: ["avoidClaims"],
        },
        {
          english: "Designed as a simple draft for reviewing the Work UP generation pipeline.",
          chineseExplanation: "用于检查生成链路，而不是正式文案。",
          sourceBasis: "safe_inference",
          evidenceFields: ["schemaVersion"],
        },
        {
          english: "Competitor insights are kept as strategy input without copying unconfirmed competitor claims.",
          chineseExplanation: "竞品信息只作为策略输入。",
          sourceBasis: "competitor_inspired",
          evidenceFields: ["competitorInsights.notes"],
        },
        {
          english: "Add missing product details to improve title precision, bullet strength, and buyer confidence.",
          chineseExplanation: "提醒用户补充资料。",
          sourceBasis: "safe_inference",
          evidenceFields: ["missingInfo"],
        },
      ],
      description: {
        english:
          "This development preview confirms the Work UP pipeline can build a structured listing result from product facts, competitor insights, and listing strategy.",
        chineseExplanation: "开发环境说明，不应用于正式保存。",
      },
      searchTerms: {
        english: listingStrategy.secondaryKeywords.slice(0, 6).join(" ") || titleKeyword,
        chineseExplanation: "使用安全关键词生成的开发占位 Search Terms。",
      },
    },
    complianceNotes: [],
    missingInfo: productBrief.missingInfo,
    assumptions: [
      {
        assumption: "This is a development-only mock generated without DeepSeek.",
        reason: "ENABLE_GENERATION_MOCK is enabled outside production.",
        confidence: "high",
        shouldVerifyWithUser: true,
      },
    ],
    improvementSuggestions: [
      {
        priority: "high",
        suggestion: "接入真实 DeepSeek 返回后再保存正式结果。",
        reason: "开发 mock 不能代表真实生成质量。",
        expectedImpact: "conversion",
      },
    ],
    analysis: {
      productSummary: "开发环境占位结果。",
      strategySummary: "已完成 ProductBrief、CompetitorInsights、ListingStrategy 链路。",
      competitorSummary: "竞品 claim 未直接进入最终文案。",
      complianceSummary: "高风险 claim 保持在 avoidClaims 中。",
      beginnerExplanation: "这是本地调试结果，不是 DeepSeek 正式生成。",
    },
  };
}

export async function generateListingWithDeepSeek(
  input: DeepSeekGenerationInput,
): Promise<GenerationResponse> {
  await readAIProvider();

  const apiKey = await readServerEnv("DEEPSEEK_API_KEY");
  const model = (await readServerEnv("DEEPSEEK_MODEL")) || "deepseek-chat";
  const baseUrl = (await readServerEnv("DEEPSEEK_BASE_URL")) || DEFAULT_DEEPSEEK_BASE_URL;
  const prompt = input.prompt || buildListingPrompt(
    input.productBrief,
    input.competitorInsights,
    input.listingStrategy,
  );
  const inputSnapshot = {
    ...input.inputSnapshot,
    prompt: {
      ...input.inputSnapshot.prompt,
      version: prompt.promptVersion,
    },
    model: {
      provider: "deepseek" as const,
      name: model,
    },
  };

  if (!isUsableDeepSeekKey(apiKey)) {
    if (input.allowDevelopmentMock && isDevelopmentLikeEnvironment()) {
      return {
        ok: true,
        source: "mock",
        model: "deepseek-development-mock",
        result: createDevelopmentPlaceholderResult(input, "deepseek-development-mock"),
        inputSnapshot,
        promptVersion: prompt.promptVersion,
        fallbackReason:
          "开发环境 ENABLE_GENERATION_MOCK=true，未配置可用 DeepSeek API key，返回不可保存的开发 mock。",
      };
    }

    throw new Error("DEEPSEEK_API_KEY 未配置或不可用，真实生成不能 fallback mock。");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  const requestStartedAt = Date.now();
  console.log("[generate-listing]", {
    event: "DeepSeek request started",
    source: "deepseek",
    model,
    promptVersion: prompt.promptVersion,
  });
  let response: Response;

  try {
    response = await fetch(baseUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2200,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: prompt.systemPrompt,
          },
          {
            role: "user",
            content: prompt.userPrompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (error) {
    const elapsedMs = Date.now() - requestStartedAt;
    console.log("[generate-listing]", {
      event: "DeepSeek request finished",
      source: "deepseek",
      elapsedMs,
      ok: false,
    });
    throw new Error(
      error instanceof Error
        ? `DeepSeek 请求失败：${error.message}`
        : "DeepSeek 请求失败，请稍后再试。",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const elapsedMs = Date.now() - requestStartedAt;
  console.log("[generate-listing]", {
    event: "DeepSeek request finished",
    source: "deepseek",
    elapsedMs,
    status: response.status,
  });

  const payload = (await response.json().catch(() => null)) as (DeepSeekResponse & {
    error?: { message?: string };
  }) | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `DeepSeek 生成失败，状态码：${response.status}`);
  }

  const responseText = extractDeepSeekText(payload || {});

  if (!responseText) {
    throw new Error("DeepSeek 没有返回可解析的 Work UP GenerationResult。");
  }

  const rawResult = parseDeepSeekJsonResponse(responseText);
  const normalizedResult = normalizeDeepSeekResult(
    rawResult,
    {
      productBrief: input.productBrief,
      competitorInsights: input.competitorInsights,
      listingStrategy: input.listingStrategy,
      model,
    },
    model,
  );
  const validationContext: GenerationValidationContext = {
    productBrief: input.productBrief,
    competitorInsights: input.competitorInsights,
    listingStrategy: input.listingStrategy,
    model,
  };
  const result = validateGenerationResult(normalizedResult, validationContext);

  return {
    ok: true,
    source: "deepseek",
    model,
    result,
    inputSnapshot,
    promptVersion: prompt.promptVersion,
  };
}

export async function generateAmazonListing(input: GenerateListingInput) {
  const context = buildWorkUpGenerationContext(input);

  return generateListingWithDeepSeek({
    projectId: input.projectId,
    userId: input.userId,
    productBrief: context.productBrief,
    competitorInsights: context.competitorInsights,
    listingStrategy: context.listingStrategy,
    inputSnapshot: context.inputSnapshot,
    prompt: context.prompt,
    allowDevelopmentMock: input.allowDevelopmentMock,
  });
}
