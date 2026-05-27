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
assert.match(buildListingSystemPrompt(), /Return one JSON object only/);
assert.match(
  buildListingUserPrompt(lowInfoProductBrief, emptyCompetitorInsights, lowInfoStrategy),
  /Use this input JSON as the only business source/,
);
assert.match(lowInfoPromptText, /Return one JSON object only/);
assert.match(lowInfoPromptText, /Do not add extra top-level keys/);
assert.match(lowInfoPromptText, /Do not output productBrief, competitorInsights, or listingStrategy/);
assert.match(lowInfoPromptText, /exactly 5 bulletPoints/);
assert.match(lowInfoPromptText, /Do not return schemaVersion, source, generatedAt, model, qualityScore, productBrief, competitorInsights, or listingStrategy/);
assert.match(lowInfoPromptText, /sourceBasis must be one of/);
assert.match(lowInfoPromptText, /Do not invent unsupported claims/);
assert.match(lowInfoPromptText, /Search terms must stay clean/);
assert.doesNotMatch(lowInfoPromptText, /Required GenerationResult shape/);
assert.doesNotMatch(lowInfoPromptText, /Work UP context JSON/);
assert.doesNotMatch(lowInfoPromptText, /productBrief, competitorInsights, and listingStrategy must be JSON objects/);

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
assert.match(competitorPromptText, /Do not add extra top-level keys/);

console.log("Listing Prompt tests passed");
