import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/final-listing-copy.ts", import.meta.url), "utf8");
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
  copyBulletPoints,
  copyDescription,
  copyFullListing,
  copySearchTerms,
  copyTitle,
} = cjsModule.exports;

const result = {
  schemaVersion: "workup.v1",
  source: "deepseek",
  generatedAt: "2026-05-26T00:00:00.000Z",
  model: "deepseek-chat",
  qualityScore: {
    overall: 82,
    level: "good",
    dimensions: {
      inputCompleteness: 60,
      keywordRelevance: 80,
      complianceSafety: 90,
      amazonReadiness: 82,
      copyClarity: 86,
    },
    summary: "中文资料质量解释，不应进入 copy。",
  },
  productBrief: {},
  competitorInsights: {},
  listingStrategy: {
    primaryKeyword: "hard shell suitcase",
    secondaryKeywords: ["strategy keyword"],
  },
  finalListing: {
    title: {
      english: "Black ABS Hard Shell Suitcase for Practical Travel",
      chineseExplanation: "中文标题解释，不应复制。",
    },
    bulletPoints: [
      {
        english: "ABS shell uses confirmed material for practical travel.",
        chineseExplanation: "中文 bullet 1。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["material"],
      },
      {
        english: "Black finish creates a clean look for everyday trips.",
        chineseExplanation: "中文 bullet 2。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["color"],
      },
      {
        english: "Travel-focused wording avoids unsupported size claims.",
        chineseExplanation: "中文 bullet 3。",
        sourceBasis: "safe_inference",
        evidenceFields: ["category"],
      },
      {
        english: "Practical copy keeps buyer expectations clear.",
        chineseExplanation: "中文 bullet 4。",
        sourceBasis: "safe_inference",
        evidenceFields: ["safeClaims"],
      },
      {
        english: "Compliance-safe language avoids unverified promises.",
        chineseExplanation: "中文 bullet 5。",
        sourceBasis: "safe_inference",
        evidenceFields: ["avoidClaims"],
      },
    ],
    description: {
      english: "A practical black ABS suitcase listing based on confirmed Work UP facts.",
      chineseExplanation: "中文描述解释，不应复制。",
    },
    searchTerms: {
      english: "black suitcase abs luggage hard shell travel suitcase",
      chineseExplanation: "中文关键词解释，不应复制。",
    },
  },
  missingInfo: [
    {
      field: "size",
      whyItMatters: "Missing Info should not enter copy.",
      example: "20 inch",
      impactArea: "title",
    },
  ],
  assumptions: [],
  complianceNotes: [],
  improvementSuggestions: [],
  analysis: {
    productSummary: "Analysis should not enter copy.",
    strategySummary: "Strategy should not enter copy.",
    competitorSummary: "",
    complianceSummary: "",
    beginnerExplanation: "",
  },
};

const fullListing = copyFullListing(result);
const bulletCopy = copyBulletPoints(result);

assert.equal(copyTitle(result), result.finalListing.title.english);
assert.equal(copyDescription(result), result.finalListing.description.english);
assert.equal(copySearchTerms(result), result.finalListing.searchTerms.english);
assert.match(fullListing, /Title:/);
assert.match(fullListing, /Black ABS Hard Shell Suitcase/);
assert.match(fullListing, /Bullet Points:/);
assert.match(fullListing, /1\. ABS shell/);
assert.match(fullListing, /5\. Compliance-safe/);
assert.match(fullListing, /Description:/);
assert.match(fullListing, /Search Terms:/);
assert.match(fullListing, /black suitcase abs luggage/);
assert.equal(bulletCopy.split("\n").length, 5);
assert.ok(bulletCopy.split("\n").every((line) => /^[\x00-\x7F]+$/.test(line)));

for (const forbidden of [
  "中文",
  "Missing Info",
  "Strategy should not enter copy",
  "Analysis should not enter copy",
  "qualityScore",
  "listingStrategy",
  "missingInfo",
  "assumptions",
  "complianceNotes",
  "competitorInsights",
]) {
  assert.ok(!fullListing.includes(forbidden), `${forbidden} should not be copied`);
  assert.ok(!bulletCopy.includes(forbidden), `${forbidden} should not be copied`);
}

console.log("Final Listing copy tests passed");
