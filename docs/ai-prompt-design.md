# Work UP DeepSeek Prompt Design

This document reflects the current Work UP generation contract. The older phase-one prompt draft has been replaced by the ProductBrief → CompetitorInsights → ListingStrategy → ListingPrompt → DeepSeek → GenerationResultValidation flow.

## Prompt Inputs

The prompt builder should receive structured Work UP context, not raw UI labels:

1. `ProductBrief`
   - confirmedFacts
   - missingInfo
   - prohibitedClaims
   - rawInputCompleteness
2. `CompetitorInsights`
   - keywordPatterns
   - buyerPainPoints
   - competitorAngles
   - opportunities
   - riskyClaims
   - blockedFromFinalListing
3. `ListingStrategy`
   - primaryKeyword
   - secondaryKeywords
   - positioning
   - sellingPointOrder
   - avoidClaims
   - safeClaims

The model should not reinvent ProductBrief or change confirmed facts.

## System Prompt Requirements

- Act as an Amazon Listing strategist and conversion-focused copywriter.
- Work only for Amazon Listing generation.
- Produce strict JSON only, with no markdown and no explanation outside JSON.
- Use `schemaVersion: "workup.v1"`.
- Use `source: "deepseek"`.
- Return a complete Work UP `GenerationResult`.
- Keep final English Listing fields separate from Chinese explanations.
- Generate a basic conservative Listing even when user input is low information.
- Do not invent exact size, capacity, weight, warranty, certifications, approvals, or unsupported performance claims.
- Do not use `listingStrategy.avoidClaims` in `finalListing`.
- Use `listingStrategy.safeClaims` and `productBrief.confirmedFacts` as the main copy basis.
- Use competitor insights only for keyword inspiration, market pattern recognition, buyer pain points, and opportunity discovery.
- Competitor claims cannot be copied directly into `finalListing`.
- Unconfirmed competitor features must become missingInfo, assumptions, improvementSuggestions, complianceNotes, or opportunities.
- Search Terms must avoid competitor brands, trademark terms, blocked claims, and simple title repetition.
- Copy-ready English fields must not contain Chinese text.

## Required Output Shape

DeepSeek must return:

- `schemaVersion`
- `source`
- `generatedAt`
- `model`
- `qualityScore`
- `productBrief`
- `competitorInsights`
- `listingStrategy`
- `finalListing`
- `complianceNotes`
- `missingInfo`
- `assumptions`
- `improvementSuggestions`
- `analysis`

`finalListing` must include:

- `title`
- exactly 5 `bulletPoints`
- `description`
- `searchTerms`

Each final Listing language field must include:

- `english`
- `chineseExplanation`

Each bullet point must also include:

- `sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired"`
- `evidenceFields: string[]`

## Validation Boundary

The DeepSeek response is not considered successful until `validateGenerationResult` passes.

Validation rejects:

- non-object output
- non-JSON output
- `source` other than `"deepseek"`
- `model: "mock-local"`
- missing or malformed `qualityScore`
- missing title, description, search terms, or non-5 bullet arrays
- missing English or Chinese explanation fields
- blocked claims from ProductBrief, CompetitorInsights, or ListingStrategy
- competitor brand terms in Search Terms
- large Chinese text blocks inside English copy fields
- old mock result shapes

## Mock Boundary

- `mockGenerationResult` is only for the landing-page preview.
- The landing preview can show static mock content, but it must not call `/api/generate-listing`.
- Real project pages, real generation pages, real result pages, and `/api/generate-listing` cannot use `mockGenerationResult`.
- Production cannot fallback to mock when DeepSeek key is missing, balance is insufficient, the network fails, JSON parsing fails, or validation fails.
- `ENABLE_GENERATION_MOCK=true` is only a non-production development placeholder and must not save mock output to real `generation_results`.
- Saved generation results must be `source: "deepseek"`, must not be `model: "mock-local"`, and must match the Work UP `GenerationResult` schema.

## Result Page and Copy Contract

The result page should show Final Amazon Listing first, then quality, strategy, missing info, assumptions, compliance notes, competitor insights, and expert analysis.

Copy helpers must read only `finalListing.*.english`:

- Copy Title copies only `finalListing.title.english`.
- Copy Bullet Points copies exactly 5 English bullet points, one per line.
- Copy Description copies only `finalListing.description.english`.
- Copy Search Terms copies only `finalListing.searchTerms.english`.
- Copy Full Listing includes only Title, Bullet Points, Description, and Search Terms.

Copy output must not include Chinese explanations, qualityScore, listingStrategy, missingInfo, assumptions, complianceNotes, competitorInsights, or analysis.
