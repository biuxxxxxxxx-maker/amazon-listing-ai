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
let hasAIProviderKey = false;
let generateCallCount = 0;
let lastGenerateInput = null;

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
      hasAIProviderKeyAsync: async () => hasAIProviderKey,
      generateAmazonListing: async (input) => {
        generateCallCount += 1;
        lastGenerateInput = input;
        return {
          source: hasAIProviderKey ? "deepseek" : "mock",
          model: hasAIProviderKey ? "deepseek-chat" : "mock-local",
          result: { source: hasAIProviderKey ? "deepseek" : "mock" },
        };
      },
    };
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
        throw new Error("Supabase should not be called without an AI provider key.");
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
      projectData: { product_name_cn: "快速 mock 测试产品" },
    }),
  }),
);

const body = await response.json();

assert.equal(response.status, 200);
assert.equal(body.source, "mock");
assert.equal(checkedSupabaseEnv, false);
assert.equal(generateCallCount, 1);

checkedSupabaseEnv = false;
hasAIProviderKey = true;
const directResponse = await cjsModule.exports.POST(
  new Request("http://localhost/api/generate-listing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      projectData: { product_name_cn: "直接生成测试产品" },
    }),
  }),
);
const directBody = await directResponse.json();

assert.equal(directResponse.status, 200);
assert.equal(directBody.source, "deepseek");
assert.equal(directBody.model, "deepseek-chat");
assert.equal(checkedSupabaseEnv, false);
assert.equal(generateCallCount, 2);

const flatPayloadResponse = await cjsModule.exports.POST(
  new Request("http://localhost/api/generate-listing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      productName: "便携式折叠收纳篮",
      productInfo: "材质：PP + TPR，可折叠，带双侧提手。",
      targetAudience: "小户型家庭、宿舍用户、车主",
      keywords: "collapsible storage basket, foldable organizer bin",
      languageMode: "bilingual",
    }),
  }),
);
const flatPayloadBody = await flatPayloadResponse.json();

assert.equal(flatPayloadResponse.status, 200);
assert.equal(flatPayloadBody.source, "deepseek");
assert.equal(lastGenerateInput.projectData.productName, "便携式折叠收纳篮");
assert.equal(lastGenerateInput.projectData.languageMode, "bilingual");
assert.equal(lastGenerateInput.projectData.keywords, "collapsible storage basket, foldable organizer bin");
assert.equal(generateCallCount, 3);

console.log("generate listing route tests passed");
