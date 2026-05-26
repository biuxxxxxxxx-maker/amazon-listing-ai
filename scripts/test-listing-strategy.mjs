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

const { buildProductBrief } = loadModule(productBriefSource);
const { analyzeCompetitorInput } = loadModule(competitorInsightsSource);
const {
  buildListingStrategy,
  buildAvoidClaims,
  buildSafeClaims,
  buildSellingPointOrder,
  choosePrimaryKeyword,
  chooseSecondaryKeywords,
} = loadModule(listingStrategySource);

function lowerList(values) {
  return values.map((value) => value.toLowerCase());
}

const lowInfoProductBrief = buildProductBrief({
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    color: "黑色",
    material: "ABS",
  },
});
const emptyCompetitorInsights = analyzeCompetitorInput({});
const lowInfoStrategy = buildListingStrategy(lowInfoProductBrief, emptyCompetitorInsights);
const lowInfoSecondary = lowerList(lowInfoStrategy.secondaryKeywords);
const lowInfoSafeClaims = lowerList(lowInfoStrategy.safeClaims.map((item) => item.claim));
const lowInfoAvoidClaims = lowerList(lowInfoStrategy.avoidClaims.map((item) => item.claim));
const serializedLowInfoStrategy = JSON.stringify(lowInfoStrategy);

assert.match(lowInfoStrategy.primaryKeyword.toLowerCase(), /suitcase|luggage/);
assert.ok(lowInfoSecondary.some((item) => item.includes("black")));
assert.ok(lowInfoSecondary.some((item) => item.includes("abs")));
assert.ok(lowInfoSecondary.some((item) => item.includes("travel")));
assert.ok(lowInfoSecondary.some((item) => item.includes("hard shell")));
assert.equal(lowInfoStrategy.sellingPointOrder.length, 5);
assert.ok(lowInfoSafeClaims.some((item) => item.includes("abs")));
assert.ok(lowInfoSafeClaims.some((item) => item.includes("black")));
assert.ok(lowInfoAvoidClaims.includes("tsa lock"));
assert.ok(lowInfoAvoidClaims.includes("airline approved"));
assert.ok(lowInfoAvoidClaims.includes("waterproof"));
assert.ok(!serializedLowInfoStrategy.includes("便携式折叠收纳篮"));
assert.ok(!serializedLowInfoStrategy.includes("Collapsible Storage Basket"));

const competitorInsights = analyzeCompetitorInput({
  competitorTitle: [
    "Carry On Luggage with Spinner Wheels, Hard Shell Suitcase for Travel",
    "Lightweight Hardside Luggage with TSA Lock and Expandable Design",
    "ABS Travel Suitcase with 360° Spinner Wheels",
  ],
});
const competitorStrategy = buildListingStrategy(lowInfoProductBrief, competitorInsights);
const competitorSecondary = lowerList(competitorStrategy.secondaryKeywords);
const competitorSafeClaims = lowerList(competitorStrategy.safeClaims.map((item) => item.claim));
const competitorAvoidClaims = lowerList(competitorStrategy.avoidClaims.map((item) => item.claim));
const sellingPointText = competitorStrategy.sellingPointOrder
  .map((item) => item.sellingPoint)
  .join(" | ")
  .toLowerCase();

assert.ok(competitorSecondary.some((item) => item.includes("suitcase")));
assert.ok(competitorSecondary.some((item) => item.includes("luggage")));
assert.ok(
  competitorSecondary.some((item) => item.includes("hard shell") || item.includes("hardside")),
);
assert.ok(!competitorSafeClaims.includes("tsa lock"));
assert.ok(!competitorSafeClaims.includes("spinner wheels"));
assert.ok(!competitorSafeClaims.includes("expandable"));
assert.ok(competitorAvoidClaims.includes("tsa lock"));
assert.ok(competitorAvoidClaims.includes("spinner wheels"));
assert.ok(competitorAvoidClaims.includes("expandable"));
assert.ok(sellingPointText.includes("general mobility"));
assert.ok(!sellingPointText.includes("spinner wheels"));

const riskyProductBrief = buildProductBrief({
  productNameCn: "行李箱",
  marketplace: "US",
  category: "Travel & Luggage",
  formData: {
    coreFeatures: "waterproof, unbreakable, airline approved",
  },
});
const riskyAvoidClaims = lowerList(
  buildAvoidClaims(riskyProductBrief, emptyCompetitorInsights).map((item) => item.claim),
);

assert.ok(riskyAvoidClaims.includes("waterproof"));
assert.ok(riskyAvoidClaims.includes("unbreakable"));
assert.ok(riskyAvoidClaims.includes("airline approved"));

const safeClaims = buildSafeClaims(lowInfoProductBrief, competitorInsights);
const safeClaimText = lowerList(safeClaims.map((item) => item.claim));

assert.ok(safeClaimText.includes("abs shell"));
assert.ok(safeClaimText.includes("black color"));
assert.ok(safeClaimText.includes("travel suitcase"));
assert.ok(!safeClaimText.includes("tsa lock"));
assert.ok(!safeClaimText.includes("spinner wheels"));
assert.ok(!safeClaimText.includes("expandable"));
assert.ok(safeClaims.every((item) => /confirmed by user input/.test(item.evidence)));

assert.equal(buildSellingPointOrder(lowInfoProductBrief, competitorInsights).length, 5);

const brandedCompetitorInsights = analyzeCompetitorInput({
  competitorTitle: "Samsonite Carry On Luggage with Spinner Wheels and TSA Lock",
});
const brandedSecondary = lowerList(
  chooseSecondaryKeywords(lowInfoProductBrief, brandedCompetitorInsights),
);
const brandedAvoidClaims = lowerList(
  buildListingStrategy(lowInfoProductBrief, brandedCompetitorInsights).avoidClaims.map(
    (item) => item.claim,
  ),
);

assert.ok(!brandedSecondary.some((item) => item.includes("samsonite")));
assert.ok(!brandedSecondary.some((item) => item.includes("tsa lock")));
assert.ok(!brandedSecondary.some((item) => item.includes("spinner wheels")));
assert.ok(brandedAvoidClaims.includes("samsonite"));

assert.match(
  choosePrimaryKeyword(lowInfoProductBrief, competitorInsights).toLowerCase(),
  /suitcase|luggage/,
);

console.log("Listing Strategy tests passed");
