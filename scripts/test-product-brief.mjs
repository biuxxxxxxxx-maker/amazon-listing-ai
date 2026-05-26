import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/product-brief.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});

const exports = {};
const cjsModule = { exports };

new Function("exports", "module", output.outputText)(exports, cjsModule);

const {
  buildProductBrief,
  detectMissingInfo,
  detectProhibitedClaims,
  extractConfirmedFacts,
} = cjsModule.exports;

const lowInfoLuggageInput = {
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    color: "黑色",
    material: "ABS",
  },
};

const lowInfoBrief = buildProductBrief(lowInfoLuggageInput);
const lowInfoFactMap = new Map(
  lowInfoBrief.confirmedFacts.map((fact) => [fact.field, fact.value]),
);
const lowInfoMissingFields = lowInfoBrief.missingInfo.map((item) => item.field);

assert.equal(lowInfoBrief.schemaVersion, "workup.v1");
assert.equal(lowInfoBrief.product.nameCn, "行李箱");
assert.equal(lowInfoBrief.product.nameEn, "");
assert.equal(lowInfoBrief.product.marketplace, "US");
assert.equal(lowInfoBrief.product.category, "Travel & Luggage");
assert.equal(lowInfoFactMap.get("productNameCn"), "行李箱");
assert.equal(lowInfoFactMap.get("marketplace"), "US");
assert.equal(lowInfoFactMap.get("category"), "Travel & Luggage");
assert.equal(lowInfoFactMap.get("color"), "黑色");
assert.equal(lowInfoFactMap.get("material"), "ABS");
assert.ok(lowInfoMissingFields.includes("size"));
assert.ok(lowInfoMissingFields.includes("wheelType"));
assert.ok(lowInfoMissingFields.includes("lockType"));
assert.ok(lowInfoMissingFields.includes("capacity"));
assert.equal(lowInfoBrief.prohibitedClaims.length, 0);
assert.equal(lowInfoBrief.rawInputCompleteness.requiredFieldsProvided, 3);
assert.equal(lowInfoBrief.rawInputCompleteness.requiredFieldsTotal, 3);
assert.equal(lowInfoBrief.rawInputCompleteness.optionalFieldsProvided, 2);

assert.throws(
  () =>
    buildProductBrief({
      productNameCn: "",
      marketplace: "US",
      category: "Travel & Luggage",
      formData: {},
    }),
  /productNameCn/,
);
assert.throws(
  () =>
    buildProductBrief({
      productNameCn: "行李箱",
      marketplace: "",
      category: "Travel & Luggage",
      formData: {},
    }),
  /marketplace/,
);
assert.throws(
  () =>
    buildProductBrief({
      productNameCn: "行李箱",
      marketplace: "US",
      category: "",
      formData: {},
    }),
  /category/,
);

const riskInput = {
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    coreFeatures: "waterproof, TSA lock, airline approved, unbreakable",
  },
};
const riskBrief = buildProductBrief(riskInput);
const riskClaims = riskBrief.prohibitedClaims.map((item) => item.claim);
const riskFactMap = new Map(riskBrief.confirmedFacts.map((fact) => [fact.field, fact.value]));

assert.equal(riskFactMap.get("coreFeatures"), "waterproof, TSA lock, airline approved, unbreakable");
assert.ok(riskClaims.includes("waterproof"));
assert.ok(riskClaims.includes("TSA lock"));
assert.ok(riskClaims.includes("airline approved"));
assert.ok(riskClaims.includes("unbreakable"));

const emptyFieldFacts = extractConfirmedFacts({
  productNameCn: "收纳盒",
  marketplace: "US",
  category: "Home & Kitchen",
  formData: {
    material: "",
    color: null,
    dimensions: undefined,
    supplier_description: "   ",
    core_features: "可堆叠",
  },
});
const emptyFieldFactFields = emptyFieldFacts.map((fact) => fact.field);

assert.ok(!emptyFieldFactFields.includes("material"));
assert.ok(!emptyFieldFactFields.includes("color"));
assert.ok(!emptyFieldFactFields.includes("dimensions"));
assert.ok(!emptyFieldFactFields.includes("supplierDescription"));
assert.ok(emptyFieldFactFields.includes("coreFeatures"));

const luggageMissing = detectMissingInfo(lowInfoLuggageInput).map((item) => item.field);
assert.ok(luggageMissing.includes("wheelType"));
assert.ok(luggageMissing.includes("lockType"));
assert.ok(luggageMissing.includes("carryOnConfirmation"));
assert.ok(luggageMissing.includes("warranty"));

const nonLuggageMissing = detectMissingInfo({
  productNameCn: "桌面收纳盒",
  marketplace: "US",
  category: "Home & Kitchen",
  formData: {
    material: "PP",
  },
}).map((item) => item.field);

assert.ok(nonLuggageMissing.includes("dimensions"));
assert.ok(nonLuggageMissing.includes("capacity"));
assert.ok(!nonLuggageMissing.includes("wheelType"));
assert.ok(!nonLuggageMissing.includes("lockType"));
assert.ok(!nonLuggageMissing.includes("carryOnConfirmation"));

const negatedClaimInput = {
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    notes: "不要写 waterproof，也不要承诺 lifetime warranty。",
  },
};
const negatedClaims = detectProhibitedClaims(negatedClaimInput).map((item) => item.claim);

assert.ok(negatedClaims.includes("waterproof"));
assert.ok(negatedClaims.includes("lifetime warranty"));

console.log("Product Brief tests passed");
