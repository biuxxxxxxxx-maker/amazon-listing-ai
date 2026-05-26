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
const listingPromptSource = await readFile(
  new URL("../lib/listing-prompt.ts", import.meta.url),
  "utf8",
);

const { buildProductBrief } = loadModule(productBriefSource);
const { analyzeCompetitorInput } = loadModule(competitorInsightsSource);
const { buildListingStrategy } = loadModule(listingStrategySource);
const {
  buildListingPrompt,
  buildListingSystemPrompt,
  buildListingUserPrompt,
} = loadModule(listingPromptSource);

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
const lowInfoPrompt = buildListingPrompt(
  lowInfoProductBrief,
  emptyCompetitorInsights,
  lowInfoStrategy,
);
const lowInfoPromptText = `${lowInfoPrompt.systemPrompt}\n${lowInfoPrompt.userPrompt}`;

assert.equal(lowInfoPrompt.promptVersion, "workup-listing-v1");
assert.match(buildListingSystemPrompt(), /strict JSON/);
assert.match(
  buildListingUserPrompt(lowInfoProductBrief, emptyCompetitorInsights, lowInfoStrategy),
  /Work UP context JSON/,
);
assert.match(lowInfoPromptText, /strict JSON/);
assert.match(lowInfoPromptText, /schemaVersion/);
assert.match(lowInfoPromptText, /source.*deepseek/i);
assert.match(lowInfoPromptText, /exactly 5 bulletPoints/);
assert.match(lowInfoPromptText, /title/);
assert.match(lowInfoPromptText, /description/);
assert.match(lowInfoPromptText, /searchTerms/);
assert.match(lowInfoPromptText, /confirmedFacts/);
assert.match(lowInfoPromptText, /missingInfo/);
assert.match(lowInfoPromptText, /avoidClaims/);
assert.match(lowInfoPromptText, /safeClaims/);
assert.match(lowInfoPromptText, /Do not invent.*TSA lock/i);
assert.match(lowInfoPromptText, /airline approved/);
assert.match(lowInfoPromptText, /waterproof/);
assert.match(lowInfoPromptText, /exact size/);

const competitorInsights = analyzeCompetitorInput({
  competitorTitle: [
    "Carry On Luggage with Spinner Wheels, Hard Shell Suitcase for Travel",
    "Lightweight Hardside Luggage with TSA Lock and Expandable Design",
    "ABS Travel Suitcase with 360° Spinner Wheels",
  ],
});
const competitorStrategy = buildListingStrategy(lowInfoProductBrief, competitorInsights);
const competitorPrompt = buildListingPrompt(
  lowInfoProductBrief,
  competitorInsights,
  competitorStrategy,
);
const competitorPromptText = `${competitorPrompt.systemPrompt}\n${competitorPrompt.userPrompt}`;

assert.match(
  competitorPromptText,
  /competitor claims cannot be copied directly into finalListing/,
);
assert.match(
  competitorPromptText,
  /unconfirmed competitor features must become missingInfo or opportunities/,
);
assert.match(competitorPromptText, /avoidClaims must not enter finalListing/);

console.log("Listing Prompt tests passed");
