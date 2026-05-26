import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

function loadModule(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  const cjsModule = { exports };

  new Function("exports", "module", output.outputText)(exports, cjsModule);

  return cjsModule.exports;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const productBriefSource = await readFile(
  new URL("../lib/product-brief.ts", import.meta.url),
  "utf8",
);
const competitorInsightsSource = await readFile(
  new URL("../lib/competitor-insights.ts", import.meta.url),
  "utf8",
);
const listingStrategySource = await readFile(
  new URL("../lib/listing-strategy.ts", import.meta.url),
  "utf8",
);
const validationSource = await readFile(
  new URL("../lib/generation-result-validation.ts", import.meta.url),
  "utf8",
);

const { buildProductBrief } = loadModule(productBriefSource);
const { analyzeCompetitorInput } = loadModule(competitorInsightsSource);
const { buildListingStrategy } = loadModule(listingStrategySource);
const {
  isValidGenerationResultShape,
  validateEnglishFields,
  validateFinalListing,
  validateGenerationResult,
  validateNoBlockedClaims,
} = loadModule(validationSource);

const productBrief = buildProductBrief({
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    color: "黑色",
    material: "ABS",
  },
});
const competitorInsights = analyzeCompetitorInput({
  competitorTitle: [
    "Samsonite Carry On Luggage with Spinner Wheels",
    "Lightweight Hardside Luggage with TSA Lock and Expandable Design",
  ],
});
const listingStrategy = buildListingStrategy(productBrief, competitorInsights);
const context = {
  productBrief,
  competitorInsights,
  listingStrategy,
  model: "deepseek-chat",
};

function createValidResult() {
  return {
    schemaVersion: "workup.v1",
    source: "deepseek",
    generatedAt: "2026-05-26T00:00:00.000Z",
    model: "deepseek-chat",
    qualityScore: {
      overall: 78,
      level: "good",
      dimensions: {
        inputCompleteness: 45,
        keywordRelevance: 80,
        complianceSafety: 90,
        amazonReadiness: 76,
        copyClarity: 85,
      },
      summary: "资料较少，但核心类目、颜色和材质可支持保守生成。",
    },
    productBrief,
    competitorInsights,
    listingStrategy,
    finalListing: {
      title: {
        english: "Black ABS Hard Shell Suitcase for Practical Travel Use",
        chineseExplanation: "标题基于已确认的黑色、ABS 和行李箱类目。",
      },
      bulletPoints: [
        {
          english: "ABS Shell for Everyday Travel: Built around the confirmed ABS material for a practical suitcase profile.",
          chineseExplanation: "基于用户确认的 ABS 材质表达基础卖点。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["material", "category"],
        },
        {
          english: "Black Finish for Easy Matching: The confirmed black color gives the suitcase a clean travel look.",
          chineseExplanation: "基于用户确认的黑色外观。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["color"],
        },
        {
          english: "Made for Travel Routines: Positioned for general trips without adding unverified size or capacity details.",
          chineseExplanation: "保守表达旅行场景，不编造尺寸或容量。",
          sourceBasis: "safe_inference",
          evidenceFields: ["category"],
        },
        {
          english: "Simple Packing Support: Keeps the message focused on practical use while asking for more packing details later.",
          chineseExplanation: "资料不足时保守回应收纳需求。",
          sourceBasis: "safe_inference",
          evidenceFields: ["missingInfo"],
        },
        {
          english: "Clear, Compliance-Safe Copy: Avoids unverified promises and keeps claims tied to confirmed inputs.",
          chineseExplanation: "强调合规，不写未经确认的强 claim。",
          sourceBasis: "safe_inference",
          evidenceFields: ["avoidClaims", "safeClaims"],
        },
      ],
      description: {
        english:
          "This black ABS suitcase is written for practical travel use with conservative, fact-based copy. The listing avoids unverified specifications and focuses on confirmed product inputs.",
        chineseExplanation: "描述只使用已确认信息，并提醒资料不足。",
      },
      searchTerms: {
        english: "black suitcase abs luggage hard shell travel suitcase",
        chineseExplanation: "后台词包含安全关键词，不加入品牌或高风险 claim。",
      },
    },
    complianceNotes: [],
    missingInfo: productBrief.missingInfo,
    assumptions: [
      {
        assumption: "The product is positioned for general travel use.",
        reason: "The category is Travel & Luggage.",
        confidence: "medium",
        shouldVerifyWithUser: true,
      },
    ],
    improvementSuggestions: [
      {
        priority: "high",
        suggestion: "补充尺寸、容量、轮子和锁具信息。",
        reason: "这些信息会影响标题、五点和合规边界。",
        expectedImpact: "bulletPoints",
      },
    ],
    analysis: {
      productSummary: "行李箱，黑色，ABS。",
      strategySummary: "使用安全关键词和保守卖点排序。",
      competitorSummary: "竞品提供关键词参考，但未确认功能不写入最终 Listing。",
      complianceSummary: "避免 TSA lock、spinner wheels、expandable 等未确认 claim。",
      beginnerExplanation: "资料少也可以生成，但越具体越接近真实运营需求。",
    },
  };
}

const validResult = createValidResult();

assert.ok(isValidGenerationResultShape(validResult));
assert.equal(validateFinalListing(validResult.finalListing).bulletPoints.length, 5);
assert.equal(validateGenerationResult(validResult, context), validResult);
assert.doesNotThrow(() => validateEnglishFields(validResult));
assert.doesNotThrow(() => validateNoBlockedClaims(validResult, context));

const mockSourceResult = clone(validResult);
mockSourceResult.source = "mock";
assert.throws(() => validateGenerationResult(mockSourceResult, context), /source/);
assert.equal(isValidGenerationResultShape(mockSourceResult), false);

const mockModelResult = clone(validResult);
mockModelResult.model = "mock-local";
assert.throws(() => validateGenerationResult(mockModelResult, context), /mock-local/);

const shortBulletsResult = clone(validResult);
shortBulletsResult.finalListing.bulletPoints = shortBulletsResult.finalListing.bulletPoints.slice(0, 4);
assert.throws(() => validateGenerationResult(shortBulletsResult, context), /exactly 5/);

const blockedClaimResult = clone(validResult);
blockedClaimResult.finalListing.title.english =
  "Black ABS Suitcase with TSA Lock for Practical Travel";
assert.throws(() => validateGenerationResult(blockedClaimResult, context), /TSA lock/);

const chineseEnglishResult = clone(validResult);
chineseEnglishResult.finalListing.bulletPoints[0].english = "这是大量中文内容，不能进入英文 copy 字段。";
assert.throws(() => validateGenerationResult(chineseEnglishResult, context), /Chinese/);

const brandSearchTermsResult = clone(validResult);
brandSearchTermsResult.finalListing.searchTerms.english =
  "black suitcase abs luggage samsonite travel";
assert.throws(() => validateGenerationResult(brandSearchTermsResult, context), /Samsonite/);

console.log("Generation Result Validation tests passed");
