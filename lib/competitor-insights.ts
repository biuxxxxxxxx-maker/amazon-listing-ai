import type { CompetitorInput, CompetitorInsights } from "@/lib/workup-schema";

export type AnalyzeCompetitorInput = {
  competitorTitle?: string | string[];
  competitorUrl?: string | string[];
  competitorSellingPoints?: string | string[];
  reviewPainPoints?: string | string[];
  differentiation?: string | string[];
  competitor_title?: string | string[];
  competitor_url?: string | string[];
  competitor_selling_points?: string | string[];
  review_pain_points?: string | string[];
};

type PhraseRule = {
  phrase: string;
  pattern: RegExp;
};

type OpportunityRule = PhraseRule & {
  opportunity: string;
  requiredConfirmation: string;
};

const NOTES = {
  competitorClaimsPolicy: "competitor claims cannot be copied directly into finalListing",
  unconfirmedFeaturesPolicy:
    "unconfirmed competitor features must become missingInfo or opportunities",
} as const;

const knownBrandTerms = [
  "Samsonite",
  "Travelpro",
  "American Tourister",
  "Delsey",
  "Tumi",
  "Rimowa",
  "Away",
  "Monos",
  "Amazon Basics",
  "AmazonBasics",
  "Kenneth Cole",
  "Briggs & Riley",
] as const;

const keywordRules: PhraseRule[] = [
  { phrase: "carry on luggage", pattern: /\bcarry[\s-]?on\s+luggage\b/i },
  { phrase: "hard shell suitcase", pattern: /\bhard[\s-]?shell\s+suitcase\b/i },
  { phrase: "hardside suitcase", pattern: /\bhardside\s+suitcase\b/i },
  { phrase: "hardside luggage", pattern: /\bhardside\s+luggage\b/i },
  { phrase: "spinner wheels", pattern: /\b(?:360(?:°| degree)?\s*)?spinner\s+wheels?\b/i },
  { phrase: "TSA lock", pattern: /\btsa\s+lock\b/i },
  { phrase: "expandable", pattern: /\bexpandable\b/i },
  { phrase: "lightweight", pattern: /\blight[\s-]?weight\b/i },
  { phrase: "travel suitcase", pattern: /\btravel\s+suitcase\b/i },
  { phrase: "black luggage", pattern: /\bblack\s+luggage\b/i },
  { phrase: "ABS luggage", pattern: /\babs\s+luggage\b/i },
  { phrase: "waterproof", pattern: /\bwater[\s-]?proof\b/i },
  { phrase: "scratch resistant", pattern: /\bscratch[\s-]?resistant\b/i },
  { phrase: "organizer", pattern: /\borganizers?\b/i },
  { phrase: "storage", pattern: /\bstorage\b/i },
  { phrase: "portable", pattern: /\bportable\b/i },
  { phrase: "foldable", pattern: /\bfoldable\b/i },
  { phrase: "luggage", pattern: /\bluggage\b/i },
  { phrase: "suitcase", pattern: /\bsuitcases?\b/i },
];

