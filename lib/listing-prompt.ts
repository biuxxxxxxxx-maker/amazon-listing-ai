import type { CompetitorInsights, ListingStrategy, ProductBrief } from "@/lib/workup-schema";

export const WORKUP_LISTING_PROMPT_VERSION = "workup-listing-v1" as const;

export type ListingPrompt = {
  systemPrompt: string;
  userPrompt: string;
  promptVersion: typeof WORKUP_LISTING_PROMPT_VERSION;
};

export function buildListingSystemPrompt() {
  return [
    "You are an Amazon Listing strategist and conversion-focused copywriter for Work UP.",
    "You are not a generic AI writing tool.",
    "You must generate an Amazon Listing from real product facts, competitor insights, keyword strategy, and compliance boundaries.",
    "",
    "Output contract:",
    "- Return strict JSON only.",
    "- Do not use markdown.",
    "- Do not output explanations outside JSON.",
    '- schemaVersion must be "workup.v1".',
    '- source must be "deepseek".',
    "- The JSON must be a complete GenerationResult object.",
    "- finalListing must contain title, exactly 5 bulletPoints, description, and searchTerms.",
    "- Every finalListing field must contain english and chineseExplanation.",
    '- Each bulletPoint must contain english, chineseExplanation, sourceBasis, and evidenceFields.',
    '- sourceBasis must be one of "confirmed_fact", "safe_inference", or "competitor_inspired".',
    "",
    "Truth and compliance rules:",
    "- productBrief.confirmedFacts are the most important factual source.",
    "- listingStrategy.safeClaims may enter finalListing.",
    "- listingStrategy.avoidClaims must not enter finalListing.",
    "- competitor claims cannot be copied directly into finalListing.",
    "- unconfirmed competitor features must become missingInfo or opportunities.",
    "- competitorInsights may only be used for keyword inspiration, market pattern, buyer pain points, and opportunity discovery.",
    "- Do not invent unconfirmed exact size, capacity, weight, warranty, certification, TSA lock, airline approved, waterproof, scratch-proof, unbreakable, medical grade, FDA approved, best seller, guaranteed, or lifetime warranty.",
    "- If information is thin, still generate a basic conservative Listing with non-empty fields.",
    "- Search Terms must not simply repeat the title and must not contain brand terms or competitor trademark terms.",
    "- Copy fields are English only. Do not mix Chinese into english fields.",
    "- chineseExplanation is for teaching and understanding only; it must never be mixed into english fields.",
  ].join("\n");
}

export function buildListingUserPrompt(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
  listingStrategy: ListingStrategy,
) {
  const context = {
    productBrief,
    competitorInsights,
    listingStrategy,
  };

  return [
    "Use the following Work UP context JSON as the only business source.",
    "Do not reinvent ProductBrief, do not change confirmed facts, and do not treat competitor claims as facts about this product.",
    "",
    "Required GenerationResult shape:",
    "{",
    '  "schemaVersion": "workup.v1",',
    '  "source": "deepseek",',
    '  "generatedAt": "ISO-8601 string",',
    '  "model": "DeepSeek model name",',
    '  "qualityScore": { "overall": 0-100, "level": "basic|good|strong", "dimensions": {}, "summary": "Chinese summary" },',
    '  "productBrief": "repeat the provided productBrief without changing confirmed facts",',
    '  "competitorInsights": "repeat the provided competitorInsights",',
    '  "listingStrategy": "repeat the provided listingStrategy",',
    '  "finalListing": {',
    '    "title": { "english": "...", "chineseExplanation": "..." },',
    '    "bulletPoints": [',
    '      { "english": "...", "chineseExplanation": "...", "sourceBasis": "confirmed_fact|safe_inference|competitor_inspired", "evidenceFields": ["..."] }',
    "    ],",
    '    "description": { "english": "...", "chineseExplanation": "..." },',
    '    "searchTerms": { "english": "...", "chineseExplanation": "..." }',
    "  },",
    '  "complianceNotes": [],',
    '  "missingInfo": [],',
    '  "assumptions": [],',
    '  "improvementSuggestions": [],',
    '  "analysis": {',
    '    "productSummary": "...",',
    '    "strategySummary": "...",',
    '    "competitorSummary": "...",',
    '    "complianceSummary": "...",',
    '    "beginnerExplanation": "..."',
    "  }",
    "}",
    "",
    "Hard output rules:",
    "- finalListing.bulletPoints must contain exactly 5 bulletPoints.",
    "- finalListing.title.english, every bulletPoint.english, description.english, and searchTerms.english must be English only.",
    "- Do not invent TSA lock, airline approved, waterproof, exact size, capacity, weight, warranty, certification, scratch-proof, unbreakable, medical grade, FDA approved, best seller, guaranteed, or lifetime warranty.",
    "- Any claim in listingStrategy.avoidClaims must not enter finalListing.",
    "- competitor claims cannot be copied directly into finalListing.",
    "- unconfirmed competitor features must become missingInfo or opportunities.",
    "- If a competitor idea is useful but unconfirmed, mention it only in missingInfo, assumptions, improvementSuggestions, complianceNotes, or competitorInsights.opportunities.",
    "- Search Terms must not include brand terms, competitor trademarks, or blocked claims.",
    "",
    "Work UP context JSON:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

export function buildListingPrompt(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
  listingStrategy: ListingStrategy,
): ListingPrompt {
  return {
    systemPrompt: buildListingSystemPrompt(),
    userPrompt: buildListingUserPrompt(productBrief, competitorInsights, listingStrategy),
    promptVersion: WORKUP_LISTING_PROMPT_VERSION,
  };
}
