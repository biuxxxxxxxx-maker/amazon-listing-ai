import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const { default: dotenv } = await import("dotenv");
dotenv.config({ path: ".env.local" });

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}

function loadModule(source, require = () => {
  throw new Error("Unexpected require");
}) {
  const exports = {};
  const cjsModule = { exports };

  new Function("exports", "module", "require", transpile(source))(exports, cjsModule, require);

  return cjsModule.exports;
}

const nativeFetch = global.fetch;
const sourceMap = new Map();

for (const path of [
  "../lib/product-brief.ts",
  "../lib/competitor-insights.ts",
  "../lib/listing-strategy.ts",
  "../lib/listing-prompt.ts",
  "../lib/generation-result-validation.ts",
  "../lib/ai-listing.ts",
]) {
  sourceMap.set(path, await readFile(new URL(path, import.meta.url), "utf8"));
}

const productBriefModule = loadModule(sourceMap.get("../lib/product-brief.ts"));
const competitorInsightsModule = loadModule(sourceMap.get("../lib/competitor-insights.ts"));
const listingStrategyModule = loadModule(sourceMap.get("../lib/listing-strategy.ts"));
const listingPromptModule = loadModule(sourceMap.get("../lib/listing-prompt.ts"));
const validationModule = loadModule(sourceMap.get("../lib/generation-result-validation.ts"));
const envValues = new Map([
  ["AI_PROVIDER", process.env.AI_PROVIDER || "deepseek"],
  ["DEEPSEEK_API_KEY", process.env.DEEPSEEK_API_KEY || "sk-deepseek-test-valid-format-key"],
  ["DEEPSEEK_MODEL", process.env.DEEPSEEK_MODEL || "deepseek-chat"],
  [
    "DEEPSEEK_BASE_URL",
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/chat/completions",
  ],
]);
const liveDeepSeekKey = process.env.DEEPSEEK_API_KEY?.trim() || "";
const shouldRunLiveDeepSeekTest =
  process.env.RUN_DEEPSEEK_LIVE_TEST === "true" && Boolean(liveDeepSeekKey);
const calls = {
  buildProductBrief: 0,
  analyzeCompetitorInput: 0,
  buildListingStrategy: 0,
  buildListingPrompt: 0,
};
let lastPromptContext = null;
let lastRequestBody = null;

function requireForAiListing(specifier) {
  if (specifier.includes("product-brief")) {
    return {
      ...productBriefModule,
      buildProductBrief: (...args) => {
        calls.buildProductBrief += 1;
        return productBriefModule.buildProductBrief(...args);
      },
    };
  }

  if (specifier.includes("competitor-insights")) {
    return {
      ...competitorInsightsModule,
      analyzeCompetitorInput: (...args) => {
        calls.analyzeCompetitorInput += 1;
        return competitorInsightsModule.analyzeCompetitorInput(...args);
      },
    };
  }

  if (specifier.includes("listing-strategy")) {
    return {
      ...listingStrategyModule,
      buildListingStrategy: (...args) => {
        calls.buildListingStrategy += 1;
        return listingStrategyModule.buildListingStrategy(...args);
      },
    };
  }

  if (specifier.includes("listing-prompt")) {
    return {
      ...listingPromptModule,
      buildListingPrompt: (productBrief, competitorInsights, listingStrategy) => {
        calls.buildListingPrompt += 1;
        lastPromptContext = { productBrief, competitorInsights, listingStrategy };
        return listingPromptModule.buildListingPrompt(
          productBrief,
          competitorInsights,
          listingStrategy,
        );
      },
    };
  }

  if (specifier.includes("generation-result-validation")) {
    return validationModule;
  }

  if (specifier.includes("cloudflare-env")) {
    return { readServerEnv: async (name) => envValues.get(name) || "" };
  }

  throw new Error(`Unexpected require: ${specifier}`);
}

