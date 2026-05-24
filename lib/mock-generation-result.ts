import { bulletPoints, faqItems, fullListingText, imageSuggestions } from "./mock-data";

export const mockGenerationResult = {
  source: "mock",
  product: {
    nameCn: "便携式折叠收纳篮",
    marketplace: "US",
    category: "Home & Kitchen",
  },
  analysis: {
    coreSellingPoints: ["折叠收纳", "多场景搬运", "小空间友好", "易清洁"],
    beginnerExplanation:
      "这个分析帮新手先判断产品应该卖给谁、解决什么问题、哪些话不能乱写。",
  },
  title: {
    english:
      "Collapsible Storage Basket with Handles, Foldable Organizer Bin for Laundry, Closet, Pantry, Car Trunk and Small Spaces, Neutral Home Storage Basket",
    chinese:
      "带提手的可折叠收纳篮，适合洗衣、衣柜、食品储物、汽车后备箱和小空间使用的中性色家居收纳篮。",
  },
  bullets: bulletPoints,
  description: {
    english:
      "Keep everyday storage simple with a collapsible basket designed for small spaces, busy homes, and flexible routines. Use it in the laundry room, closet, pantry, dorm, RV, or car trunk to keep frequently used items easy to see, carry, and put away. When the basket is not in use, fold it flat and store it neatly without taking up extra space.",
    chinese:
      "用这款可折叠收纳篮，让小空间、忙碌家庭和灵活日常的收纳更简单。它适合洗衣房、衣柜、食品储物、宿舍、房车或汽车后备箱，让常用物品更容易看到、搬运和归位。不用时可以折叠放平，整齐收纳，不额外占空间。",
  },
  searchTerms: {
    english:
      "collapsible storage basket foldable organizer bin laundry basket closet organizer pantry storage car trunk organizer small space storage",
    chinese:
      "关键词含义：可折叠收纳篮、折叠整理篮、洗衣篮、衣柜整理、食品储物、后备箱收纳、小空间收纳。",
  },
  faq: faqItems,
  imageSuggestions,
  copyReadyListing: fullListingText,
};

export type GenerationResult = typeof mockGenerationResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function contextText(context: unknown, keys: string[]) {
  const record = isRecord(context) ? context : {};

  for (const key of keys) {
    const value = stringValue(record[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function mergeRecord<T extends Record<string, unknown>>(fallback: T, value: unknown): T {
  return {
    ...fallback,
    ...(isRecord(value) ? value : {}),
  };
}

function arrayOrFallback<T>(value: unknown, fallback: T[]) {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function normalizeDeepSeekJsonResult(
  record: Record<string, unknown>,
  context?: unknown,
): GenerationResult {
  const title = stringValue(record.title) || mockGenerationResult.title.english;
  const titleCn = stringValue(record.title_cn) || mockGenerationResult.title.chinese;
  const bullets = Array.isArray(record.bullet_points)
    ? record.bullet_points
        .filter(isRecord)
        .map((bullet, index) => ({
          english: stringValue(bullet.en) || mockGenerationResult.bullets[index]?.english || "",
          chinese: stringValue(bullet.cn) || mockGenerationResult.bullets[index]?.chinese || "",
          sellingPoint: stringValue(bullet.sellingPoint) || `Bullet ${index + 1}`,
          painPoint: stringValue(bullet.painPoint) || "根据产品资料提炼的买家关注点。",
        }))
        .filter((bullet) => bullet.english || bullet.chinese)
    : [];
  const description = isRecord(record.description) ? record.description : {};
  const searchTerms = Array.isArray(record.search_terms)
    ? record.search_terms.map(stringValue).filter(Boolean)
    : [];
  const keywordSuggestions = Array.isArray(record.keyword_suggestions)
    ? record.keyword_suggestions.filter(isRecord)
    : [];
  const imageSuggestions = Array.isArray(record.image_suggestions)
    ? record.image_suggestions
        .filter(isRecord)
        .map((item, index) => ({
          type: `图片建议 ${index + 1}`,
          focus: stringValue(item.scene) || mockGenerationResult.imageSuggestions[index]?.focus || "",
          guidance: stringValue(item.cn) || mockGenerationResult.imageSuggestions[index]?.guidance || "",
        }))
        .filter((item) => item.focus || item.guidance)
    : [];
  const keywordExplanation = keywordSuggestions
    .map((item) => {
      const keyword = stringValue(item.keyword);
      const reason = stringValue(item.reason_cn);

      return [keyword, reason].filter(Boolean).join("：");
    })
    .filter(Boolean)
    .join("；");
  const copyReadyListing = [
    title,
    ...bullets.map((bullet) => bullet.english),
    stringValue(description.en),
    searchTerms.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    ...mockGenerationResult,
    source: "deepseek",
    product: {
      ...mockGenerationResult.product,
      nameCn:
        contextText(context, ["productName", "product_name_cn", "nameCn"]) ||
        mockGenerationResult.product.nameCn,
    },
    title: {
      english: title,
      chinese: titleCn,
    },
    bullets: bullets.length > 0 ? bullets : mockGenerationResult.bullets,
    description: {
      english: stringValue(description.en) || mockGenerationResult.description.english,
      chinese: stringValue(description.cn) || mockGenerationResult.description.chinese,
    },
    searchTerms: {
      english: searchTerms.length > 0 ? searchTerms.join(" ") : mockGenerationResult.searchTerms.english,
      chinese: keywordExplanation || mockGenerationResult.searchTerms.chinese,
    },
    imageSuggestions:
      imageSuggestions.length > 0 ? imageSuggestions : mockGenerationResult.imageSuggestions,
    copyReadyListing: copyReadyListing || mockGenerationResult.copyReadyListing,
  };
}

export function normalizeGenerationResult(value: unknown, context?: unknown): GenerationResult {
  const record = isRecord(value) ? value : {};

  if (typeof record.title === "string" || Array.isArray(record.bullet_points)) {
    return normalizeDeepSeekJsonResult(record, context);
  }

  return {
    ...mockGenerationResult,
    ...record,
    product: mergeRecord(mockGenerationResult.product, record.product),
    analysis: mergeRecord(mockGenerationResult.analysis, record.analysis),
    title: mergeRecord(mockGenerationResult.title, record.title),
    bullets: arrayOrFallback(record.bullets, mockGenerationResult.bullets),
    description: mergeRecord(mockGenerationResult.description, record.description),
    searchTerms: mergeRecord(mockGenerationResult.searchTerms, record.searchTerms),
    faq: arrayOrFallback(record.faq, mockGenerationResult.faq),
    imageSuggestions: arrayOrFallback(
      record.imageSuggestions,
      mockGenerationResult.imageSuggestions,
    ),
    copyReadyListing:
      typeof record.copyReadyListing === "string" && record.copyReadyListing.trim().length > 0
        ? record.copyReadyListing
        : mockGenerationResult.copyReadyListing,
  };
}
