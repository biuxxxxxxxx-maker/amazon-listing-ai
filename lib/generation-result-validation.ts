import type {
  CompetitorInsights,
  FinalListing,
  GenerationResult,
  ListingStrategy,
  ProductBrief,
} from "@/lib/workup-schema";

export type GenerationValidationContext = {
  productBrief: ProductBrief;
  competitorInsights: CompetitorInsights;
  listingStrategy: ListingStrategy;
  model: string;
};

const SOURCE_BASIS_VALUES = new Set([
  "confirmed_fact",
  "safe_inference",
  "competitor_inspired",
]);
const QUALITY_LEVELS = new Set(["basic", "good", "strong"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertRule(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`GenerationResult validation failed: ${message}`);
  }
}

function assertRecord(value: unknown, path: string): Record<string, unknown> {
  assertRule(isRecord(value), `${path} must be an object`);
  return value;
}

function assertNonEmptyString(value: unknown, path: string): string {
  assertRule(typeof value === "string" && value.trim().length > 0, `${path} must be non-empty`);
  return value.trim();
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasLargeChineseText(value: string) {
  const chineseChars = value.match(/[\u3400-\u9fff]/g)?.length ?? 0;

  if (chineseChars === 0) {
    return false;
  }

  return chineseChars >= 4 || chineseChars / Math.max(value.length, 1) > 0.15;
}

function containsClaim(haystack: string, claim: string) {
  const normalizedClaim = normalize(claim);

  if (!normalizedClaim) {
    return false;
  }

  if (/^[a-z0-9\s°-]+$/i.test(normalizedClaim)) {
    const pattern = escapeRegExp(normalizedClaim).replace(/\\\s+/g, "\\s+");
    return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`, "i").test(haystack);
  }

  return normalize(haystack).includes(normalizedClaim);
}

function finalListingEnglishValues(finalListing: FinalListing) {
  return [
    { path: "finalListing.title.english", value: finalListing.title.english },
    ...finalListing.bulletPoints.map((item, index) => ({
      path: `finalListing.bulletPoints[${index}].english`,
      value: item.english,
    })),
    { path: "finalListing.description.english", value: finalListing.description.english },
    { path: "finalListing.searchTerms.english", value: finalListing.searchTerms.english },
  ];
}

function blockedClaims(context: GenerationValidationContext) {
  return [
    ...context.productBrief.prohibitedClaims.map((item) => ({
      claim: item.claim,
      source: "productBrief.prohibitedClaims",
    })),
    ...context.listingStrategy.avoidClaims.map((item) => ({
      claim: item.claim,
      source: "listingStrategy.avoidClaims",
    })),
    ...context.competitorInsights.blockedFromFinalListing.map((item) => ({
      claim: item.claim,
      source: `competitorInsights.blockedFromFinalListing.${item.reason}`,
    })),
  ].filter((item) => item.claim.trim().length > 0);
}

export function validateFinalListing(finalListing: unknown): FinalListing {
  const listing = assertRecord(finalListing, "finalListing");
  const title = assertRecord(listing.title, "finalListing.title");
  const description = assertRecord(listing.description, "finalListing.description");
  const searchTerms = assertRecord(listing.searchTerms, "finalListing.searchTerms");
  const bulletPoints = listing.bulletPoints;

  assertNonEmptyString(title.english, "finalListing.title.english");
  assertNonEmptyString(title.chineseExplanation, "finalListing.title.chineseExplanation");
  assertRule(Array.isArray(bulletPoints), "finalListing.bulletPoints must be an array");
  assertRule(
    bulletPoints.length === 5,
    "finalListing.bulletPoints must contain exactly 5 items",
  );

  bulletPoints.forEach((item, index) => {
    const bullet = assertRecord(item, `finalListing.bulletPoints[${index}]`);

    assertNonEmptyString(bullet.english, `finalListing.bulletPoints[${index}].english`);
    assertNonEmptyString(
      bullet.chineseExplanation,
      `finalListing.bulletPoints[${index}].chineseExplanation`,
    );
    assertRule(
      typeof bullet.sourceBasis === "string" && SOURCE_BASIS_VALUES.has(bullet.sourceBasis),
      `finalListing.bulletPoints[${index}].sourceBasis is invalid`,
    );
    assertRule(
      Array.isArray(bullet.evidenceFields),
      `finalListing.bulletPoints[${index}].evidenceFields must be an array`,
    );
  });

  assertNonEmptyString(description.english, "finalListing.description.english");
  assertNonEmptyString(
    description.chineseExplanation,
    "finalListing.description.chineseExplanation",
  );
  assertNonEmptyString(searchTerms.english, "finalListing.searchTerms.english");
  assertNonEmptyString(
    searchTerms.chineseExplanation,
    "finalListing.searchTerms.chineseExplanation",
  );

  return listing as unknown as FinalListing;
}

export function validateEnglishFields(result: GenerationResult) {
  for (const item of finalListingEnglishValues(result.finalListing)) {
    assertRule(
      !hasLargeChineseText(item.value),
      `${item.path} must not contain large Chinese text`,
    );
  }
}

export function validateNoBlockedClaims(
  result: GenerationResult,
  context: GenerationValidationContext,
) {
  const englishValues = finalListingEnglishValues(result.finalListing);
  const claims = blockedClaims(context);

  for (const { path, value } of englishValues) {
    for (const item of claims) {
      assertRule(
        !containsClaim(value, item.claim),
        `${path} contains blocked claim "${item.claim}" from ${item.source}`,
      );
    }
  }

  const searchTerms = result.finalListing.searchTerms.english;

  for (const item of claims.filter((claim) => claim.source.includes("brand_term"))) {
    assertRule(
      !containsClaim(searchTerms, item.claim),
      `finalListing.searchTerms.english contains blocked brand term "${item.claim}"`,
    );
  }
}

export function isValidGenerationResultShape(rawResult: unknown): boolean {
  if (!isRecord(rawResult)) {
    return false;
  }

  if (rawResult.schemaVersion !== "workup.v1" || rawResult.source !== "deepseek") {
    return false;
  }

  if (!isRecord(rawResult.qualityScore) || !isRecord(rawResult.finalListing)) {
    return false;
  }

  return Array.isArray(rawResult.finalListing.bulletPoints);
}

export function validateGenerationResult(
  rawResult: unknown,
  context: GenerationValidationContext,
): GenerationResult {
  const result = assertRecord(rawResult, "result");

  assertRule(result.schemaVersion === "workup.v1", 'schemaVersion must be "workup.v1"');
  assertRule(result.source === "deepseek", 'source must be "deepseek"');

  const model = assertNonEmptyString(result.model, "model");
  assertRule(model !== "mock-local", 'model must not be "mock-local"');
  assertRule(
    context.model.trim().length > 0 && context.model !== "mock-local",
    "context.model must be a real DeepSeek model",
  );

  const qualityScore = assertRecord(result.qualityScore, "qualityScore");
  assertRule(
    typeof qualityScore.overall === "number" &&
      qualityScore.overall >= 0 &&
      qualityScore.overall <= 100,
    "qualityScore.overall must be a number from 0 to 100",
  );
  assertRule(
    typeof qualityScore.level === "string" && QUALITY_LEVELS.has(qualityScore.level),
    'qualityScore.level must be "basic", "good", or "strong"',
  );

  assertRecord(result.productBrief, "productBrief");
  assertRecord(result.competitorInsights, "competitorInsights");
  assertRecord(result.listingStrategy, "listingStrategy");
  assertRule(Array.isArray(result.complianceNotes), "complianceNotes must be an array");
  assertRule(Array.isArray(result.missingInfo), "missingInfo must be an array");
  assertRule(Array.isArray(result.assumptions), "assumptions must be an array");
  assertRule(
    Array.isArray(result.improvementSuggestions),
    "improvementSuggestions must be an array",
  );
  assertRecord(result.analysis, "analysis");

  validateFinalListing(result.finalListing);

  const typedResult = result as unknown as GenerationResult;

  validateEnglishFields(typedResult);
  validateNoBlockedClaims(typedResult, context);

  return typedResult;
}
