import type { CompetitorInsights, ListingStrategy, ProductBrief } from "@/lib/workup-schema";

const HIGH_RISK_CLAIMS = [
  "waterproof",
  "scratch-proof",
  "scratch resistant",
  "unbreakable",
  "TSA lock",
  "airline approved",
  "lifetime warranty",
  "guaranteed",
  "best seller",
  "medical grade",
  "FDA approved",
  "antibacterial",
  "heavy-duty",
] as const;

const KNOWN_BRANDS = [
  "samsonite",
  "travelpro",
  "american tourister",
  "delsey",
  "tumi",
  "rimowa",
  "away",
  "monos",
  "amazon basics",
  "amazonbasics",
  "kenneth cole",
  "briggs & riley",
] as const;

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function lower(value: string) {
  return normalize(value).toLowerCase();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalize(value);
    const key = lower(normalized);

    if (!normalized || seen.has(key)) {
      continue;
    }

    result.push(normalized);
    seen.add(key);
  }

  return result;
}

function productText(productBrief: ProductBrief) {
  return [
    productBrief.product.nameCn,
    productBrief.product.nameEn,
    productBrief.product.category,
    ...productBrief.confirmedFacts.map((fact) => fact.value),
  ]
    .filter(Boolean)
    .join(" ");
}

function isLuggageProduct(productBrief: ProductBrief) {
  return /行李箱|拉杆箱|登机箱|suitcase|luggage|travel/i.test(productText(productBrief));
}

function getFact(productBrief: ProductBrief, field: string) {
  return productBrief.confirmedFacts.find((fact) => fact.field === field);
}

function getFactValue(productBrief: ProductBrief, field: string) {
  return getFact(productBrief, field)?.value.trim() || "";
}

function factIncludes(productBrief: ProductBrief, pattern: RegExp) {
  return productBrief.confirmedFacts.some((fact) => pattern.test(fact.value));
}

function hasHardShellSupport(productBrief: ProductBrief) {
  return (
    factIncludes(productBrief, /\babs\b|\bpc\b|hard[\s-]?shell|hardside|硬壳/i) ||
    /abs|pc|hard[\s-]?shell|hardside/i.test(getFactValue(productBrief, "material"))
  );
}

function blockedClaimSet(competitorInsights: CompetitorInsights) {
  return new Set(
    competitorInsights.blockedFromFinalListing.map((item) => lower(item.claim)),
  );
}

function riskyClaimSet(productBrief: ProductBrief, competitorInsights: CompetitorInsights) {
  return new Set([
    ...HIGH_RISK_CLAIMS.map((claim) => lower(claim)),
    ...productBrief.prohibitedClaims.map((item) => lower(item.claim)),
    ...competitorInsights.riskyClaims.map((item) => lower(item.claim)),
  ]);
}

function isBrandTerm(value: string, competitorInsights: CompetitorInsights) {
  const normalized = lower(value);
  const blockedBrands = competitorInsights.blockedFromFinalListing
    .filter((item) => item.reason === "brand_term")
    .map((item) => lower(item.claim));

  return [...KNOWN_BRANDS, ...blockedBrands].some((brand) => normalized.includes(brand));
}

function isRiskyOrBlockedKeyword(
  value: string,
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
) {
  const normalized = lower(value);
  const blocked = blockedClaimSet(competitorInsights);
  const risky = riskyClaimSet(productBrief, competitorInsights);

  if (isBrandTerm(value, competitorInsights)) {
    return true;
  }

  for (const claim of blocked) {
    if (normalized.includes(claim) || claim.includes(normalized)) {
      return true;
    }
  }

  for (const claim of risky) {
    if (normalized.includes(claim) || claim.includes(normalized)) {
      return true;
    }
  }

  return false;
}

function safeCompetitorKeywords(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
) {
  return competitorInsights.keywordPatterns.filter((keyword) => {
    if (isRiskyOrBlockedKeyword(keyword, productBrief, competitorInsights)) {
      return false;
    }

    const normalized = lower(keyword);

    if (normalized.includes("hard shell") || normalized.includes("hardside")) {
      return hasHardShellSupport(productBrief);
    }

    return true;
  });
}

