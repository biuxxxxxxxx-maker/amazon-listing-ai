import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const schemaSource = await readFile(
  new URL("../lib/workup-schema.ts", import.meta.url),
  "utf8",
);

const resultLiteral = `{
  schemaVersion: "workup.v1",
  source: "deepseek",
  generatedAt: "2026-05-26T10:00:00.000Z",
  model: "deepseek-chat",
  qualityScore: {
    overall: 58,
    level: "basic",
    dimensions: {
      inputCompleteness: 35,
      keywordRelevance: 60,
      complianceSafety: 85,
      amazonReadiness: 55,
      copyClarity: 65,
    },
    summary: "低信息输入，可以生成保守版本，但需要补充材质和尺寸。",
  },
  productBrief: {
    schemaVersion: "workup.v1",
    product: {
      nameCn: "行李箱",
      marketplace: "US",
      category: "Travel & Luggage",
    },
    confirmedFacts: [
      {
        field: "productNameCn",
        value: "行李箱",
        source: "user_input",
        confidence: "high",
      },
      {
        field: "category",
        value: "Travel & Luggage",
        source: "user_input",
        confidence: "high",
      },
    ],
    missingInfo: [
      {
        field: "material",
        whyItMatters: "材质会影响耐用性、重量和合规表达。",
        example: "PC, ABS, aluminum frame, polyester lining",
        impactArea: "bulletPoints",
      },
    ],
    prohibitedClaims: [
      {
        claim: "heavy-duty",
        reason: "缺少承重、材质或测试数据时不能写 heavy-duty。",
        source: "system_inference",
      },
    ],
    rawInputCompleteness: {
      requiredFieldsProvided: 2,
      requiredFieldsTotal: 6,
      optionalFieldsProvided: 0,
    },
  },
  competitorInsights: {
    input: {
      titles: [],
      urls: [],
      bulletPoints: [],
      reviewPainPoints: [],
      differentiationNotes: [],
    },
    keywordPatterns: ["carry on luggage", "travel suitcase"],
    buyerPainPoints: [],
    competitorAngles: [],
    opportunities: [],
    riskyClaims: [],
    blockedFromFinalListing: [],
    notes: {
      competitorClaimsPolicy: "competitor claims cannot be copied directly into finalListing",
      unconfirmedFeaturesPolicy: "unconfirmed competitor features must become missingInfo or opportunities",
    },
  },
  listingStrategy: {
    primaryKeyword: "carry on luggage",
    secondaryKeywords: ["travel suitcase", "luggage for trips"],
    positioning: {
      direction: "A practical suitcase for simple travel needs.",
      targetBuyer: "Travel shoppers",
      useCases: ["Weekend trips", "Business travel"],
      tone: "localized",
    },
    sellingPointOrder: [
      {
        rank: 1,
        sellingPoint: "Simple travel organization",
        reason: "Low-info input should stay broad and safe.",
        evidenceFields: ["productNameCn", "category"],
      },
      {
        rank: 2,
        sellingPoint: "Easy trip planning",
        reason: "General travel use is safe for the category.",
        evidenceFields: ["category"],
      },
      {
        rank: 3,
        sellingPoint: "Everyday travel fit",
        reason: "Avoids unsupported dimensions or materials.",
        evidenceFields: ["productNameCn"],
      },
      {
        rank: 4,
        sellingPoint: "Clean Amazon wording",
        reason: "Keeps claims conservative.",
        evidenceFields: ["category"],
      },
      {
        rank: 5,
        sellingPoint: "Buyer-friendly description",
        reason: "Explains use without inventing specs.",
        evidenceFields: ["productNameCn"],
      },
    ],
    avoidClaims: [
      {
        claim: "heavy-duty",
        reason: "No confirmed material or load data.",
      },
    ],
    safeClaims: [
      {
        claim: "travel suitcase",
        evidence: "Product name and category indicate luggage.",
      },
    ],
  },
  finalListing: {
    title: {
      english: "Carry-On Luggage for Weekend Trips and Simple Travel Organization",
      chineseExplanation: "保守表达为适合短途旅行和基础收纳的登机箱，不编造材质或尺寸。",
    },
    bulletPoints: [
      {
        english: "Designed for simple travel routines, this suitcase helps keep trip essentials organized for weekend getaways, work travel, and everyday packing needs.",
        chineseExplanation: "强调通用旅行收纳，不写未经确认的尺寸或材质。",
        sourceBasis: "safe_inference",
        evidenceFields: ["productNameCn", "category"],
      },
      {
        english: "A practical luggage option for shoppers who want a clean, easy-to-understand travel companion without unnecessary feature claims.",
        chineseExplanation: "强调实用和清晰表达，避免夸大功能。",
        sourceBasis: "safe_inference",
        evidenceFields: ["category"],
      },
      {
        english: "Use it for short trips, business travel, or general packing when you need a straightforward suitcase for clothing and daily items.",
        chineseExplanation: "使用场景保持宽泛，适合低信息输入。",
        sourceBasis: "safe_inference",
        evidenceFields: ["productNameCn"],
      },
      {
        english: "The listing avoids unsupported material, capacity, and durability claims so buyers see clear benefits based on confirmed product information.",
        chineseExplanation: "说明结果采用合规保守策略。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["productNameCn", "category"],
      },
      {
        english: "Add confirmed size, material, wheel, and compartment details later to make the listing more specific and conversion-ready.",
        chineseExplanation: "提示后续补充资料，不伪造参数。",
        sourceBasis: "safe_inference",
        evidenceFields: ["material", "dimensions"],
      },
    ],
    description: {
      english: "Keep travel preparation simple with a suitcase listing written around confirmed product context. This conservative version focuses on broad travel use, clear organization, and buyer-friendly wording while leaving room to add confirmed material, size, wheel, and compartment details later.",
      chineseExplanation: "描述保持保守，说明当前版本基于已确认资料生成。",
    },
    searchTerms: {
      english: "carry on luggage travel suitcase weekend trip luggage business travel suitcase packing organizer",
      chineseExplanation: "后台关键词围绕登机箱、旅行箱、短途旅行和商务旅行。",
    },
  },
  complianceNotes: [
    {
      riskLevel: "medium",
      claim: "heavy-duty",
      reason: "No confirmed material or load data.",
      recommendation: "Only use after verified test data or supplier proof.",
      relatedField: "material",
    },
  ],
  missingInfo: [
    {
      field: "dimensions",
      whyItMatters: "尺寸会影响标题、五点和买家购买判断。",
      example: "20 inch carry-on, 14 x 9 x 22 inches",
      impactArea: "title",
    },
  ],
  assumptions: [
    {
      assumption: "The product is a general suitcase for travel use.",
      reason: "The user supplied product name and luggage category.",
      confidence: "medium",
      shouldVerifyWithUser: true,
    },
  ],
  improvementSuggestions: [
    {
      priority: "high",
      suggestion: "补充材质、尺寸、轮子结构和内部收纳信息。",
      reason: "这些信息会让标题和五点更具体。",
      expectedImpact: "conversion",
    },
  ],
  analysis: {
    productSummary: "低信息行李箱项目。",
    strategySummary: "用保守旅行场景和泛关键词生成基础 Listing。",
    competitorSummary: "未提供竞品输入。",
    complianceSummary: "避免 heavy-duty、具体材质和尺寸 claim。",
    beginnerExplanation: "资料少也可以先生成基础版，但正式上架前应补充关键参数。",
  },
}`;

