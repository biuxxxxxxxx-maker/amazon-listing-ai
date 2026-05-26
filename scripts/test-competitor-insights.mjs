import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/competitor-insights.ts", import.meta.url), "utf8");
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
  analyzeCompetitorInput,
  buildBlockedFromFinalListing,
  detectRiskyCompetitorClaims,
  extractBuyerPainPoints,
  extractCompetitorAngles,
  extractKeywordPatterns,
  normalizeCompetitorInput,
} = cjsModule.exports;

const empty = analyzeCompetitorInput({});

assert.deepEqual(empty.input, {
  titles: [],
  urls: [],
  bulletPoints: [],
  reviewPainPoints: [],
  differentiationNotes: [],
});
assert.deepEqual(empty.keywordPatterns, []);
assert.deepEqual(empty.buyerPainPoints, []);
assert.deepEqual(empty.competitorAngles, []);
assert.deepEqual(empty.riskyClaims, []);
assert.deepEqual(empty.blockedFromFinalListing, []);

const luggageTitles = [
  "Carry On Luggage with Spinner Wheels, Hard Shell Suitcase for Travel",
  "Lightweight Hardside Luggage with TSA Lock and Expandable Design",
  "ABS Travel Suitcase with 360° Spinner Wheels",
].join("\n");
const luggageInsights = analyzeCompetitorInput({
  competitorTitle: luggageTitles,
});
const luggageKeywords = luggageInsights.keywordPatterns.map((item) => item.toLowerCase());
const luggageAngles = luggageInsights.competitorAngles.map((item) => item.toLowerCase());
const luggageRiskClaims = luggageInsights.riskyClaims.map((item) => item.claim);
const luggageBlocked = new Map(
  luggageInsights.blockedFromFinalListing.map((item) => [item.claim, item.reason]),
);

assert.ok(luggageKeywords.includes("luggage"));
assert.ok(luggageKeywords.includes("suitcase"));
assert.ok(luggageKeywords.includes("spinner wheels"));
assert.ok(luggageKeywords.includes("tsa lock"));
assert.ok(luggageKeywords.includes("expandable"));
assert.ok(
  luggageKeywords.includes("hardside luggage") ||
    luggageKeywords.includes("hardside suitcase") ||
    luggageKeywords.includes("hard shell suitcase"),
);
assert.ok(luggageAngles.includes("lightweight travel"));
assert.ok(luggageAngles.includes("smooth mobility"));
assert.ok(luggageAngles.includes("expandable packing"));
assert.ok(luggageRiskClaims.includes("TSA lock"));
assert.equal(luggageBlocked.get("TSA lock"), "competitor_claim_unconfirmed");
assert.equal(luggageBlocked.get("spinner wheels"), "competitor_claim_unconfirmed");
assert.equal(luggageBlocked.get("expandable"), "competitor_claim_unconfirmed");
assert.ok(
  luggageInsights.opportunities.some((item) =>
    item.opportunity.includes("spinner wheels"),
  ),
);
assert.ok(
  luggageInsights.opportunities.some((item) =>
    item.requiredConfirmation?.includes("TSA-approved lock"),
  ),
);

const reviewPainPoints = extractBuyerPainPoints({
  reviewPainPoints: [
    "The zipper feels tight when fully packed.",
    "Wheels became noisy after a few trips.",
    "Handle feels weak.",
  ],
});
const reviewPainText = reviewPainPoints.join(" | ");

assert.match(reviewPainText, /zipper issue/);
assert.match(reviewPainText, /wheel noise/);
assert.match(reviewPainText, /handle durability/);

const brandInsights = analyzeCompetitorInput({
  competitorTitle: "Samsonite Carry On Luggage with Spinner Wheels",
});
const brandKeywords = brandInsights.keywordPatterns.map((item) => item.toLowerCase());
const brandBlocked = new Map(
  brandInsights.blockedFromFinalListing.map((item) => [item.claim, item.reason]),
);

assert.ok(!brandKeywords.includes("samsonite"));
assert.equal(brandBlocked.get("Samsonite"), "brand_term");

const chinesePainPoints = extractBuyerPainPoints({
  reviewPainPoints: "买家说拉杆容易晃，轮子声音大，装满后拉链不好拉。",
});

assert.ok(chinesePainPoints.length > 0);
assert.ok(chinesePainPoints.some((item) => item.includes("拉杆") || item.includes("wheel noise")));
assert.ok(chinesePainPoints.some((item) => item.includes("拉链") || item.includes("zipper issue")));

const normalized = normalizeCompetitorInput({
  competitor_title: "Title A\n\nTitle A\nTitle B",
  competitor_url: "https://www.amazon.com/example\nhttps://www.amazon.com/example",
  competitor_selling_points: ["Point A\nPoint B", "Point A"],
  review_pain_points: "Pain A\n\nPain B",
  differentiation: ["Different A", "Different A\nDifferent B"],
});

assert.deepEqual(normalized.titles, ["Title A", "Title B"]);
assert.deepEqual(normalized.urls, ["https://www.amazon.com/example"]);
assert.deepEqual(normalized.bulletPoints, ["Point A", "Point B"]);
assert.deepEqual(normalized.reviewPainPoints, ["Pain A", "Pain B"]);
assert.deepEqual(normalized.differentiationNotes, ["Different A", "Different B"]);

const riskyClaims = detectRiskyCompetitorClaims({
  competitorSellingPoints:
    "waterproof scratch resistant unbreakable lifetime warranty guaranteed best seller",
});
const riskyClaimNames = riskyClaims.map((item) => item.claim);

assert.ok(riskyClaimNames.includes("waterproof"));
assert.ok(riskyClaimNames.includes("scratch resistant"));
assert.ok(riskyClaimNames.includes("unbreakable"));
assert.ok(riskyClaimNames.includes("lifetime warranty"));
assert.ok(riskyClaimNames.includes("guaranteed"));
assert.ok(riskyClaimNames.includes("best seller"));

const blocks = buildBlockedFromFinalListing({
  competitorTitle: "Expandable suitcase with TSA Lock and spinner wheels",
});
const blockMap = new Map(blocks.map((item) => [item.claim, item.reason]));

assert.equal(blockMap.get("TSA lock"), "competitor_claim_unconfirmed");
assert.equal(blockMap.get("spinner wheels"), "competitor_claim_unconfirmed");
assert.equal(blockMap.get("expandable"), "competitor_claim_unconfirmed");

assert.ok(extractKeywordPatterns({ competitorTitle: "Foldable storage organizer" }).includes("foldable"));
assert.ok(extractCompetitorAngles({ competitorTitle: "Business travel carry-on" }).includes("business travel"));

console.log("Competitor Insights tests passed");