const aiListingModule = loadModule(sourceMap.get("../lib/ai-listing.ts"), requireForAiListing);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoInvalidValues(value, path = "result") {
  if (value === undefined || value === null) {
    assert.fail(`${path} must not be ${value}`);
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    assert.fail(`${path} must not be NaN`);
  }

  if (typeof value === "string") {
    assert.doesNotMatch(value, /\b(undefined|null|nan)\b/i, `${path} has invalid display text`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoInvalidValues(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoInvalidValues(item, `${path}.${key}`);
    }
  }
}

function assertCompleteListingResult(result) {
  assert.equal(result.schemaVersion, "workup.v1");
  assert.equal(result.source, "deepseek");
  assert.equal(typeof result.qualityScore.summary, "string");
  assert.equal(typeof result.qualityScore.overall, "number");
  assert.equal(typeof result.qualityScore.level, "string");
  assert.equal(typeof result.finalListing.title.english, "string");
  assert.equal(result.finalListing.bulletPoints.length, 5);
  assert.equal(typeof result.finalListing.description.english, "string");
  assert.equal(typeof result.finalListing.searchTerms.english, "string");
  assert.ok(Array.isArray(result.missingInfo));
  assert.ok(Array.isArray(result.assumptions));
  assert.ok(Array.isArray(result.complianceNotes));
  assert.ok(Array.isArray(result.improvementSuggestions));
  assert.ok(result.missingInfo.length > 0);
  assert.ok(result.assumptions.length > 0);
  assert.ok(result.improvementSuggestions.length >= 3);

  for (const item of result.missingInfo) {
    assert.equal(typeof item.field, "string");
    assert.equal(typeof item.whyItMatters, "string");
    assert.equal(typeof item.example, "string");
    assert.equal(typeof item.impactArea, "string");
  }

  for (const item of result.assumptions) {
    assert.equal(typeof item.assumption, "string");
    assert.equal(typeof item.reason, "string");
    assert.equal(typeof item.confidence, "string");
    assert.equal(typeof item.shouldVerifyWithUser, "boolean");
  }

  for (const item of result.complianceNotes) {
    assert.equal(typeof item.riskLevel, "string");
    assert.equal(typeof item.claim, "string");
    assert.equal(typeof item.reason, "string");
    assert.equal(typeof item.recommendation, "string");
  }

  assertNoInvalidValues(result);
}

function createValidResult(overrides = {}) {
  const base = {
    schemaVersion: "workup.v1",
    source: "deepseek",
    generatedAt: "2026-05-26T00:00:00.000Z",
    model: "deepseek-chat",
    finalListing: {
      title: {
        english: "Black ABS Hard Shell Suitcase for Practical Travel Use",
        chineseExplanation: "标题基于黑色、ABS 和行李箱类目。",
      },
      bulletPoints: [
        {
          english: "ABS shell positioning uses the confirmed material without adding unsupported claims.",
          chineseExplanation: "基于已确认材质。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["material"],
        },
        {
          english: "Black color gives the suitcase a clean, easy-to-match travel look.",
          chineseExplanation: "基于已确认颜色。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["color"],
        },
        {
          english: "Travel-focused copy keeps the use case clear while avoiding unverified size details.",
          chineseExplanation: "保守表达旅行用途。",
          sourceBasis: "safe_inference",
          evidenceFields: ["category"],
        },
        {
          english: "Practical wording answers buyer needs without copying competitor feature claims.",
          chineseExplanation: "竞品只作参考。",
          sourceBasis: "competitor_inspired",
          evidenceFields: ["competitorInsights.buyerPainPoints"],
        },
        {
          english: "Compliance-safe language avoids promises that need separate proof.",
          chineseExplanation: "避免高风险承诺。",
          sourceBasis: "safe_inference",
          evidenceFields: ["avoidClaims"],
        },
      ],
      description: {
        english:
          "This black ABS suitcase listing is built from confirmed product facts and conservative Work UP strategy.",
        chineseExplanation: "描述不编造参数。",
      },
      searchTerms: {
        english: "black suitcase abs luggage hard shell travel suitcase",
        chineseExplanation: "后台词只包含安全关键词。",
      },
    },
    complianceNotes: [],
    missingInfo: [],
    assumptions: [],
    improvementSuggestions: [],
    analysis: {
      productSummary: "行李箱，黑色，ABS。",
      strategySummary: "使用安全关键词和保守卖点。",
      competitorSummary: "竞品信息不直接进入最终文案。",
      complianceSummary: "避免未确认 claim。",
      beginnerExplanation: "资料少也可以生成基础版本。",
    },
  };

  return { ...base, ...overrides };
}

global.fetch = async (url, init) => {
  assert.equal(url, "https://api.deepseek.com/chat/completions");
  lastRequestBody = JSON.parse(init.body);

  assert.equal(lastRequestBody.model, "deepseek-chat");
  assert.equal(lastRequestBody.max_tokens, 2200);
  assert.equal(lastRequestBody.temperature, 0.4);
  assert.equal(lastRequestBody.response_format.type, "json_object");
  assert.match(lastRequestBody.messages[0].content, /Return one JSON object only/);
  assert.match(lastRequestBody.messages[0].content, /Do not add extra top-level keys/);
  assert.match(lastRequestBody.messages[1].content, /行李箱/);
  assert.match(lastRequestBody.messages[1].content, /Travel & Luggage/);
  assert.match(lastRequestBody.messages[1].content, /黑色/);
  assert.match(lastRequestBody.messages[1].content, /ABS/);
  assert.match(lastRequestBody.messages[1].content, /Do not return schemaVersion/);
  assert.match(lastRequestBody.messages[1].content, /must first translate the adjacent English copy into Chinese/);
  assert.match(lastRequestBody.messages[1].content, /Use English for all non-finalListing explanatory string fields/);

  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify(createValidResult()),
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const lowInfoGeneration = await aiListingModule.generateAmazonListing({
  projectId: "project-low-info",
  userId: "user-1",
  projectData: {
    id: "project-low-info",
    user_id: "user-1",
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    form_data: {
      color: "黑色",
      material: "ABS",
    },
  },
});

assert.equal(lowInfoGeneration.ok, true);
assert.equal(lowInfoGeneration.source, "deepseek");
assert.equal(lowInfoGeneration.promptVersion, "workup-listing-v1");
assert.equal(calls.buildProductBrief, 1);
assert.equal(calls.analyzeCompetitorInput, 1);
assert.equal(calls.buildListingStrategy, 1);
assert.equal(calls.buildListingPrompt, 1);
assert.equal(lowInfoGeneration.inputSnapshot.productBrief.product.nameCn, "行李箱");
assert.equal(lowInfoGeneration.inputSnapshot.productBrief.product.category, "Travel & Luggage");
assert.equal(lowInfoGeneration.inputSnapshot.productBrief.product.marketplace, "US");
assert.equal(lowInfoGeneration.inputSnapshot.projectSnapshot.formData.color, "黑色");
assert.equal(lowInfoGeneration.inputSnapshot.projectSnapshot.formData.material, "ABS");
assert.ok(lowInfoGeneration.inputSnapshot.competitorInsights);
assert.ok(lowInfoGeneration.inputSnapshot.listingStrategy);
assert.equal(typeof lowInfoGeneration.result.qualityScore.overall, "number");
assert.equal(typeof lowInfoGeneration.result.qualityScore.level, "string");
assert.equal(lowInfoGeneration.result.productBrief.product.nameCn, "行李箱");
assert.equal(lowInfoGeneration.result.competitorInsights, lastPromptContext.competitorInsights);
assert.equal(lowInfoGeneration.result.listingStrategy, lastPromptContext.listingStrategy);
assert.ok(lastRequestBody.messages[1].content.includes("productBrief"));
assertCompleteListingResult(lowInfoGeneration.result);

console.log(JSON.stringify(lowInfoGeneration.result, null, 2));

const fencedJson = `\`\`\`json\n${JSON.stringify(createValidResult())}\n\`\`\``;
assert.equal(aiListingModule.parseDeepSeekJsonResponse(fencedJson).source, "deepseek");
assert.throws(
  () => aiListingModule.parseDeepSeekJsonResponse("这里不是 JSON，只是一段普通文本。"),
  /非 JSON/,
);

global.fetch = async () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: "plain text, not json" } }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

