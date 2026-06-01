import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../app/api/generate-listing/route.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const exports = {};
const cjsModule = { exports };
let checkedSupabaseEnv = false;
let buildContextCallCount = 0;
let deepSeekCallCount = 0;
let lastContextInput = null;
let lastDeepSeekInput = null;
let shouldThrowGenerationError = false;
let getServerSupabaseCallCount = 0;
let getUserCallCount = 0;
let projectReadCallCount = 0;

const productBrief = {
  schemaVersion: "workup.v1",
  product: {
    nameCn: "行李箱",
    nameEn: "",
    marketplace: "US",
    category: "Travel & Luggage",
    targetPrice: "",
    targetCustomer: "",
  },
  confirmedFacts: [
    { field: "productNameCn", value: "行李箱", source: "user_input", confidence: "high" },
    { field: "marketplace", value: "US", source: "user_input", confidence: "high" },
    { field: "category", value: "Travel & Luggage", source: "user_input", confidence: "high" },
    { field: "color", value: "黑色", source: "user_input", confidence: "high" },
    { field: "material", value: "ABS", source: "user_input", confidence: "high" },
  ],
  missingInfo: [],
  prohibitedClaims: [],
  rawInputCompleteness: {
    requiredFieldsProvided: 3,
    requiredFieldsTotal: 3,
    optionalFieldsProvided: 2,
  },
};
const competitorInsights = {
  input: {
    titles: [],
    urls: [],
    bulletPoints: [],
    reviewPainPoints: [],
    differentiationNotes: [],
  },
  keywordPatterns: [],
  buyerPainPoints: [],
  competitorAngles: [],
  opportunities: [],
  riskyClaims: [],
  blockedFromFinalListing: [],
  notes: {
    competitorClaimsPolicy: "competitor claims cannot be copied directly into finalListing",
    unconfirmedFeaturesPolicy: "unconfirmed competitor features must become missingInfo or opportunities",
  },
};
const listingStrategy = {
  primaryKeyword: "hard shell suitcase",
  secondaryKeywords: ["black suitcase", "ABS luggage", "travel suitcase"],
  positioning: {
    direction: "Conservative luggage positioning.",
    targetBuyer: "Amazon shoppers",
    useCases: ["travel use"],
    tone: "professional",
  },
  sellingPointOrder: [1, 2, 3, 4, 5].map((rank) => ({
    rank,
    sellingPoint: `Point ${rank}`,
    reason: "Stable order.",
    evidenceFields: ["confirmedFacts"],
  })),
  avoidClaims: [{ claim: "TSA lock", reason: "Unconfirmed." }],
  safeClaims: [{ claim: "ABS shell", evidence: "material confirmed by user input" }],
};
const inputSnapshot = {
  schemaVersion: "workup.v1",
  projectId: "demo",
  userId: "",
  projectSnapshot: {
    productNameCn: "行李箱",
    productNameEn: "",
    marketplace: "US",
    category: "Travel & Luggage",
    targetPrice: "",
    targetCustomer: "",
    formData: {
      color: "黑色",
      material: "ABS",
    },
  },
  productBrief,
  competitorInsights,
  listingStrategy,
  prompt: {
    version: "workup-listing-v1",
    systemPromptId: "workup-listing-system-prompt",
    userPromptId: "workup-listing-user-prompt",
  },
  model: {
    provider: "deepseek",
    name: "deepseek-chat",
  },
  createdAt: "2026-05-26T00:00:00.000Z",
};

