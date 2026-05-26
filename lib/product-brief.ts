import type {
  ConfirmedFact,
  EvidenceSource,
  ImpactArea,
  Marketplace,
  MissingInfo,
  ProductBrief,
} from "@/lib/workup-schema";

export type BuildProductBriefInput = {
  productNameCn: string;
  productNameEn?: string;
  marketplace: Marketplace;
  category: string;
  targetPrice?: string;
  targetCustomer?: string;
  formData: Record<string, unknown>;
};

type FieldDefinition = {
  field: string;
  aliases: string[];
  source: EvidenceSource;
  confidence: ConfirmedFact["confidence"];
};

type MissingDefinition = {
  field: string;
  aliases: string[];
  whyItMatters: string;
  example: string;
  impactArea: ImpactArea;
};

const REQUIRED_FIELDS_TOTAL = 3;
const LUGGAGE_PATTERN = /行李箱|拉杆箱|登机箱|suitcase|luggage|travel/i;

const confirmedFieldDefinitions: FieldDefinition[] = [
  {
    field: "productNameCn",
    aliases: ["productNameCn", "product_name_cn"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "productNameEn",
    aliases: ["productNameEn", "product_name_en"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "category",
    aliases: ["category"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "marketplace",
    aliases: ["marketplace"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "targetPrice",
    aliases: ["targetPrice", "target_price"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "targetCustomer",
    aliases: ["targetCustomer", "target_customer", "target_user"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "material",
    aliases: ["material"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "color",
    aliases: ["color"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "dimensions",
    aliases: ["dimensions"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "weight",
    aliases: ["weight"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "capacity",
    aliases: ["capacity", "load_capacity"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "packageQuantity",
    aliases: ["packageQuantity", "package_quantity", "package_contents"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "useCases",
    aliases: ["useCases", "use_cases", "usage_scenarios"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "coreFeatures",
    aliases: ["coreFeatures", "core_features"],
    source: "user_input",
    confidence: "high",
  },
  {
    field: "supplierDescription",
    aliases: ["supplierDescription", "supplier_description"],
    source: "supplier_description",
    confidence: "medium",
  },
  {
    field: "ownDifferentiation",
    aliases: ["ownDifferentiation", "own_differentiation", "differentiation"],
    source: "user_input",
    confidence: "medium",
  },
];

const genericMissingDefinitions: MissingDefinition[] = [
  {
    field: "material",
    aliases: ["material"],
    whyItMatters: "材质会影响耐用性、质感、合规表达和买家对产品价值的判断。",
    example: "ABS, PC, stainless steel, cotton, silicone",
    impactArea: "bulletPoints",
  },
  {
    field: "dimensions",
    aliases: ["dimensions"],
    whyItMatters: "尺寸会影响标题、五点、图片说明和买家是否能确认适配场景。",
    example: "20 x 14 x 9 inches, 30 cm x 20 cm x 10 cm",
    impactArea: "title",
  },
  {
    field: "weight",
    aliases: ["weight"],
    whyItMatters: "重量会影响配送预期、便携性表达和使用场景。",
    example: "2.8 lb, 1.3 kg",
    impactArea: "bulletPoints",
  },
  {
    field: "capacity",
    aliases: ["capacity", "load_capacity"],
    whyItMatters: "容量或承重缺失时，不能安全写 heavy-duty、large capacity 等强 claim。",
    example: "35 L, holds up to 10 lb, fits 3 days of clothes",
    impactArea: "compliance",
  },
  {
    field: "useCases",
    aliases: ["useCases", "use_cases", "usage_scenarios"],
    whyItMatters: "使用场景能帮助 Bullet Points 更贴近真实买家需求。",
    example: "weekend travel, dorm room storage, office desk organization",
    impactArea: "bulletPoints",
  },
  {
    field: "coreFeatures",
    aliases: ["coreFeatures", "core_features"],
    whyItMatters: "核心功能决定卖点排序和标题里的关键词取舍。",
    example: "foldable design, smooth wheels, leak-resistant lid",
    impactArea: "positioning",
  },
  {
    field: "packageQuantity",
    aliases: ["packageQuantity", "package_quantity", "package_contents"],
    whyItMatters: "包装数量会影响买家预期，也会影响标题和描述是否能写 pack、set 等词。",
    example: "1 suitcase, 2 storage bins, 4 replacement filters",
    impactArea: "description",
  },
];

const luggageMissingDefinitions: MissingDefinition[] = [
  {
    field: "size",
    aliases: ["size", "dimensions"],
    whyItMatters: "行李箱尺寸直接影响是否适合作为登机箱或托运行李。",
    example: "20 inch carry-on, 24 inch checked suitcase",
    impactArea: "title",
  },
  {
    field: "wheelType",
    aliases: ["wheelType", "wheel_type", "wheels"],
    whyItMatters: "轮子类型会影响移动体验，是行李箱买家重点关注点。",
    example: "360 spinner wheels, silent double wheels",
    impactArea: "bulletPoints",
  },
  {
    field: "lockType",
    aliases: ["lockType", "lock_type", "lock"],
    whyItMatters: "锁具类型影响安全感，但 TSA lock 等 claim 需要明确证明。",
    example: "combination lock, TSA-approved lock with proof",
    impactArea: "compliance",
  },
  {
    field: "handleMaterial",
    aliases: ["handleMaterial", "handle_material", "handle"],
    whyItMatters: "拉杆和提手材质会影响耐用性与使用体验表达。",
    example: "aluminum telescopic handle, reinforced side handle",
    impactArea: "bulletPoints",
  },
  {
    field: "shellMaterial",
    aliases: ["shellMaterial", "shell_material"],
    whyItMatters: "箱壳材质会影响防刮、抗压、重量等高风险表达。",
    example: "ABS shell, PC hardshell",
    impactArea: "compliance",
  },
  {
    field: "expandable",
    aliases: ["expandable", "expansion", "扩展层"],
    whyItMatters: "是否可扩展会影响容量卖点，但不能在未确认时编造。",
    example: "expandable zipper adds extra packing space",
    impactArea: "bulletPoints",
  },
  {
    field: "carryOnConfirmation",
    aliases: ["carryOnConfirmation", "carry_on_confirmation", "carry_on"],
    whyItMatters: "登机箱适配需要站点和航空公司规则支持，不能直接写 airline approved。",
    example: "fits common carry-on size guidance, verify airline rules",
    impactArea: "compliance",
  },
  {
    field: "warranty",
    aliases: ["warranty", "guarantee"],
    whyItMatters: "保修承诺影响售后预期，不能在无政策证明时写 lifetime warranty。",
    example: "1-year limited warranty, 30-day return policy",
    impactArea: "description",
  },
];

const riskClaimDefinitions = [
  {
    claim: "waterproof",
    pattern: /\bwater[\s-]?proof\b/i,
    proofAliases: ["waterproofProof", "waterproof_proof", "waterproof_rating", "test_report"],
  },
  {
    claim: "scratch-proof",
    pattern: /\bscratch[\s-]?proof\b/i,
    proofAliases: ["scratchProof", "scratch_proof", "scratch_test", "test_report"],
  },
  {
    claim: "unbreakable",
    pattern: /\bunbreakable\b/i,
    proofAliases: ["durabilityTest", "durability_test", "test_report"],
  },
  {
    claim: "TSA lock",
    pattern: /\btsa\s+lock\b/i,
    proofAliases: ["tsaLockProof", "tsa_lock_proof", "lockType", "lock_type"],
  },
  {
    claim: "airline approved",
    pattern: /\bairline[\s-]?approved\b/i,
    proofAliases: ["airlineApproval", "airline_approval", "carryOnConfirmation"],
  },
  {
    claim: "medical grade",
    pattern: /\bmedical[\s-]?grade\b/i,
    proofAliases: ["medicalCertification", "medical_certification"],
  },
  {
    claim: "best seller",
    pattern: /\bbest[\s-]?seller\b/i,
    proofAliases: ["salesRankProof", "sales_rank_proof"],
  },
  {
    claim: "guaranteed",
    pattern: /\bguaranteed\b/i,
    proofAliases: ["guaranteePolicy", "guarantee_policy"],
  },
  {
    claim: "lifetime warranty",
    pattern: /\blifetime\s+warranty\b/i,
    proofAliases: ["warrantyPolicy", "warranty_policy", "warranty"],
  },
  {
    claim: "heavy-duty",
    pattern: /\bheavy[\s-]?duty\b/i,
    proofAliases: ["loadCapacity", "load_capacity", "capacity", "test_report"],
  },
  {
    claim: "100% safe",
    pattern: /\b100%\s*safe\b/i,
    proofAliases: ["safetyCertification", "safety_certification"],
  },
  {
    claim: "FDA approved",
    pattern: /\bfda[\s-]?approved\b/i,
    proofAliases: ["fdaCertification", "fda_certification"],
  },
  {
    claim: "antibacterial",
    pattern: /\banti[\s-]?bacterial\b/i,
    proofAliases: ["antibacterialTest", "antibacterial_test"],
  },
] as const;

const optionalCompletenessFields = [
  "productNameEn",
  "targetPrice",
  "targetCustomer",
  "material",
  "color",
  "dimensions",
  "weight",
  "capacity",
  "packageQuantity",
  "useCases",
  "coreFeatures",
  "supplierDescription",
  "ownDifferentiation",
  "size",
  "wheelType",
  "lockType",
  "handleMaterial",
  "shellMaterial",
  "expandable",
  "carryOnConfirmation",
  "warranty",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => textValue(item))
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function pickText(
  input: BuildProductBriefInput,
  aliases: readonly string[],
  fallback?: unknown,
) {
  const formData = asRecord(input.formData);

  for (const alias of aliases) {
    const directValue = textValue((input as unknown as Record<string, unknown>)[alias]);

    if (directValue) {
      return directValue;
    }

    const formValue = textValue(formData[alias]);

    if (formValue) {
      return formValue;
    }
  }

  return textValue(fallback);
}

function hasAnyValue(input: BuildProductBriefInput, aliases: readonly string[]) {
  return Boolean(pickText(input, aliases));
}

function isLuggageProduct(input: BuildProductBriefInput) {
  const haystack = [
    input.productNameCn,
    input.productNameEn,
    input.category,
    textValue(input.formData.product_name_cn),
    textValue(input.formData.product_name_en),
    textValue(input.formData.category),
  ].join(" ");

  return LUGGAGE_PATTERN.test(haystack);
}

function textCorpus(input: BuildProductBriefInput) {
  const formData = asRecord(input.formData);
  const values = [
    input.productNameCn,
    input.productNameEn,
    input.marketplace,
    input.category,
    input.targetPrice,
    input.targetCustomer,
    ...Object.values(formData),
  ];

  return values.map(textValue).filter(Boolean).join("\n");
}

function hasProofForClaim(
  input: BuildProductBriefInput,
  proofAliases: readonly string[],
  claim: string,
) {
  const normalizedClaim = claim.toLowerCase();

  return proofAliases.some((alias) => {
    const value = pickText(input, [alias]);

    if (!value) {
      return false;
    }

    return value.toLowerCase().includes(normalizedClaim) || value.length > 0;
  });
}

function missingDefinitionToInfo(definition: MissingDefinition): MissingInfo[number] {
  return {
    field: definition.field,
    whyItMatters: definition.whyItMatters,
    example: definition.example,
    impactArea: definition.impactArea,
  };
}

function requireText(value: string, field: string) {
  const normalized = textValue(value);

  if (!normalized) {
    throw new Error(`Product Brief 缺少必填字段：${field}`);
  }

  return normalized;
}

export function extractConfirmedFacts(input: BuildProductBriefInput): ConfirmedFact[] {
  const facts: ConfirmedFact[] = [];
  const seenFields = new Set<string>();

  for (const definition of confirmedFieldDefinitions) {
    const value = pickText(input, definition.aliases);

    if (!value || seenFields.has(definition.field)) {
      continue;
    }

    facts.push({
      field: definition.field,
      value,
      source: definition.source,
      confidence: definition.confidence,
    });
    seenFields.add(definition.field);
  }

  return facts;
}

export function detectMissingInfo(input: BuildProductBriefInput): MissingInfo {
  const definitions = isLuggageProduct(input)
    ? [...genericMissingDefinitions, ...luggageMissingDefinitions]
    : genericMissingDefinitions;
  const missing: MissingInfo = [];
  const seenFields = new Set<string>();

  for (const definition of definitions) {
    if (seenFields.has(definition.field) || hasAnyValue(input, definition.aliases)) {
      continue;
    }

    missing.push(missingDefinitionToInfo(definition));
    seenFields.add(definition.field);
  }

  return missing;
}

export function detectProhibitedClaims(
  input: BuildProductBriefInput,
): ProductBrief["prohibitedClaims"] {
  const corpus = textCorpus(input);
  const prohibitedClaims: ProductBrief["prohibitedClaims"] = [];

  if (!corpus) {
    return prohibitedClaims;
  }

  for (const definition of riskClaimDefinitions) {
    if (!definition.pattern.test(corpus)) {
      continue;
    }

    if (hasProofForClaim(input, definition.proofAliases, definition.claim)) {
      continue;
    }

    prohibitedClaims.push({
      claim: definition.claim,
      reason: `用户输入中出现了高风险 claim "${definition.claim}"，但没有对应的证明字段或 confirmed fact。`,
      source: "user_input",
    });
  }

  return prohibitedClaims;
}

export function buildProductBrief(input: BuildProductBriefInput): ProductBrief {
  const productNameCn = requireText(input.productNameCn, "productNameCn");
  const marketplace = requireText(input.marketplace, "marketplace") as Marketplace;
  const category = requireText(input.category, "category");
  const productNameEn = textValue(input.productNameEn);
  const targetPrice = textValue(input.targetPrice);
  const targetCustomer = textValue(input.targetCustomer);
  const requiredFieldsProvided = [productNameCn, marketplace, category].filter(Boolean).length;
  const optionalFieldsProvided = optionalCompletenessFields.filter((field) =>
    hasAnyValue(input, [field]),
  ).length;

  return {
    schemaVersion: "workup.v1",
    product: {
      nameCn: productNameCn,
      nameEn: productNameEn,
      marketplace,
      category,
      targetPrice,
      targetCustomer,
    },
    confirmedFacts: extractConfirmedFacts(input),
    missingInfo: detectMissingInfo(input),
    prohibitedClaims: detectProhibitedClaims(input),
    rawInputCompleteness: {
      requiredFieldsProvided,
      requiredFieldsTotal: REQUIRED_FIELDS_TOTAL,
      optionalFieldsProvided,
    },
  };
}