const painPointRules: PhraseRule[] = [
  { phrase: "zipper issue", pattern: /\bzipper\b|\bzip\b|拉链/i },
  { phrase: "wheel noise", pattern: /\bwheel(?:s)?\b.*\bnoisy\b|\bnoisy\b.*\bwheel(?:s)?\b|轮子.*声音|声音大/i },
  {
    phrase: "wheel durability",
    pattern: /\bwheel(?:s)?\b.*\b(?:broke|broken|durability|weak|wobble|loose)\b|轮子.*(?:坏|晃|不稳|耐用)/i,
  },
  { phrase: "handle durability", pattern: /\bhandle\b.*\b(?:weak|wobble|loose|broke|broken)\b|拉杆.*(?:晃|弱|松|坏)|手柄.*(?:晃|弱|松|坏)/i },
  { phrase: "easy to scratch", pattern: /\bscratch(?:es|ed)?\b|容易刮|刮花/i },
  { phrase: "too heavy", pattern: /\btoo\s+heavy\b|\bheavy\b|太重/i },
  { phrase: "limited capacity", pattern: /\blimited\s+capacity\b|\bsmall\s+capacity\b|容量.*(?:小|有限)|装不下/i },
  { phrase: "hard to organize", pattern: /\bhard\s+to\s+organize\b|\bpoor\s+organization\b|不好收纳|难整理/i },
  { phrase: "lock issue", pattern: /\block\b.*\b(?:issue|problem|jam|stuck|broken)\b|锁.*(?:问题|卡|坏)/i },
  { phrase: "size not accepted by airline", pattern: /\bairline\b.*\b(?:not\s+accepted|reject|too\s+large|oversized)\b|航空.*(?:不接受|超规|尺寸)/i },
  { phrase: "odor", pattern: /\bodou?r\b|\bsmell\b|异味|味道/i },
  { phrase: "broken after use", pattern: /\bbroken\s+after\b|\bbroke\s+after\b|用.*(?:坏|断)/i },
];

const angleRules: PhraseRule[] = [
  { phrase: "lightweight travel", pattern: /\blight[\s-]?weight\b|\btravel\b|旅行|出行/i },
  { phrase: "business travel", pattern: /\bbusiness\s+travel\b|商务/i },
  { phrase: "weekend trips", pattern: /\bweekend\b|\bshort\s+trip\b|周末|短途/i },
  { phrase: "hard shell protection", pattern: /\bhard[\s-]?shell\b|\bhardside\b|硬壳/i },
  { phrase: "smooth mobility", pattern: /\bspinner\s+wheels?\b|\b360(?:°| degree)?\b|\bsmooth\b.*\bwheel/i },
  { phrase: "expandable packing", pattern: /\bexpandable\b|\bexpansion\b|扩展/i },
  { phrase: "organized storage", pattern: /\borganizers?\b|\bstorage\b|\bcompartment\b|收纳|分区/i },
  { phrase: "carry-on convenience", pattern: /\bcarry[\s-]?on\b|登机/i },
  { phrase: "family travel", pattern: /\bfamily\s+travel\b|家庭旅行/i },
  { phrase: "student travel", pattern: /\bstudent\b|\bdorm\b|学生|宿舍/i },
];

const riskyClaimRules: PhraseRule[] = [
  { phrase: "waterproof", pattern: /\bwater[\s-]?proof\b/i },
  { phrase: "scratch-proof", pattern: /\bscratch[\s-]?proof\b/i },
  { phrase: "scratch resistant", pattern: /\bscratch[\s-]?resistant\b/i },
  { phrase: "unbreakable", pattern: /\bunbreakable\b/i },
  { phrase: "TSA lock", pattern: /\btsa\s+lock\b/i },
  { phrase: "airline approved", pattern: /\bairline[\s-]?approved\b/i },
  { phrase: "lifetime warranty", pattern: /\blifetime\s+warranty\b/i },
  { phrase: "guaranteed", pattern: /\bguaranteed\b/i },
  { phrase: "best seller", pattern: /\bbest[\s-]?seller\b/i },
  { phrase: "medical grade", pattern: /\bmedical[\s-]?grade\b/i },
  { phrase: "FDA approved", pattern: /\bfda[\s-]?approved\b/i },
  { phrase: "antibacterial", pattern: /\banti[\s-]?bacterial\b/i },
  { phrase: "heavy-duty", pattern: /\bheavy[\s-]?duty\b/i },
];

const blockedFeatureRules: PhraseRule[] = [
  { phrase: "spinner wheels", pattern: /\b(?:360(?:°| degree)?\s*)?spinner\s+wheels?\b/i },
  { phrase: "TSA lock", pattern: /\btsa\s+lock\b/i },
  { phrase: "expandable", pattern: /\bexpandable\b/i },
  { phrase: "waterproof", pattern: /\bwater[\s-]?proof\b/i },
  { phrase: "scratch resistant", pattern: /\bscratch[\s-]?resistant\b/i },
  { phrase: "scratch-proof", pattern: /\bscratch[\s-]?proof\b/i },
  { phrase: "unbreakable", pattern: /\bunbreakable\b/i },
  { phrase: "airline approved", pattern: /\bairline[\s-]?approved\b/i },
  { phrase: "lifetime warranty", pattern: /\blifetime\s+warranty\b/i },
  { phrase: "heavy-duty", pattern: /\bheavy[\s-]?duty\b/i },
];