function createCompleteGenerationResult() {
  return {
    schemaVersion: "workup.v1",
    source: "deepseek",
    generatedAt: "2026-05-26T00:00:00.000Z",
    model: "deepseek-chat",
    qualityScore: {
      overall: 76,
      level: "good",
      dimensions: {
        inputCompleteness: 68,
        keywordRelevance: 78,
        complianceSafety: 90,
        amazonReadiness: 76,
        copyClarity: 80,
      },
      summary: "资料足够生成保守、兼容的 Amazon Listing。",
    },
    productBrief,
    competitorInsights,
    listingStrategy,
    finalListing: {
      title: { english: "Black ABS Suitcase for Practical Travel Use", chineseExplanation: "标题解释" },
      bulletPoints: [1, 2, 3, 4, 5].map((rank) => ({
        english: `Conservative suitcase bullet ${rank} based on confirmed product input.`,
        chineseExplanation: `第 ${rank} 条五点解释。`,
        sourceBasis: rank === 1 ? "confirmed_fact" : "safe_inference",
        evidenceFields: ["confirmedFacts"],
      })),
      description: { english: "Description", chineseExplanation: "描述" },
      searchTerms: { english: "black suitcase abs luggage", chineseExplanation: "关键词解释" },
    },
    complianceNotes: [
      {
        riskLevel: "medium",
        claim: "TSA lock",
        reason: "This claim is unconfirmed.",
        recommendation: "Verify before using it.",
      },
    ],
    missingInfo: [
      {
        field: "dimensions",
        whyItMatters: "Dimensions affect title, bullets, and buyer fit decisions.",
        example: "20 x 14 x 9 inches",
        impactArea: "title",
      },
    ],
    assumptions: [
      {
        assumption: "The product is for general travel use.",
        reason: "The category is Travel & Luggage.",
        confidence: "medium",
        shouldVerifyWithUser: true,
      },
    ],
    improvementSuggestions: [
      {
        priority: "high",
        suggestion: "Add dimensions, weight, capacity, and brand.",
        reason: "These fields improve specificity and compliance boundaries.",
        expectedImpact: "bulletPoints",
      },
      {
        priority: "high",
        suggestion: "Confirm all lock, wheel, certification, or warranty claims.",
        reason: "Unverified claims should not enter final copy.",
        expectedImpact: "compliance",
      },
      {
        priority: "medium",
        suggestion: "Add real use cases and buyer profile details.",
        reason: "This makes the listing more conversion focused.",
        expectedImpact: "conversion",
      },
    ],
    analysis: {
      productSummary: "行李箱，黑色，ABS。",
      strategySummary: "使用保守关键词和已确认事实。",
      competitorSummary: "竞品只用于策略参考。",
      complianceSummary: "避免未确认 claim。",
      beginnerExplanation: "资料越完整，结果越接近真实运营表达。",
    },
  };
}

function assertRouteResultShape(result) {
  assert.equal(result.source, "deepseek");
  assert.equal(typeof result.qualityScore.summary, "string");
  assert.equal(result.finalListing.bulletPoints.length, 5);
  assert.ok(Array.isArray(result.missingInfo));
  assert.ok(Array.isArray(result.assumptions));
  assert.ok(Array.isArray(result.complianceNotes));
  assert.ok(Array.isArray(result.improvementSuggestions));
  assert.doesNotMatch(JSON.stringify(result), /\b(undefined|null|nan)\b/i);
}

const require = (specifier) => {
  if (specifier === "next/server") {
    return {
      NextResponse: {
        json: (body, init = {}) =>
          new Response(JSON.stringify(body), {
            status: init.status || 200,
            headers: { "content-type": "application/json" },
          }),
      },
    };
  }

  if (specifier.includes("ai-listing")) {
    return {
      buildProductBriefInputFromProject: (projectData) => ({
        productNameCn: projectData?.product_name_cn || projectData?.productName || "",
        marketplace: projectData?.marketplace || "US",
        category: projectData?.category || "",
        formData: projectData?.form_data || projectData || {},
      }),
      buildWorkUpGenerationContext: (input) => {
        buildContextCallCount += 1;
        lastContextInput = input;

        return {
          productBrief,
          competitorInsights,
          listingStrategy,
          inputSnapshot: {
            ...inputSnapshot,
            projectId: input.projectId || "demo",
            userId: input.userId || "",
          },
          prompt: {
            systemPrompt: "system",
            userPrompt: "user",
            promptVersion: "workup-listing-v1",
          },
        };
      },
      generateListingWithDeepSeek: async (input) => {
        deepSeekCallCount += 1;
        lastDeepSeekInput = input;

        if (shouldThrowGenerationError) {
          throw new Error("DeepSeek returned non JSON");
        }

        return {
          ok: true,
          source: "deepseek",
          model: "deepseek-chat",
          result: createCompleteGenerationResult(),
          inputSnapshot: input.inputSnapshot,
          promptVersion: "workup-listing-v1",
        };
      },
      isGenerationMockEnabled: async () => false,
      readAIProvider: async () => "deepseek",
    };
  }

  if (specifier.includes("cloudflare-env")) {
    return { readServerEnv: async (name) => (name === "DEEPSEEK_MODEL" ? "deepseek-chat" : "") };
  }

  if (specifier.includes("generation-auth")) {
    return {
      shouldUseSupabaseGenerationAuth: ({ projectId, supabaseReady }) =>
        supabaseReady && Boolean(projectId) && projectId !== "demo",
    };
  }

  if (specifier.includes("supabase-server")) {
    return {
      hasSupabaseServerEnvAsync: async () => {
        checkedSupabaseEnv = true;
        return true;
      },
      getServerSupabaseAsync: async (accessToken) => {
        getServerSupabaseCallCount += 1;
        assert.equal(accessToken, "header-token");

        return {
          auth: {
            getUser: async (token) => {
              getUserCallCount += 1;
              assert.equal(token, "header-token");

              return {
                data: { user: { id: "user-1" } },
                error: null,
              };
            },
          },
          from: (table) => {
            assert.equal(table, "product_projects");

            return {
              select: () => ({
                eq: (field, value) => {
                  assert.equal(field, "id");
                  assert.equal(value, "real-project");

                  return {
                    maybeSingle: async () => {
                      projectReadCallCount += 1;

                      return {
                        data: {
                          id: "real-project",
                          user_id: "user-1",
                          product_name_cn: "行李箱",
                          marketplace: "US",
                          category: "Travel & Luggage",
                          form_data: {
                            color: "黑色",
                            material: "ABS",
                          },
                        },
                        error: null,
                      };
                    },
                  };
                },
              }),
            };
          },
        };
      },
      readRequestAccessToken: (request) => {
        const authorization = request.headers.get("authorization") || "";
        return authorization.toLowerCase().startsWith("bearer ")
          ? authorization.slice("bearer ".length).trim()
          : "";
      },
      readRequestRefreshToken: (request) =>
        request.headers.get("cookie")?.includes("work_up_refresh_token=")
          ? "refresh-token"
          : "",
    };
  }

  throw new Error(`Unexpected require: ${specifier}`);
};

