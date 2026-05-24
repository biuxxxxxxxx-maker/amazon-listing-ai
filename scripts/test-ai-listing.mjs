import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/ai-listing.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const exports = {};
const cjsModule = { exports };
const envValues = new Map();
const require = (specifier) => {
  if (specifier.includes("amazon-listing-user-prompt")) {
    return {
      amazonListingUserPromptTemplate: "Project data:\n{{PROJECT_JSON}}",
    };
  }

  if (specifier.includes("amazon-listing-system-prompt")) {
    return { amazonListingSystemPrompt: "system" };
  }

  if (specifier.includes("mock-generation-result")) {
    return {
      mockGenerationResult: {
        source: "mock",
        product: { nameCn: "Mock 产品" },
        description: { english: "Mock description", chinese: "Mock 描述" },
      },
      normalizeGenerationResult: (value, context = {}) => ({
        source: "deepseek",
        product: { nameCn: context.product_name_cn || context.productName || "Mock 产品" },
        title:
          typeof value.title === "string"
            ? { english: value.title, chinese: value.title_cn }
            : value.title,
        bullets: Array.isArray(value.bullet_points)
          ? value.bullet_points.map((item) => ({
              english: item.en,
              chinese: item.cn,
            }))
          : [],
        description: value.description?.en
          ? { english: value.description.en, chinese: value.description.cn }
          : { english: "Mock description", chinese: "Mock 描述" },
        searchTerms: {
          english: Array.isArray(value.search_terms) ? value.search_terms.join(" ") : "",
          chinese: "",
        },
        copyReadyListing:
          typeof value.title === "string" ? value.title : value.copyReadyListing || "",
      }),
    };
  }

  if (specifier.includes("cloudflare-env")) {
    return { readServerEnv: async (name) => envValues.get(name) || "" };
  }

  throw new Error(`Unexpected require: ${specifier}`);
};

new Function("exports", "module", "require", output.outputText)(exports, cjsModule, require);

const prompt = cjsModule.exports.buildListingUserPrompt({
  product_name_cn: "真实项目产品",
  form_data: {
    material: "PP + TPR",
    differentiation: "折叠后更薄",
  },
});

assert.ok(prompt.includes("真实项目产品"));
assert.ok(prompt.includes("PP + TPR"));
assert.ok(prompt.includes("折叠后更薄"));

envValues.set("DEEPSEEK_API_KEY", "your-deepseek-api-key");
let fetchWasCalled = false;
global.fetch = async () => {
  fetchWasCalled = true;
  throw new Error("Invalid key should not call DeepSeek");
};

const invalidKeyResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "无效 DeepSeek key 测试产品" },
});

assert.equal(invalidKeyResult.source, "mock");
assert.equal(invalidKeyResult.model, "mock-local");
assert.equal(fetchWasCalled, false);
assert.match(invalidKeyResult.fallbackReason, /API key|mock/);
assert.match(invalidKeyResult.fallbackReason, /演示模式/);

envValues.set("DEEPSEEK_API_KEY", "sk-deepseek-test-valid-format-key");
envValues.set("AI_PROVIDER", "deepseek");
envValues.set("DEEPSEEK_MODEL", "deepseek-chat");
global.fetch = async (url, init) => {
  assert.equal(url, "https://api.deepseek.com/chat/completions");
  const body = JSON.parse(init.body);

  assert.equal(body.model, "deepseek-chat");
  assert.equal(body.response_format.type, "json_object");
  assert.equal(body.messages[0].role, "system");
  assert.equal(body.messages[1].role, "user");
  assert.match(body.messages[0].content, /bullet_points/);
  assert.match(body.messages[0].content, /keyword_suggestions/);
  assert.match(body.messages[0].content, /image_suggestions/);
  assert.match(body.messages[1].content, /DeepSeek 成功测试产品/);

  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "DeepSeek Test Product",
              title_cn: "DeepSeek 测试产品",
              bullet_points: [
                { en: "Benefit one for Amazon shoppers.", cn: "卖点一说明。" },
                { en: "Benefit two for Amazon shoppers.", cn: "卖点二说明。" },
                { en: "Benefit three for Amazon shoppers.", cn: "卖点三说明。" },
                { en: "Benefit four for Amazon shoppers.", cn: "卖点四说明。" },
                { en: "Benefit five for Amazon shoppers.", cn: "卖点五说明。" },
              ],
              description: { en: "Description", cn: "描述" },
              search_terms: ["keyword", "storage basket"],
              keyword_suggestions: [{ keyword: "storage basket", reason_cn: "符合收纳场景。" }],
              image_suggestions: [{ scene: "Show the basket in a laundry room.", cn: "展示洗衣房使用场景。" }],
            }),
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const deepSeekResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "DeepSeek 成功测试产品" },
});

assert.equal(deepSeekResult.source, "deepseek");
assert.equal(deepSeekResult.model, "deepseek-chat");
assert.equal(deepSeekResult.result.product.nameCn, "DeepSeek 成功测试产品");
assert.equal(deepSeekResult.result.title.english, "DeepSeek Test Product");
assert.equal(deepSeekResult.result.title.chinese, "DeepSeek 测试产品");
assert.equal(deepSeekResult.result.bullets[0].english, "Benefit one for Amazon shoppers.");
assert.match(deepSeekResult.result.searchTerms.english, /storage basket/);
assert.match(deepSeekResult.result.copyReadyListing, /DeepSeek Test Product/);

global.fetch = async () =>
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content:
              "```json\n{\"title\":\"Code Fence Product\",\"title_cn\":\"代码块产品\",\"bullet_points\":[{\"en\":\"Bullet\",\"cn\":\"要点\"}],\"description\":{\"en\":\"Description\",\"cn\":\"描述\"},\"search_terms\":[\"keyword\"],\"keyword_suggestions\":[],\"image_suggestions\":[]}\n```",
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const fencedJsonResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "代码块 JSON 产品" },
});

assert.equal(fencedJsonResult.source, "deepseek");
assert.equal(fencedJsonResult.result.product.nameCn, "代码块 JSON 产品");
assert.ok(fencedJsonResult.result.description.english);

global.fetch = async () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: "这里不是 JSON，只是一段普通文本。" } }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

const textFallbackResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "普通文本回退测试产品" },
});

assert.equal(textFallbackResult.source, "mock");
assert.match(textFallbackResult.fallbackReason, /JSON|mock/);

global.fetch = async () =>
  new Response(
    JSON.stringify({
      error: {
        message: "Insufficient balance.",
      },
    }),
    { status: 429, headers: { "content-type": "application/json" } },
  );

const quotaFallbackResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "无 API 额度测试产品" },
});

assert.equal(quotaFallbackResult.source, "mock");
assert.equal(quotaFallbackResult.model, "mock-local");
assert.match(quotaFallbackResult.fallbackReason, /余额|额度|mock/);

envValues.set("DEEPSEEK_API_KEY", "sk-deepseek-test-valid-format-key");
global.fetch = async () => {
  throw new Error("network reconnect");
};

const fallbackResult = await cjsModule.exports.generateAmazonListing({
  projectId: "demo",
  projectData: { product_name_cn: "网络失败测试产品" },
});

assert.equal(fallbackResult.source, "mock");
assert.equal(fallbackResult.model, "mock-local");
assert.match(fallbackResult.fallbackReason, /连接失败|超时/);

console.log("DeepSeek listing prompt tests passed");