const opportunityRules: OpportunityRule[] = [
  {
    phrase: "spinner wheels",
    pattern: /\b(?:360(?:°| degree)?\s*)?spinner\s+wheels?\b/i,
    opportunity:
      "竞品强调 spinner wheels。如果你的产品确实具备 360° 万向轮，可以确认后作为移动性卖点。",
    requiredConfirmation: "确认轮子类型、轮数、转向方式或真实测试反馈。",
  },
  {
    phrase: "TSA lock",
    pattern: /\btsa\s+lock\b/i,
    opportunity:
      "竞品强调 TSA lock。如果你的产品确实具备 TSA 锁，可以确认后用于增强出行安全感表达。",
    requiredConfirmation: "确认是否有 TSA-approved lock。",
  },
  {
    phrase: "expandable",
    pattern: /\bexpandable\b/i,
    opportunity:
      "竞品强调 expandable design。如果你的产品确实可扩展，可以确认后作为额外收纳空间卖点。",
    requiredConfirmation: "确认是否有扩展层、扩展拉链和扩展后的容量变化。",
  },
  {
    phrase: "lightweight",
    pattern: /\blight[\s-]?weight\b/i,
    opportunity:
      "竞品强调 lightweight。如果你的产品有明确重量或轻量材质，可以确认后强化便携性。",
    requiredConfirmation: "确认产品重量、材质和对比依据。",
  },
  {
    phrase: "hard shell protection",
    pattern: /\bhard[\s-]?shell\b|\bhardside\b/i,
    opportunity:
      "竞品强调硬壳保护。如果你的产品确实为硬壳箱体，可以确认材质后表达保护性。",
    requiredConfirmation: "确认箱壳材质、结构和可证明的保护范围。",
  },
  {
    phrase: "organized storage",
    pattern: /\borganizers?\b|\bstorage\b|\bcompartment\b/i,
    opportunity:
      "竞品强调收纳分区。如果你的产品有内部隔层或整理结构，可以确认后作为组织收纳卖点。",
    requiredConfirmation: "确认内部隔层、绑带、网袋或分区结构。",
  },
];

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    result.push(normalized);
    seen.add(key);
  }

  return result;
}

function asTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => asTextArray(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickInputValues(
  input: AnalyzeCompetitorInput,
  camelKey: keyof AnalyzeCompetitorInput,
  snakeKey: keyof AnalyzeCompetitorInput,
) {
  return unique([...asTextArray(input[camelKey]), ...asTextArray(input[snakeKey])]);
}

function combinedText(input: CompetitorInput) {
  return [
    ...input.titles,
    ...input.bulletPoints,
    ...input.reviewPainPoints,
    ...input.differentiationNotes,
  ].join("\n");
}

function competitorClaimText(input: CompetitorInput) {
  return [...input.titles, ...input.bulletPoints].join("\n");
}

function collectPhrases(text: string, rules: PhraseRule[]) {
  return unique(rules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.phrase));
}