function conservativeProductTranslation(productBrief: ProductBrief) {
  if (isLuggageProduct(productBrief)) {
    return "suitcase";
  }

  if (/收纳|storage|organizer/i.test(productText(productBrief))) {
    return "storage organizer";
  }

  return productBrief.product.category || productBrief.product.nameCn;
}

export function choosePrimaryKeyword(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): string {
  const productNameEn = productBrief.product.nameEn?.trim();

  if (
    productNameEn &&
    !isRiskyOrBlockedKeyword(productNameEn, productBrief, competitorInsights)
  ) {
    return productNameEn;
  }

  if (isLuggageProduct(productBrief)) {
    if (hasHardShellSupport(productBrief)) {
      return "hard shell suitcase";
    }

    const luggageKeyword = safeCompetitorKeywords(productBrief, competitorInsights).find(
      (keyword) => /travel suitcase|suitcase|luggage/i.test(keyword),
    );

    return luggageKeyword || "suitcase";
  }

  const safeCompetitorKeyword = safeCompetitorKeywords(productBrief, competitorInsights)[0];

  if (safeCompetitorKeyword) {
    return safeCompetitorKeyword;
  }

  return conservativeProductTranslation(productBrief);
}

export function buildAvoidClaims(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): ListingStrategy["avoidClaims"] {
  const claims = [
    ...HIGH_RISK_CLAIMS.map((claim) => ({
      claim,
      reason: "Common high-risk claim without confirmed product proof.",
    })),
    ...productBrief.prohibitedClaims.map((item) => ({
      claim: item.claim,
      reason: item.reason,
    })),
    ...competitorInsights.riskyClaims.map((item) => ({
      claim: item.claim,
      reason: item.reason,
    })),
    ...competitorInsights.blockedFromFinalListing.map((item) => ({
      claim: item.claim,
      reason:
        item.reason === "brand_term"
          ? "Competitor brand terms must not enter Work UP final listing."
          : "Competitor claim is unconfirmed for this product.",
    })),
  ];

  return unique(claims.map((item) => `${item.claim}|||${item.reason}`)).map((item) => {
    const [claim, reason] = item.split("|||");

    return { claim, reason };
  });
}

export function chooseSecondaryKeywords(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): string[] {
  const candidates: string[] = [];
  const color = getFactValue(productBrief, "color");
  const material = getFactValue(productBrief, "material");

  if (isLuggageProduct(productBrief)) {
    candidates.push("travel suitcase", "luggage", "suitcase");

    if (/黑|black/i.test(color)) {
      candidates.push("black suitcase");
    }

    if (/\babs\b/i.test(material)) {
      candidates.push("ABS luggage", "hard shell luggage", "hardside suitcase");
    }

    if (/\bpc\b/i.test(material)) {
      candidates.push("PC luggage", "hard shell suitcase", "hardside luggage");
    }
  } else {
    candidates.push(productBrief.product.category);

    if (color) {
      candidates.push(`${color} ${productBrief.product.category}`);
    }

    if (material) {
      candidates.push(`${material} ${productBrief.product.category}`);
    }
  }

  candidates.push(...safeCompetitorKeywords(productBrief, competitorInsights));

  return unique(candidates)
    .filter((keyword) => !isRiskyOrBlockedKeyword(keyword, productBrief, competitorInsights))
    .slice(0, 10);
}

export function buildPositioning(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): ListingStrategy["positioning"] {
  const targetBuyer = productBrief.product.targetCustomer || "Amazon shoppers";
  const useCaseFact = getFactValue(productBrief, "useCases");
  const useCases = unique([
    ...useCaseFact.split(/[，,、\n]/).map((item) => item.trim()),
    ...(isLuggageProduct(productBrief) ? ["travel use"] : []),
  ]).filter(Boolean);
  const baseDirection = isLuggageProduct(productBrief)
    ? "Entry-level travel suitcase positioned around practical travel use and confirmed product facts."
    : `Practical ${productBrief.product.category} positioned around confirmed product facts.`;
  const opportunityDirection = competitorInsights.opportunities.length
    ? `${baseDirection} Competitor insights suggest opportunities, but unconfirmed claims stay out of final listing.`
    : baseDirection;

  return {
    direction: opportunityDirection,
    targetBuyer,
    useCases: useCases.length > 0 ? useCases : ["general product use"],
    tone: "professional",
  };
}