const sampleSource = `
import type { GenerationResult } from "./workup-schema";

export const validLowInfoResult = ${resultLiteral} satisfies GenerationResult;
`;

const tempDir = await mkdtemp(join(tmpdir(), "work-up-schema-test-"));
const schemaPath = join(tempDir, "workup-schema.ts");
const samplePath = join(tempDir, "sample.ts");

await writeFile(schemaPath, schemaSource, "utf8");
await writeFile(samplePath, sampleSource, "utf8");

const program = ts.createProgram([schemaPath, samplePath], {
  strict: true,
  noEmit: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  skipLibCheck: true,
});

const diagnostics = ts.getPreEmitDiagnostics(program);

if (diagnostics.length > 0) {
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => tempDir,
    getNewLine: () => "\n",
  });
  throw new Error(formatted);
}

const validLowInfoResult = Function(`return (${resultLiteral});`)();

assert.equal(validLowInfoResult.schemaVersion, "workup.v1");
assert.equal(validLowInfoResult.source, "deepseek");
assert.equal(validLowInfoResult.qualityScore.level, "basic");
assert.equal(validLowInfoResult.finalListing.bulletPoints.length, 5);
assert.ok(validLowInfoResult.finalListing.searchTerms.english.trim().length > 0);

for (const bullet of validLowInfoResult.finalListing.bulletPoints) {
  assert.ok(bullet.english.trim().length > 0);
  assert.ok(bullet.chineseExplanation.trim().length > 0);
  assert.ok(["confirmed_fact", "safe_inference", "competitor_inspired"].includes(bullet.sourceBasis));
  assert.ok(Array.isArray(bullet.evidenceFields));
}

console.log("Work UP schema tests passed");
