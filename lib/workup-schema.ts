export type WorkUpSchemaVersion = "workup.v1";

export type Marketplace = "US" | "UK" | "CA" | "AU";

export type EvidenceSource =
  | "user_input"
  | "supplier_description"
  | "competitor_input"
  | "review_input"
  | "system_inference";

export type ImpactArea =
  | "title"
  | "bulletPoints"
  | "description"
  | "searchTerms"
  | "images"
  | "compliance"
  | "positioning"
  | "conversion";

export type ConfidenceLevel = "low" | "medium" | "high";

export type RiskLevel = "low" | "medium" | "high";

export type ListingLanguageField = {
  english: string;
  chineseExplanation: string;
};

export type ConfirmedFact = {
  field: string;
  value: string;
  source: EvidenceSource;
  confidence: ConfidenceLevel;
};

export type MissingInfo = Array<{
  field: string;
  whyItMatters: string;
  example: string;
  impactArea: ImpactArea;
}>;

export type ComplianceNotes = Array<{
  riskLevel: RiskLevel;
  claim: string;
  reason: string;
  recommendation: string;
  relatedField?: string;
}>;

export type Assumptions = Array<{
  assumption: string;
  reason: string;
  confidence: ConfidenceLevel;
  shouldVerifyWithUser: boolean;
}>;

export type ImprovementSuggestions = Array<{
  priority: "low" | "medium" | "high";
  suggestion: string;
  reason: string;
  expectedImpact: ImpactArea;
}>;

export type ProductBrief = {
  schemaVersion: WorkUpSchemaVersion;
  product: {
    nameCn: string;
    nameEn?: string;
    marketplace: Marketplace;
    category: string;
    targetPrice?: string;
    targetCustomer?: string;
  };
  confirmedFacts: ConfirmedFact[];
  missingInfo: MissingInfo;
  prohibitedClaims: Array<{
    claim: string;
    reason: string;
    source: EvidenceSource;
  }>;
  rawInputCompleteness: {
    requiredFieldsProvided: number;
    requiredFieldsTotal: number;
    optionalFieldsProvided: number;
  };
};

export type CompetitorInput = {
  titles: string[];
  urls: string[];
  bulletPoints: string[];
  reviewPainPoints: string[];
  differentiationNotes: string[];
};

export type CompetitorInsights = {
  input: CompetitorInput;
  keywordPatterns: string[];
  buyerPainPoints: string[];
  competitorAngles: string[];
  opportunities: Array<{
    opportunity: string;
    source: "competitor_claim" | "review_pain_point" | "user_differentiation";
    requiredConfirmation?: string;
  }>;
  riskyClaims: Array<{
    claim: string;
    reason: string;
  }>;
  blockedFromFinalListing: Array<{
    claim: string;
    reason: "competitor_claim_unconfirmed" | "brand_term" | "unsupported_performance_claim";
  }>;
  notes: {
    competitorClaimsPolicy: "competitor claims cannot be copied directly into finalListing";
    unconfirmedFeaturesPolicy: "unconfirmed competitor features must become missingInfo or opportunities";
  };
};

export type ListingStrategy = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  positioning: {
    direction: string;
    targetBuyer: string;
    useCases: string[];
    tone: "professional" | "direct" | "conversion" | "localized";
  };
  sellingPointOrder: Array<{
    rank: 1 | 2 | 3 | 4 | 5;
    sellingPoint: string;
    reason: string;
    evidenceFields: string[];
  }>;
  avoidClaims: Array<{
    claim: string;
    reason: string;
  }>;
  safeClaims: Array<{
    claim: string;
    evidence: string;
  }>;
};

export type QualityScore = {
  overall: number;
  level: "basic" | "good" | "strong";
  dimensions: {
    inputCompleteness: number;
    keywordRelevance: number;
    complianceSafety: number;
    amazonReadiness: number;
    copyClarity: number;
  };
  summary: string;
};

export type FinalListing = {
  title: ListingLanguageField;
  bulletPoints: [
    ListingLanguageField & {
      sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired";
      evidenceFields: string[];
    },
    ListingLanguageField & {
      sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired";
      evidenceFields: string[];
    },
    ListingLanguageField & {
      sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired";
      evidenceFields: string[];
    },
    ListingLanguageField & {
      sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired";
      evidenceFields: string[];
    },
    ListingLanguageField & {
      sourceBasis: "confirmed_fact" | "safe_inference" | "competitor_inspired";
      evidenceFields: string[];
    },
  ];
  description: ListingLanguageField;
  searchTerms: ListingLanguageField;
};

export type GenerationAnalysis = {
  productSummary: string;
  strategySummary: string;
  competitorSummary: string;
  complianceSummary: string;
  beginnerExplanation: string;
};

export type GenerationResult = {
  schemaVersion: WorkUpSchemaVersion;
  source: "deepseek";
  generatedAt: string;
  model: string;
  qualityScore: QualityScore;
  productBrief: ProductBrief;
  competitorInsights: CompetitorInsights;
  listingStrategy: ListingStrategy;
  finalListing: FinalListing;
  complianceNotes: ComplianceNotes;
  missingInfo: MissingInfo;
  assumptions: Assumptions;
  improvementSuggestions: ImprovementSuggestions;
  analysis: GenerationAnalysis;
};

export type GenerationInputSnapshot = {
  schemaVersion: WorkUpSchemaVersion;
  projectId: string;
  userId: string;
  projectSnapshot: {
    productNameCn: string;
    productNameEn?: string;
    marketplace: Marketplace;
    category: string;
    targetPrice?: string;
    targetCustomer?: string;
    formData: Record<string, string | boolean | null>;
  };
  productBrief: ProductBrief;
  competitorInsights: CompetitorInsights;
  listingStrategy: ListingStrategy;
  prompt: {
    version: string;
    systemPromptId: string;
    userPromptId: string;
  };
  model: {
    provider: "deepseek";
    name: string;
  };
  createdAt: string;
};
