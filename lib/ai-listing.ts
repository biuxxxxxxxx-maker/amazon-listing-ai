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

function cleanText(value: unknown) {
  const normalized = textValue(value);
  const lower = normalized.toLowerCase();

  return lower === "undefined" || lower === "null" || lower === "nan" ? "" : normalized;
}

function textFromRecord(
  record: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = cleanText(record[key]);

    if (value) {
      return value;
    }
  }

  return fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasConfirmedFact(context: GenerationValidationContext, field: string) {
  return context.productBrief.confirmedFacts.some(
    (fact) => fact.field.toLowerCase() === field.toLowerCase() && cleanText(fact.value),
  );
}

function uniqueByText<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = getKey(item).toLowerCase();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function validImpactArea(value: string): GenerationResult["missingInfo"][number]["impactArea"] {
  const normalized = value as GenerationResult["missingInfo"][number]["impactArea"];
  const values = new Set<GenerationResult["missingInfo"][number]["impactArea"]>([
    "title",
    "bulletPoints",
    "description",
    "searchTerms",
    "images",
    "compliance",
    "positioning",
    "conversion",
  ]);

  return values.has(normalized) ? normalized : "bulletPoints";
}

function validConfidence(
  value: string,
): GenerationResult["assumptions"][number]["confidence"] {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function validRiskLevel(
  value: string,
): GenerationResult["complianceNotes"][number]["riskLevel"] {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function validPriority(
  value: string,
): GenerationResult["improvementSuggestions"][number]["priority"] {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function validSourceBasis(
  value: string,
): GenerationResult["finalListing"]["bulletPoints"][number]["sourceBasis"] {
  return value === "confirmed_fact" ||
    value === "safe_inference" ||
    value === "competitor_inspired"
    ? value
    : "safe_inference";
}

function languageField(
  value: unknown,
  fallbackEnglish: string,
  fallbackChineseExplanation: string,
) {
  const record = asRecord(value);

  return {
    english: textFromRecord(record, ["english", "en", "text"], fallbackEnglish),
    chineseExplanation: textFromRecord(
      record,
      ["chineseExplanation", "chinese", "zh", "explanation"],
      fallbackChineseExplanation,
    ),
  };
}

function buildFallbackFinalListing(
  context: GenerationValidationContext,
): GenerationResult["finalListing"] {
  const product = context.productBrief.product;
  const primaryKeyword = context.listingStrategy.primaryKeyword || product.category;
  const secondaryKeywords = context.listingStrategy.secondaryKeywords.filter(Boolean);
  const safeClaims = context.listingStrategy.safeClaims.map((item) => item.claim).filter(Boolean);
  const confirmedFactFields = context.productBrief.confirmedFacts
    .map((item) => item.field)
    .filter(Boolean);
  const confirmedFactSummary =
    safeClaims.slice(0, 3).join(", ") || `${product.category} identity`;

  return {
    title: {
      english: `${primaryKeyword} for Practical Amazon Listing Use`,
      chineseExplanation: "标题基于主关键词、产品类目和已确认事实，避免未确认规格。",
    },
    bulletPoints: [
      {
        english: `Built around confirmed product facts including ${confirmedFactSummary}.`,
        chineseExplanation: "优先使用用户已确认的产品事实。",
        sourceBasis: "confirmed_fact",
        evidenceFields: confirmedFactFields.slice(0, 4),
      },
      {
        english: `Clear ${product.category} positioning helps shoppers understand the main use case quickly.`,
        chineseExplanation: "用类目和使用场景做保守定位，不编造额外功能。",
        sourceBasis: "safe_inference",
        evidenceFields: ["productBrief.product.category", "listingStrategy.positioning"],
      },
      {
        english: "Practical wording keeps the listing useful while leaving exact specifications to be confirmed.",
        chineseExplanation: "对尺寸、容量、重量等未确认信息保持谨慎。",
        sourceBasis: "safe_inference",
        evidenceFields: ["productBrief.missingInfo"],
      },
      {
        english: "Competitor insights guide keyword direction without copying unverified competitor claims.",
        chineseExplanation: "竞品只用于关键词和机会判断，不直接复制 claim。",
        sourceBasis: "competitor_inspired",
        evidenceFields: ["competitorInsights.keywordPatterns", "competitorInsights.opportunities"],
      },
      {
        english: "Compliance-safe copy avoids unsupported promises, guarantees, certifications, or brand terms.",
        chineseExplanation: "明确避开高风险 claim 和竞品品牌词。",
        sourceBasis: "safe_inference",
        evidenceFields: ["listingStrategy.avoidClaims"],
      },
    ],
    description: {
      english: `This ${primaryKeyword} listing is written from confirmed product context and conservative Work UP strategy. It focuses on clear buyer understanding, safe keywords, and practical positioning while keeping unconfirmed specifications out of the final copy.`,
      chineseExplanation: "描述由服务端补齐，强调已确认事实、保守策略和未确认信息边界。",
    },
    searchTerms: {
      english: uniqueByText([primaryKeyword, ...secondaryKeywords], (item) => item)
        .slice(0, 8)
        .join(" "),
      chineseExplanation: "搜索词由安全关键词组成，不加入品牌词或未确认高风险 claim。",
    },
  };
}

function normalizeBulletPoint(
  value: unknown,
  fallback: GenerationResult["finalListing"]["bulletPoints"][number],
) {
  const record = asRecord(value);
  const evidenceFields = asArray(record.evidenceFields)
    .map((item) => cleanText(item))
    .filter(Boolean);

  return {
    ...languageField(value, fallback.english, fallback.chineseExplanation),
    sourceBasis: validSourceBasis(cleanText(record.sourceBasis) || fallback.sourceBasis),
    evidenceFields: evidenceFields.length > 0 ? evidenceFields : fallback.evidenceFields,
  };
}

function normalizeFinalListing(
  rawFinalListing: unknown,
  context: GenerationValidationContext,
): GenerationResult["finalListing"] {
  const fallback = buildFallbackFinalListing(context);
  const listing = asRecord(rawFinalListing);
  const rawBullets = asArray(listing.bulletPoints);
  const normalizedBullets = rawBullets
    .slice(0, 5)
    .map((item, index) => normalizeBulletPoint(item, fallback.bulletPoints[index]));

  while (normalizedBullets.length < 5) {
    normalizedBullets.push(fallback.bulletPoints[normalizedBullets.length]);
  }

  return {
    title: languageField(
      listing.title,
      fallback.title.english,
      fallback.title.chineseExplanation,
    ),
    bulletPoints: normalizedBullets as GenerationResult["finalListing"]["bulletPoints"],
    description: languageField(
      listing.description,
      fallback.description.english,
      fallback.description.chineseExplanation,
    ),
    searchTerms: languageField(
      listing.searchTerms,
      fallback.searchTerms.english,
      fallback.searchTerms.chineseExplanation,
    ),
  };
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

function defaultMissingInfo(context: GenerationValidationContext) {
  const additionalMissing = [
    {
      field: "brand",
      whyItMatters: "品牌会影响标题、品牌归属、图片和 Amazon 后台基础信息。",
      example: "Work UP Travel, seller private-label brand, or registered brand name",
      impactArea: "title",
    },
    {
      field: "dimensions",
      whyItMatters: "尺寸影响标题、五点、图片说明和买家是否能确认适配场景。",
      example: "20 x 14 x 9 inches",
      impactArea: "title",
    },
    {
      field: "weight",
      whyItMatters: "重量影响便携性表达、配送预期和买家决策。",
      example: "2.8 lb, 1.3 kg",
      impactArea: "bulletPoints",
    },
    {
      field: "capacity",
      whyItMatters: "容量缺失时，不能安全写 large capacity、heavy-duty 等强 claim。",
      example: "35 L, fits 3 days of clothes",
      impactArea: "compliance",
    },
  ] satisfies GenerationResult["missingInfo"];
  const filteredAdditionalMissing = additionalMissing.filter(
    (item) => !hasConfirmedFact(context, item.field),
  );

  return uniqueByText(
    [...context.productBrief.missingInfo, ...filteredAdditionalMissing],
    (item) => item.field,
  );
}

function normalizeMissingInfo(
  rawMissingInfo: unknown,
  context: GenerationValidationContext,
): GenerationResult["missingInfo"] {
  const normalized = asArray(rawMissingInfo)
    .map((item): GenerationResult["missingInfo"][number] | null => {
      if (typeof item === "string") {
        const field = cleanText(item);

        return field
          ? {
              field,
              whyItMatters: "这个信息会影响 Listing 的具体度、可信度或合规边界。",
              example: "Add a concrete value from product specs or supplier data.",
              impactArea: "bulletPoints",
            }
          : null;
      }

      const record = asRecord(item);
      const field = textFromRecord(record, ["field", "name", "missingField", "title"]);

      if (!field) {
        return null;
      }

      return {
        field,
        whyItMatters: textFromRecord(
          record,
          ["whyItMatters", "reason", "importance"],
          "这个信息会影响 Listing 的具体度、可信度或合规边界。",
        ),
        example: textFromRecord(
          record,
          ["example", "sample", "expectedValue"],
          "Add a concrete value from product specs or supplier data.",
        ),
        impactArea: validImpactArea(textFromRecord(record, ["impactArea", "area"])),
      };
    })
    .filter((item): item is GenerationResult["missingInfo"][number] => Boolean(item));

  return normalized.length > 0 ? normalized : defaultMissingInfo(context);
}

function defaultAssumptions(context: GenerationValidationContext) {
  const product = context.productBrief.product;
  const assumptions: GenerationResult["assumptions"] = [
    {
      assumption: `${product.category} is positioned for practical buyer use.`,
      reason: "The provided category is the strongest confirmed business context.",
      confidence: "medium",
      shouldVerifyWithUser: true,
    },
    {
      assumption: "Unconfirmed specifications should stay out of the final listing copy.",
      reason: "Missing size, capacity, warranty, certification, or feature proof creates claim risk.",
      confidence: "high",
      shouldVerifyWithUser: true,
    },
  ];

  if (context.listingStrategy.safeClaims.length > 0) {
    assumptions.push({
      assumption: "Confirmed safe claims can be used as the primary selling-point base.",
      reason: context.listingStrategy.safeClaims
        .map((item) => item.claim)
        .slice(0, 3)
        .join(", "),
      confidence: "high",
      shouldVerifyWithUser: false,
    });
  }

  return assumptions;
}

function normalizeAssumptions(
  rawAssumptions: unknown,
  context: GenerationValidationContext,
): GenerationResult["assumptions"] {
  const normalized = asArray(rawAssumptions)
    .map((item): GenerationResult["assumptions"][number] | null => {
      const record = asRecord(item);
      const assumption = textFromRecord(record, ["assumption", "title", "name", "text"]);

      if (!assumption) {
        return null;
      }

      return {
        assumption,
        reason: textFromRecord(
          record,
          ["reason", "why", "basis"],
          "Based on the current product information and conservative Work UP strategy.",
        ),
        confidence: validConfidence(textFromRecord(record, ["confidence"])),
        shouldVerifyWithUser:
          typeof record.shouldVerifyWithUser === "boolean"
            ? record.shouldVerifyWithUser
            : true,
      };
    })
    .filter((item): item is GenerationResult["assumptions"][number] => Boolean(item));

  return normalized.length > 0 ? normalized : defaultAssumptions(context);
}

function defaultComplianceNotes(context: GenerationValidationContext) {
  const notes: GenerationResult["complianceNotes"] = [
    ...context.productBrief.prohibitedClaims.map((item) => ({
      riskLevel: "high" as const,
      claim: item.claim,
      reason: item.reason,
      recommendation: "Do not use this claim until proof is available.",
      relatedField: item.source,
    })),
    ...context.competitorInsights.riskyClaims.map((item) => ({
      riskLevel: "medium" as const,
      claim: item.claim,
      reason: item.reason,
      recommendation: "Keep this as an opportunity only until your own product proof confirms it.",
      relatedField: "competitorInsights.riskyClaims",
    })),
    ...context.competitorInsights.blockedFromFinalListing.map((item) => ({
      riskLevel: item.reason === "brand_term" ? "high" as const : "medium" as const,
      claim: item.claim,
      reason:
        item.reason === "brand_term"
          ? "Competitor brand terms must not enter Search Terms or final copy."
          : "Competitor claim is unconfirmed for this product.",
      recommendation: "Confirm with your own product specs before using this wording.",
      relatedField: `competitorInsights.blockedFromFinalListing.${item.reason}`,
    })),
  ];

  return uniqueByText(notes, (item) => `${item.claim}-${item.reason}`);
}

function normalizeComplianceNotes(
  rawComplianceNotes: unknown,
  context: GenerationValidationContext,
): GenerationResult["complianceNotes"] {
  const normalized = asArray(rawComplianceNotes)
    .map((item): GenerationResult["complianceNotes"][number] | null => {
      const record = asRecord(item);
      const claim = textFromRecord(record, ["claim", "risk", "issue", "title"]);

      if (!claim) {
        return null;
      }

      return {
        riskLevel: validRiskLevel(textFromRecord(record, ["riskLevel", "level"])),
        claim,
        reason: textFromRecord(
          record,
          ["reason", "why", "description"],
          "This claim needs confirmation before entering final listing copy.",
        ),
        recommendation: textFromRecord(
          record,
          ["recommendation", "suggestion", "action"],
          "Verify product proof before using this claim.",
        ),
        relatedField: textFromRecord(record, ["relatedField", "field", "source"]),
      };
    })
    .filter((item): item is GenerationResult["complianceNotes"][number] => Boolean(item));

  return normalized.length > 0 ? normalized : defaultComplianceNotes(context);
}

function defaultImprovementSuggestions(
  context: GenerationValidationContext,
): GenerationResult["improvementSuggestions"] {
  const missingFields = defaultMissingInfo(context)
    .map((item) => item.field)
    .slice(0, 4)
    .join(", ");

  return [
    {
      priority: "high",
      suggestion: `补充关键规格：${missingFields || "dimensions, weight, capacity, brand"}.`,
      reason: "这些字段会直接影响标题、五点、图片说明和买家判断。",
      expectedImpact: "bulletPoints",
    },
    {
      priority: "high",
      suggestion: "确认所有可能涉及功能、认证、保修或强性能的 claim。",
      reason: "未确认 claim 不能进入最终 Listing，否则容易产生合规风险。",
      expectedImpact: "compliance",
    },
    {
      priority: "medium",
      suggestion: "补充真实使用场景、目标买家和差异化证据。",
      reason: "更具体的场景和差异化会让文案更接近真实运营表达。",
      expectedImpact: "conversion",
    },
  ];
}

function normalizeImprovementSuggestions(
  rawSuggestions: unknown,
  context: GenerationValidationContext,
): GenerationResult["improvementSuggestions"] {
  const normalized = asArray(rawSuggestions)
    .map((item): GenerationResult["improvementSuggestions"][number] | null => {
      const record = asRecord(item);
      const suggestion = textFromRecord(record, ["suggestion", "title", "action", "text"]);

      if (!suggestion) {
        return null;
      }

      return {
        priority: validPriority(textFromRecord(record, ["priority"])),
        suggestion,
        reason: textFromRecord(
          record,
          ["reason", "why", "basis"],
          "This improves listing specificity and buyer trust.",
        ),
        expectedImpact: validImpactArea(textFromRecord(record, ["expectedImpact", "impactArea"])),
      };
    })
    .filter((item): item is GenerationResult["improvementSuggestions"][number] =>
      Boolean(item),
    );

  return uniqueByText(
    [...normalized, ...defaultImprovementSuggestions(context)],
    (item) => item.suggestion,
  ).slice(0, Math.max(3, normalized.length));
}

function normalizeAnalysis(
  rawAnalysis: unknown,
  context: GenerationValidationContext,
): GenerationResult["analysis"] {
  const record = asRecord(rawAnalysis);
  const fallback = buildFallbackAnalysis(context);

  return {
    productSummary: textFromRecord(record, ["productSummary"], fallback.productSummary),
    strategySummary: textFromRecord(record, ["strategySummary"], fallback.strategySummary),
    competitorSummary: textFromRecord(record, ["competitorSummary"], fallback.competitorSummary),
    complianceSummary: textFromRecord(record, ["complianceSummary"], fallback.complianceSummary),
    beginnerExplanation: textFromRecord(
      record,
      ["beginnerExplanation"],
      fallback.beginnerExplanation,
    ),
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
    finalListing: normalizeFinalListing(result.finalListing, context),
    complianceNotes: normalizeComplianceNotes(result.complianceNotes, context),
    missingInfo: normalizeMissingInfo(result.missingInfo, context),
    assumptions: normalizeAssumptions(result.assumptions, context),
    improvementSuggestions: normalizeImprovementSuggestions(
      result.improvementSuggestions,
      context,
    ),
    analysis: normalizeAnalysis(result.analysis, context),
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
