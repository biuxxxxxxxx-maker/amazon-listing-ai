import type { CompetitorInsights, ListingStrategy, ProductBrief } from "@/lib/workup-schema";

export const WORKUP_LISTING_PROMPT_VERSION = "workup-listing-v1" as const;

export type ListingPrompt = {
  systemPrompt: string;
  userPrompt: string;
  promptVersion: typeof WORKUP_LISTING_PROMPT_VERSION;
};

export function buildListingSystemPrompt() {
  return [
    "You write Work UP Amazon listings.",
    "Return one JSON object only. No markdown, no code fences, no notes, no analysis outside JSON.",
    'Use English in every "english" field and Chinese only in every "chineseExplanation" field.',
    'Do not add extra top-level keys.',
    'Do not output productBrief, competitorInsights, or listingStrategy; the server injects those fields.',
  ].join(" ");
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
    "Use this input JSON as the only business source:",
    JSON.stringify(context),
    "",
    "Return only these top-level fields in the model response: finalListing, complianceNotes, missingInfo, assumptions, improvementSuggestions, analysis.",
    "Do not return schemaVersion, source, generatedAt, model, qualityScore, productBrief, competitorInsights, or listingStrategy; the server will fill them.",
    "Use English for all non-finalListing explanatory string fields so the result page can show English original text with a Chinese translation.",
    "finalListing must contain title, exactly 5 bulletPoints, description, and searchTerms.",
    'Each finalListing field must include "english" and "chineseExplanation".',
    'For finalListing only, every "chineseExplanation" must first translate the adjacent English copy into Chinese; do not merely explain why the copy was written.',
    'Each bulletPoint must also include "sourceBasis" and "evidenceFields".',
    'sourceBasis must be one of "confirmed_fact", "safe_inference", or "competitor_inspired".',
    "Keep every english field English only.",
    "Use confirmed facts and safe strategy only. Do not invent unsupported claims such as TSA lock, airline approved, waterproof, exact size, warranty, certification, scratch-proof, unbreakable, medical grade, FDA approved, best seller, guaranteed, or lifetime warranty.",
    "Search terms must stay clean and avoid brand terms or blocked claims.",
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