export function buildSafeClaims(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): ListingStrategy["safeClaims"] {
  void competitorInsights;

  const claims: ListingStrategy["safeClaims"] = [];
  const material = getFactValue(productBrief, "material");
  const color = getFactValue(productBrief, "color");
  const category = productBrief.product.category;

  if (material) {
    claims.push({
      claim: /\babs\b/i.test(material) ? "ABS shell" : `${material} material`,
      evidence: "material confirmed by user input",
    });
  }

  if (color) {
    claims.push({
      claim: /黑|black/i.test(color) ? "black color" : `${color} color`,
      evidence: "color confirmed by user input",
    });
  }

  if (category) {
    claims.push({
      claim: isLuggageProduct(productBrief) ? "travel suitcase" : category,
      evidence: "category confirmed by user input",
    });
  }

  return unique(claims.map((item) => `${item.claim}|||${item.evidence}`)).map((item) => {
    const [claim, evidence] = item.split("|||");

    return { claim, evidence };
  });
}

export function buildSellingPointOrder(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): ListingStrategy["sellingPointOrder"] {
  const material = getFactValue(productBrief, "material");
  const color = getFactValue(productBrief, "color");
  const hasPainPoints = competitorInsights.buyerPainPoints.length > 0;
  const mobilityIsUnconfirmed = competitorInsights.blockedFromFinalListing.some(
    (item) => lower(item.claim) === "spinner wheels",
  );
  const identityPoint =
    isLuggageProduct(productBrief) && material
      ? `${material} travel suitcase identity`
      : `${productBrief.product.category} product identity`;
  const realFeaturePoint = color
    ? `${color} appearance based on confirmed input`
    : "Confirmed product facts without invented specifications";

  return [
    {
      rank: 1,
      sellingPoint: identityPoint,
      reason: "Lead with product identity, category, and confirmed material when available.",
      evidenceFields: material ? ["productNameCn", "category", "material"] : ["productNameCn", "category"],
    },
    {
      rank: 2,
      sellingPoint: isLuggageProduct(productBrief)
        ? "Practical travel use"
        : "Main use case and target buyer",
      reason: "Use cases help buyers understand where the product fits without inventing specs.",
      evidenceFields: ["category"],
    },
    {
      rank: 3,
      sellingPoint: realFeaturePoint,
      reason: "Confirmed facts should rank before competitor-inspired ideas.",
      evidenceFields: color ? ["color"] : ["confirmedFacts"],
    },
    {
      rank: 4,
      sellingPoint:
        isLuggageProduct(productBrief) && mobilityIsUnconfirmed
          ? "General mobility without claiming a specific wheel type"
          : hasPainPoints
            ? "Buyer pain point response using only confirmed facts"
            : "General buyer concern response without unsupported features",
      reason: "Pain points can shape messaging, but unconfirmed competitor features stay out.",
      evidenceFields: hasPainPoints ? ["competitorInsights.buyerPainPoints"] : ["category"],
    },
    {
      rank: 5,
      sellingPoint: "Practical purchase confidence with conservative compliance wording",
      reason: "Close with trust and clarity while avoiding unsupported guarantees or high-risk claims.",
      evidenceFields: ["avoidClaims", "safeClaims"],
    },
  ];
}

export function buildListingStrategy(
  productBrief: ProductBrief,
  competitorInsights: CompetitorInsights,
): ListingStrategy {
  return {
    primaryKeyword: choosePrimaryKeyword(productBrief, competitorInsights),
    secondaryKeywords: chooseSecondaryKeywords(productBrief, competitorInsights),
    positioning: buildPositioning(productBrief, competitorInsights),
    sellingPointOrder: buildSellingPointOrder(productBrief, competitorInsights),
    avoidClaims: buildAvoidClaims(productBrief, competitorInsights),
    safeClaims: buildSafeClaims(productBrief, competitorInsights),
  };
}
