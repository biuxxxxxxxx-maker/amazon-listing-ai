import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/project-draft.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputText).toString("base64")}`
);

function makeFormData(entries) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }

  return formData;
}

const lowInfoPayload = mod.buildProjectDraftPayload(
  makeFormData({
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
  }),
  "user-123",
);

assert.equal(lowInfoPayload.user_id, "user-123");
assert.equal(lowInfoPayload.product_name_cn, "行李箱");
assert.equal(lowInfoPayload.product_name_en, null);
assert.equal(lowInfoPayload.marketplace, "US");
assert.equal(lowInfoPayload.category, "Travel & Luggage");
assert.equal(lowInfoPayload.target_customer, null);
assert.equal(lowInfoPayload.status, "Draft");
assert.equal(lowInfoPayload.form_data.product_name_cn, "行李箱");
assert.equal(lowInfoPayload.form_data.marketplace, "US");
assert.equal(lowInfoPayload.form_data.category, "Travel & Luggage");
assert.equal(lowInfoPayload.form_data.color, null);
assert.equal(lowInfoPayload.form_data.material, null);
assert.doesNotMatch(JSON.stringify(lowInfoPayload), /便携式折叠收纳篮|Collapsible Storage Basket|Home & Kitchen|\$19\.99/);

const richPayload = mod.buildProjectDraftPayload(
  makeFormData({
    product_name_cn: "行李箱",
    product_name_en: "Carry On Suitcase",
    marketplace: "US",
    category: "Travel & Luggage",
    color: "黑色",
    material: "ABS",
    dimensions: "55 x 35 x 22 cm",
    size: "20 inch",
    weight: "6.2 lb",
    capacity: "38 L",
    package_quantity: "1 pack",
    target_customer: "差旅人群",
    use_cases: "商务出差、周末旅行",
    core_features: "轻便箱体、内部收纳分区",
    supplier_description: "供应商描述：ABS 箱体，适合短途旅行。",
    prohibited_claims: "不要写 waterproof 或 airline approved。",
    competitor_title: "Carry On Luggage with Spinner Wheels",
    competitor_url: "https://www.amazon.com/example",
    competitor_selling_points: "TSA Lock and expandable design",
    review_pain_points: "zipper issue",
    differentiation: "黑色 ABS 箱体，适合基础旅行需求",
    needs_chinese_explanation: "on",
  }),
  "user-456",
);

assert.equal(richPayload.product_name_en, "Carry On Suitcase");
assert.equal(richPayload.target_customer, "差旅人群");
assert.equal(richPayload.form_data.color, "黑色");
assert.equal(richPayload.form_data.material, "ABS");
assert.equal(richPayload.form_data.dimensions, "55 x 35 x 22 cm");
assert.equal(richPayload.form_data.size, "20 inch");
assert.equal(richPayload.form_data.weight, "6.2 lb");
assert.equal(richPayload.form_data.capacity, "38 L");
assert.equal(richPayload.form_data.package_quantity, "1 pack");
assert.equal(richPayload.form_data.package_contents, "1 pack");
assert.equal(richPayload.form_data.target_customer, "差旅人群");
assert.equal(richPayload.form_data.target_user, "差旅人群");
assert.equal(richPayload.form_data.use_cases, "商务出差、周末旅行");
assert.equal(richPayload.form_data.usage_scenarios, "商务出差、周末旅行");
assert.equal(richPayload.form_data.core_features, "轻便箱体、内部收纳分区");
assert.equal(richPayload.form_data.supplier_description, "供应商描述：ABS 箱体，适合短途旅行。");
assert.equal(richPayload.form_data.prohibited_claims, "不要写 waterproof 或 airline approved。");
assert.equal(richPayload.form_data.competitor_title, "Carry On Luggage with Spinner Wheels");
assert.equal(richPayload.form_data.competitor_url, "https://www.amazon.com/example");
assert.equal(richPayload.form_data.competitor_selling_points, "TSA Lock and expandable design");
assert.equal(richPayload.form_data.review_pain_points, "zipper issue");
assert.equal(richPayload.form_data.differentiation, "黑色 ABS 箱体，适合基础旅行需求");
assert.equal(richPayload.form_data.needs_chinese_explanation, true);
assert.equal(richPayload.form_data.needs_image_suggestions, false);
assert.equal(richPayload.form_data.productBrief, undefined);
assert.equal(richPayload.form_data.listingStrategy, undefined);
assert.equal(richPayload.form_data.generationResult, undefined);

assert.throws(
  () =>
    mod.buildProjectDraftPayload(
      makeFormData({ marketplace: "US", category: "Travel & Luggage" }),
      "user-123",
    ),
  /产品中文名称/,
);

assert.throws(
  () =>
    mod.buildProjectDraftPayload(
      makeFormData({ product_name_cn: "行李箱", category: "Travel & Luggage" }),
      "user-123",
    ),
  /Amazon 站点/,
);

assert.throws(
  () =>
    mod.buildProjectDraftPayload(
      makeFormData({ product_name_cn: "行李箱", marketplace: "US" }),
      "user-123",
    ),
  /产品类目/,
);

const optionalEmptyPayload = mod.buildProjectDraftPayload(
  makeFormData({
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
    color: "",
    material: "",
    competitor_title: "",
  }),
  "user-123",
);

assert.equal(optionalEmptyPayload.form_data.color, null);
assert.equal(optionalEmptyPayload.form_data.material, null);
assert.equal(optionalEmptyPayload.form_data.competitor_title, null);
assert.doesNotThrow(() =>
  mod.buildProjectDraftPayload(
    makeFormData({
      product_name_cn: "行李箱",
      marketplace: "US",
      category: "Travel & Luggage",
    }),
    "user-123",
  ),
);

console.log("project draft payload tests passed");