await assert.rejects(
  () =>
    aiListingModule.generateAmazonListing({
      projectId: "project-non-json",
      userId: "user-1",
      projectData: {
        product_name_cn: "行李箱",
        marketplace: "US",
        category: "Travel & Luggage",
        form_data: { color: "黑色", material: "ABS" },
      },
    }),
  /非 JSON/,
);

let malformedJsonAttempts = 0;
global.fetch = async () => {
  malformedJsonAttempts += 1;

  if (malformedJsonAttempts === 1) {
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"finalListing":{"bulletPoints":["missing comma" "bad"]}' } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(createValidResult()) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const retriedMalformedJsonGeneration = await aiListingModule.generateAmazonListing({
  projectId: "project-malformed-json-retry",
  userId: "user-1",
  projectData: {
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    form_data: { color: "黑色", material: "ABS" },
  },
});

assert.equal(malformedJsonAttempts, 2);
assert.equal(retriedMalformedJsonGeneration.ok, true);
assert.equal(retriedMalformedJsonGeneration.source, "deepseek");
assertCompleteListingResult(retriedMalformedJsonGeneration.result);

let blockedClaimRetryAttempts = 0;
global.fetch = async () => {
  blockedClaimRetryAttempts += 1;
  const result = createValidResult();

  if (blockedClaimRetryAttempts === 1) {
    result.finalListing.description.english =
      "This suitcase copy mentions TSA lock even though that feature is not confirmed.";
  }

  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const retriedBlockedClaimGeneration = await aiListingModule.generateAmazonListing({
  projectId: "project-blocked-claim-retry",
  userId: "user-1",
  projectData: {
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    form_data: { color: "黑色", material: "ABS" },
  },
});

assert.equal(blockedClaimRetryAttempts, 2);
assert.equal(retriedBlockedClaimGeneration.ok, true);
assert.equal(retriedBlockedClaimGeneration.source, "deepseek");
assertCompleteListingResult(retriedBlockedClaimGeneration.result);

global.fetch = async () => {
  const mockSourceResult = createValidResult({ source: "mock" });

  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(mockSourceResult) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const normalizedSourceGeneration = await aiListingModule.generateAmazonListing({
  projectId: "project-source-mock",
  userId: "user-1",
  projectData: {
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    form_data: { color: "黑色", material: "ABS" },
  },
});

assert.equal(normalizedSourceGeneration.ok, true);
assert.equal(normalizedSourceGeneration.source, "deepseek");
assert.equal(normalizedSourceGeneration.result.source, "deepseek");
assertCompleteListingResult(normalizedSourceGeneration.result);

global.fetch = async () => {
  const malformedResult = {
    finalListing: {
      title: { english: "Black ABS Suitcase", chineseExplanation: "基础标题。" },
      bulletPoints: [
        {
          english: "ABS material is confirmed by the provided input.",
          chineseExplanation: "基于已确认材质。",
          sourceBasis: "confirmed_fact",
          evidenceFields: ["material"],
        },
      ],
      description: {
        english: "A conservative suitcase listing based on confirmed input.",
        chineseExplanation: "描述基于已确认资料。",
      },
      searchTerms: {
        english: "black suitcase abs luggage",
        chineseExplanation: "关键词保持安全。",
      },
    },
    missingInfo: [{}, { field: "dimensions" }],
    assumptions: [{}, { assumption: "General travel use is inferred from category." }],
    complianceNotes: [{}],
    improvementSuggestions: [{}],
    analysis: {},
  };

  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(malformedResult) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const malformedGeneration = await aiListingModule.generateAmazonListing({
  projectId: "project-malformed-fields",
  userId: "user-1",
  projectData: {
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    form_data: { color: "黑色", material: "ABS" },
  },
});

assert.equal(malformedGeneration.ok, true);
assertCompleteListingResult(malformedGeneration.result);

global.fetch = async () => {
  const blockedClaimResult = clone(createValidResult());
  blockedClaimResult.finalListing.title.english =
    "Black ABS Suitcase with TSA Lock for Travel";

  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(blockedClaimResult) } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

await assert.rejects(
  () =>
    aiListingModule.generateAmazonListing({
      projectId: "project-blocked-claim",
      userId: "user-1",
      projectData: {
        product_name_cn: "行李箱",
        marketplace: "US",
        category: "Travel & Luggage",
        form_data: {
          color: "黑色",
          material: "ABS",
          competitor_title: "Carry On Luggage with TSA Lock",
        },
      },
    }),
  /TSA lock/,
);

envValues.set("DEEPSEEK_API_KEY", "");
global.fetch = async () => {
  throw new Error("fetch should not be called without a usable key");
};

await assert.rejects(
  () =>
    aiListingModule.generateAmazonListing({
      projectId: "project-no-key",
      userId: "user-1",
      projectData: {
        product_name_cn: "行李箱",
        marketplace: "US",
        category: "Travel & Luggage",
        form_data: { color: "黑色", material: "ABS" },
      },
    }),
  /fallback mock/,
);

assert.ok(!sourceMap.get("../lib/ai-listing.ts").includes("mock-generation-result"));
assert.ok(!sourceMap.get("../lib/ai-listing.ts").includes("normalizeGenerationResult"));

envValues.set(
  "DEEPSEEK_API_KEY",
  shouldRunLiveDeepSeekTest ? liveDeepSeekKey : "sk-deepseek-test-valid-format-key",
);
global.fetch = nativeFetch;

if (shouldRunLiveDeepSeekTest) {
  const liveStart = Date.now();
  const liveGeneration = await aiListingModule.generateAmazonListing({
    projectId: "project-live-timing",
    userId: "user-1",
    projectData: {
      product_name_cn: "行李箱",
      marketplace: "US",
      category: "Travel & Luggage",
      form_data: {
        color: "黑色",
        material: "ABS",
      },
    },
  });
  const liveElapsedMs = Date.now() - liveStart;

  assert.equal(liveGeneration.ok, true);
  assert.equal(liveGeneration.source, "deepseek");
  assert.equal(liveGeneration.result.source, "deepseek");
  assertCompleteListingResult(liveGeneration.result);

  console.log(`DeepSeek live elapsedMs=${liveElapsedMs}`);
  console.log(JSON.stringify(liveGeneration.result, null, 2));
  console.log(JSON.stringify({ source: liveGeneration.source, elapsedMs: liveElapsedMs, model: liveGeneration.model }, null, 2));
} else {
  console.log("DeepSeek live elapsedMs=skipped");
}

console.log("DeepSeek Work UP generation tests passed");
