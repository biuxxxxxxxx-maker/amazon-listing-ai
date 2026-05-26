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
          result: {
            schemaVersion: "workup.v1",
            source: "deepseek",
            model: "deepseek-chat",
            finalListing: {
              title: { english: "Black ABS Suitcase", chineseExplanation: "标题解释" },
              bulletPoints: [],
              description: { english: "Description", chineseExplanation: "描述" },
              searchTerms: { english: "black suitcase", chineseExplanation: "关键词解释" },
            },
          },
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
      getServerSupabaseAsync: async () => {
        throw new Error("Supabase should not be called for demo requests.");
      },
      readRequestAccessToken: () => "",
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