new Function("exports", "module", "require", output.outputText)(exports, cjsModule, require);

const response = await cjsModule.exports.POST(
  new Request("http://localhost/api/generate-listing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      projectId: "demo",
      projectData: {
        product_name_cn: "行李箱",
        marketplace: "US",
        category: "Travel & Luggage",
        form_data: {
          color: "黑色",
          material: "ABS",
        },
      },
    }),
  }),
);
const body = await response.json();

assert.equal(response.status, 200);
assert.equal(body.ok, true);
assert.equal(body.source, "deepseek");
assert.equal(body.result.source, "deepseek");
assertRouteResultShape(body.result);
assert.equal(body.inputSnapshot.productBrief.product.nameCn, "行李箱");
assert.equal(body.inputSnapshot.productBrief.product.category, "Travel & Luggage");
assert.equal(body.inputSnapshot.projectSnapshot.formData.color, "黑色");
assert.equal(body.inputSnapshot.projectSnapshot.formData.material, "ABS");
assert.equal(body.inputSnapshot.prompt.version, "workup-listing-v1");
assert.equal(checkedSupabaseEnv, false);
assert.equal(buildContextCallCount, 1);
assert.equal(deepSeekCallCount, 1);
assert.equal(lastContextInput.projectData.product_name_cn, "行李箱");
assert.equal(lastDeepSeekInput.productBrief.product.nameCn, "行李箱");
assert.equal(lastDeepSeekInput.competitorInsights, competitorInsights);
assert.equal(lastDeepSeekInput.listingStrategy, listingStrategy);
assert.equal(lastDeepSeekInput.prompt.promptVersion, "workup-listing-v1");

const authedResponse = await cjsModule.exports.POST(
  new Request("http://localhost/api/generate-listing", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer header-token",
      cookie: "work_up_refresh_token=refresh-token",
    },
    body: JSON.stringify({
      projectId: "real-project",
      projectData: {},
    }),
  }),
);
const authedBody = await authedResponse.json();

assert.equal(authedResponse.status, 200);
assert.equal(authedBody.ok, true);
assert.equal(authedBody.source, "deepseek");
assertRouteResultShape(authedBody.result);
assert.equal(getServerSupabaseCallCount, 1);
assert.equal(getUserCallCount, 1);
assert.equal(projectReadCallCount, 1);
assert.equal(lastContextInput.projectId, "real-project");
assert.equal(lastContextInput.userId, "user-1");
assert.equal(lastContextInput.projectData.id, "real-project");

shouldThrowGenerationError = true;
const errorResponse = await cjsModule.exports.POST(
  new Request("http://localhost/api/generate-listing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      projectId: "demo",
      projectData: {
        product_name_cn: "行李箱",
        marketplace: "US",
        category: "Travel & Luggage",
        form_data: {
          color: "黑色",
          material: "ABS",
        },
      },
    }),
  }),
);
const errorBody = await errorResponse.json();

assert.equal(errorResponse.status, 500);
assert.equal(errorBody.ok, false);
assert.match(errorBody.error, /non JSON/);

assert.ok(!source.includes("mockGenerationResult"));
assert.ok(!source.includes("normalizeGenerationResult"));

console.log("generate listing route Work UP tests passed");