function detectBrandTerms(input: CompetitorInput) {
  const text = competitorClaimText(input);

  return unique(knownBrandTerms.filter((brand) => new RegExp(`\\b${escapeRegExp(brand)}\\b`, "i").test(text)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasChinesePainPoint(text: string) {
  return /拉杆|轮子|拉链|声音|装满|不好拉|晃|坏|异味|刮|容量|太重/.test(text);
}

function extractChinesePainPoints(input: CompetitorInput) {
  const text = [...input.reviewPainPoints, ...input.bulletPoints].join("\n");

  if (!hasChinesePainPoint(text)) {
    return [];
  }

  return unique(
    [...input.reviewPainPoints, ...input.bulletPoints]
      .filter((item) => /[\u4e00-\u9fa5]/.test(item))
      .map((item) => item.trim()),
  );
}

function buildOpportunities(input: CompetitorInput): CompetitorInsights["opportunities"] {
  const text = competitorClaimText(input);

  return opportunityRules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => ({
      opportunity: rule.opportunity,
      source: "competitor_claim" as const,
      requiredConfirmation: rule.requiredConfirmation,
    }));
}

export function normalizeCompetitorInput(input: AnalyzeCompetitorInput): CompetitorInput {
  return {
    titles: pickInputValues(input, "competitorTitle", "competitor_title"),
    urls: pickInputValues(input, "competitorUrl", "competitor_url"),
    bulletPoints: pickInputValues(
      input,
      "competitorSellingPoints",
      "competitor_selling_points",
    ),
    reviewPainPoints: pickInputValues(input, "reviewPainPoints", "review_pain_points"),
    differentiationNotes: unique(asTextArray(input.differentiation)),
  };
}

export function extractKeywordPatterns(input: AnalyzeCompetitorInput): string[] {
  const normalized = normalizeCompetitorInput(input);
  const text = [...normalized.titles, ...normalized.bulletPoints].join("\n");
  const brandTerms = new Set(detectBrandTerms(normalized).map((brand) => brand.toLowerCase()));

  return collectPhrases(text, keywordRules).filter(
    (phrase) => !brandTerms.has(phrase.toLowerCase()),
  );
}

export function extractBuyerPainPoints(input: AnalyzeCompetitorInput): string[] {
  const normalized = normalizeCompetitorInput(input);
  const text = [...normalized.reviewPainPoints, ...normalized.bulletPoints].join("\n");

  return unique([...collectPhrases(text, painPointRules), ...extractChinesePainPoints(normalized)]);
}

export function extractCompetitorAngles(input: AnalyzeCompetitorInput): string[] {
  const normalized = normalizeCompetitorInput(input);
  return collectPhrases(combinedText(normalized), angleRules);
}

export function detectRiskyCompetitorClaims(
  input: AnalyzeCompetitorInput,
): CompetitorInsights["riskyClaims"] {
  const normalized = normalizeCompetitorInput(input);
  const text = competitorClaimText(normalized);

  return collectPhrases(text, riskyClaimRules).map((claim) => ({
    claim,
    reason: `竞品资料中出现了高风险 claim "${claim}"，不能在未确认时进入 finalListing。`,
  }));
}

export function buildBlockedFromFinalListing(
  input: AnalyzeCompetitorInput,
): CompetitorInsights["blockedFromFinalListing"] {
  const normalized = normalizeCompetitorInput(input);
  const text = competitorClaimText(normalized);
  const featureBlocks: CompetitorInsights["blockedFromFinalListing"] = collectPhrases(
    text,
    blockedFeatureRules,
  ).map((claim) => ({
    claim,
    reason: "competitor_claim_unconfirmed",
  }));
  const brandBlocks: CompetitorInsights["blockedFromFinalListing"] = detectBrandTerms(
    normalized,
  ).map((claim) => ({
    claim,
    reason: "brand_term",
  }));

  return unique([...featureBlocks, ...brandBlocks].map((item) => JSON.stringify(item))).map(
    (item) => JSON.parse(item) as CompetitorInsights["blockedFromFinalListing"][number],
  );
}

export function analyzeCompetitorInput(input: AnalyzeCompetitorInput): CompetitorInsights {
  const normalized = normalizeCompetitorInput(input);

  return {
    input: normalized,
    keywordPatterns: extractKeywordPatterns(input),
    buyerPainPoints: extractBuyerPainPoints(input),
    competitorAngles: extractCompetitorAngles(input),
    opportunities: buildOpportunities(normalized),
    riskyClaims: detectRiskyCompetitorClaims(input),
    blockedFromFinalListing: buildBlockedFromFinalListing(input),
    notes: NOTES,
  };
}
