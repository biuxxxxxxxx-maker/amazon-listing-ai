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

const formData = new FormData();
formData.set("product_name_cn", "便携式折叠收纳篮");
formData.set("product_name_en", "Collapsible Storage Basket");
formData.set("marketplace", "US");
formData.set("category", "Home & Kitchen");
formData.set("target_price", "$19.99");
formData.set("target_user", "小户型家庭、宿舍用户、车主");
formData.set("material", "PP + TPR");
formData.set("dimensions", "待补充");
formData.set("color", "米白色、灰色");
formData.set("package_contents", "1 个折叠收纳篮");
formData.set("usage_scenarios", "洗衣房、衣柜、汽车后备箱");
formData.set("core_features", "可折叠收纳，双侧提手");
formData.set("supplier_description", "适合家庭多场景使用。");
formData.set("notes", "不建议承载过重物品。");
formData.set("competitor_title", "Collapsible Laundry Basket with Handles");
formData.set("competitor_url", "https://www.amazon.com/example");
formData.set("competitor_selling_points", "Foldable, easy carry");
formData.set("review_pain_points", "Hard to keep upright");
formData.set("differentiation", "折叠后更薄");
formData.set("english_style", "localized");
formData.set("language", "English");
formData.set("needs_chinese_explanation", "on");
formData.set("needs_image_suggestions", "on");

const payload = mod.buildProjectDraftPayload(formData, "user-123");

assert.equal(payload.user_id, "user-123");
assert.equal(payload.product_name_cn, "便携式折叠收纳篮");
assert.equal(payload.product_name_en, "Collapsible Storage Basket");
assert.equal(payload.marketplace, "US");
assert.equal(payload.status, "Draft");
assert.equal(payload.form_data.material, "PP + TPR");
assert.equal(payload.form_data.needs_chinese_explanation, true);
assert.equal(payload.form_data.needs_image_suggestions, true);

assert.throws(
  () => mod.buildProjectDraftPayload(new FormData(), "user-123"),
  /产品中文名称/,
);

console.log("project draft payload tests passed");
