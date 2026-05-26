# Work UP Schema Design

本文为 Work UP 后续开发定义稳定数据结构。Work UP 是面向跨境卖家的 Amazon Listing 策略分析与生成工具，后续所有真实生成、保存、展示和复制逻辑都应围绕本文 schema 演进。

## 一、设计目标

1. 让 Product Brief、竞品洞察、Listing 策略、最终 Listing、质量评分和合规提示有稳定边界。
2. 确保最终英文 Listing 字段和中文解释分离，避免复制时混入中文说明。
3. 确保 `FinalListing` 必须包含 `title`、exactly 5 `bulletPoints`、`description`、`searchTerms`。
4. 确保 `GenerationResult.source` 只能是 `"deepseek"`，真实结果不依赖 `mockGenerationResult` 或 mock normalizer。
5. 确保 Supabase 中 `product_projects.form_data` 保存原始输入，`generation_results.result_json` 保存完整 `GenerationResult`，`generation_results.input_snapshot` 保存生成输入快照。

## 二、命名与字段原则

- TypeScript 类型使用 PascalCase。
- JSON 字段使用 camelCase。
- 用户原始输入字段可以保留当前表单字段名，例如 `product_name_cn`、`competitor_title`，但进入业务 schema 后应转换为稳定 camelCase。
- 英文最终文案字段统一放在 `finalListing.*.english` 或 `finalListing.bulletPoints[].english`。
- 中文解释统一放在 `finalListing.*.chineseExplanation` 或 `finalListing.bulletPoints[].chineseExplanation`。
- 任何中文说明、策略、缺失信息、假设、分析都不能进入 copy 输出。
- 竞品 claims 不能直接进入 `finalListing`。未经用户确认的竞品功能只能进入 `missingInfo` 或 `competitorInsights.opportunities`。

## 三、TypeScript 类型定义草案

以下类型建议后续落到 `lib/workup-schema.ts` 或按模块拆分到 `lib/product-brief.ts`、`lib/competitor-insights.ts`、`lib/listing-strategy.ts`、`lib/generation-result-validation.ts`。

```ts
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
```

## 四、字段解释

### ProductBrief

`ProductBrief` 是用户原始输入进入 AI 前的标准产品资料结构。它负责区分“用户确认过的事实”和“系统不能乱写的空白”。

- `schemaVersion`：固定为 `"workup.v1"`，后续 schema 变更时递增。
- `product`：产品基础资料，来自 `product_projects` 表的稳定字段。
- `confirmedFacts`：可安全进入 prompt 的事实，例如材质、尺寸、包装内容、使用场景。
- `missingInfo`：缺失资料，必须包含 `field`、`whyItMatters`、`example`、`impactArea`。
- `prohibitedClaims`：用户输入或系统识别出的禁止 claim，例如未经证明的 `medical`、`guaranteed`、`heavy-duty`。
- `rawInputCompleteness`：用于质量评分和结果页资料质量展示。

### CompetitorInput

`CompetitorInput` 保存用户手动粘贴的竞品线索，不代表事实。

- `titles`：竞品标题。
- `urls`：竞品链接，只保存，不自动抓取。
- `bulletPoints`：竞品五点或卖点。
- `reviewPainPoints`：评论痛点、差评、买家顾虑。
- `differentiationNotes`：用户认为自己产品不同的地方。

### CompetitorInsights

`CompetitorInsights` 是对竞品输入的分析结果，但不能直接写入最终 Listing。

- `keywordPatterns`：可参考的关键词表达。
- `buyerPainPoints`：评论和竞品中反复出现的买家问题。
- `competitorAngles`：竞品常见定位角度。
- `opportunities`：可探索机会，未经确认的功能必须标记 `requiredConfirmation`。
- `riskyClaims`：竞品中出现但对 Work UP 用户不安全的 claim。
- `blockedFromFinalListing`：明确禁止进入 `finalListing` 的内容。
- `notes`：固定策略说明，提醒后续开发不要把竞品 claim 复制到最终文案。

### ListingStrategy

`ListingStrategy` 是 prompt 前的运营策略层，不能等同于 AI 结果。

- `primaryKeyword`：首要关键词。
- `secondaryKeywords`：辅助关键词。
- `positioning`：定位方向、目标买家、使用场景、英文语气。
- `sellingPointOrder`：5 条 bullet 的卖点排序依据。
- `avoidClaims`：禁止写入的 claim。
- `safeClaims`：有证据支持、可安全表达的 claim。

### QualityScore

`QualityScore` 用于告诉用户资料质量和结果可信度，不是 Amazon 官方评分。

- `overall`：0 到 100。
- `level`：`"basic"`、`"good"` 或 `"strong"`，用于页面直观展示资料质量等级。
- `dimensions.inputCompleteness`：资料完整度。
- `dimensions.keywordRelevance`：关键词相关性。
- `dimensions.complianceSafety`：合规安全度。
- `dimensions.amazonReadiness`：可复制到 Amazon 后台的准备度。
- `dimensions.copyClarity`：英文清晰度。
- `summary`：中文总结。

### FinalListing

`FinalListing` 是唯一可以被 Copy 模块使用的最终 Listing 数据源。

- `title.english`：英文标题。
- `title.chineseExplanation`：中文解释，不复制到 Amazon。
- `bulletPoints`：必须是 5 条 tuple，不能少于或多于 5 条。
- `bulletPoints[].sourceBasis`：说明该 bullet 来自确认事实、保守推断或竞品启发。
- `bulletPoints[].evidenceFields`：追溯该 bullet 使用的依据字段，例如 `material`、`category`、`competitorInsights.buyerPainPoints`。
- `description.english`：英文描述。
- `description.chineseExplanation`：中文解释。
- `searchTerms.english`：后台 Search Terms 英文。
- `searchTerms.chineseExplanation`：关键词含义和使用说明。

### ComplianceNotes

`ComplianceNotes` 用于结果页展示风险提醒。

- `riskLevel`：风险等级。
- `claim`：风险 claim 或表达。
- `reason`：为什么有风险。
- `recommendation`：替代表达或处理方式。
- `relatedField`：可选，关联到具体输入字段。

### MissingInfo

`MissingInfo` 是数组，每项必须包含：

- `field`：缺失字段名。
- `whyItMatters`：为什么影响 Listing。
- `example`：用户可补充的示例。
- `impactArea`：影响范围，例如 `bulletPoints`、`compliance`、`images`。

### Assumptions

`Assumptions` 记录系统为了低信息输入而做出的保守假设。

- 假设不能伪装成事实。
- `shouldVerifyWithUser: true` 的内容应优先在结果页提醒用户补充。
- 假设不能直接变成强 claim。

### ImprovementSuggestions

`ImprovementSuggestions` 告诉用户下一步如何提升 Listing 质量。

- `priority`：建议优先级。
- `suggestion`：具体建议。
- `reason`：为什么建议这样做。
- `expectedImpact`：预计影响哪个区域。

### GenerationResult

`GenerationResult` 是真实 DeepSeek 生成后的完整结果，保存到 `generation_results.result_json`。

必须包含：

- `source: "deepseek"`
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

### GenerationInputSnapshot

`GenerationInputSnapshot` 是本次生成使用的输入快照，保存到 `generation_results.input_snapshot`。

必须包含：

- 原始 project snapshot
- `ProductBrief`
- `CompetitorInsights`
- `ListingStrategy`
- prompt version
- model provider / model name

## 五、低信息输入示例

用户只填写产品中文名和类目时，系统仍然可以生成，但必须保守表达。

```json
{
  "schemaVersion": "workup.v1",
  "projectSnapshot": {
    "productNameCn": "行李箱",
    "marketplace": "US",
    "category": "Travel & Luggage",
    "formData": {
      "product_name_cn": "行李箱",
      "category": "Travel & Luggage",
      "material": null,
      "dimensions": null,
      "core_features": null,
      "competitor_title": null
    }
  },
  "productBrief": {
    "schemaVersion": "workup.v1",
    "product": {
      "nameCn": "行李箱",
      "marketplace": "US",
      "category": "Travel & Luggage"
    },
    "confirmedFacts": [
      {
        "field": "productNameCn",
        "value": "行李箱",
        "source": "user_input",
        "confidence": "high"
      },
      {
        "field": "category",
        "value": "Travel & Luggage",
        "source": "user_input",
        "confidence": "high"
      }
    ],
    "missingInfo": [
      {
        "field": "material",
        "whyItMatters": "材质会影响耐用性、重量和合规表达。",
        "example": "PC, ABS, aluminum frame, polyester lining",
        "impactArea": "bulletPoints"
      },
      {
        "field": "dimensions",
        "whyItMatters": "尺寸会影响标题、五点和买家购买判断。",
        "example": "20 inch carry-on, 14 x 9 x 22 inches",
        "impactArea": "title"
      }
    ],
    "prohibitedClaims": [
      {
        "claim": "heavy-duty",
        "reason": "缺少承重、材质或测试数据时不能写 heavy-duty。",
        "source": "system_inference"
      }
    ],
    "rawInputCompleteness": {
      "requiredFieldsProvided": 2,
      "requiredFieldsTotal": 6,
      "optionalFieldsProvided": 0
    }
  }
}
```

低信息输入生成规则：

- 可以生成通用、保守、自然的英文 Listing。
- 不能写尺寸、重量、材质、承重、防水、认证、终身保修等未经确认的信息。
- 缺失信息必须进入 `missingInfo`。
- 系统为了生成而做的判断必须进入 `assumptions`。

## 六、有竞品输入示例

用户粘贴竞品标题、卖点和评论痛点时，竞品内容只能用于分析和机会发现，不能直接复制到最终 Listing。

```json
{
  "input": {
    "titles": [
      "Expandable Carry On Luggage with Spinner Wheels, Lightweight Hardside Suitcase"
    ],
    "urls": [
      "https://www.amazon.com/example-product"
    ],
    "bulletPoints": [
      "Claims scratch-resistant shell and smooth spinner wheels."
    ],
    "reviewPainPoints": [
      "Some buyers mention the zipper feels tight when fully packed."
    ],
    "differentiationNotes": [
      "用户说自己的箱子滚轮更顺滑，但没有测试证明。"
    ]
  },
  "competitorInsights": {
    "input": {
      "titles": [
        "Expandable Carry On Luggage with Spinner Wheels, Lightweight Hardside Suitcase"
      ],
      "urls": [
        "https://www.amazon.com/example-product"
      ],
      "bulletPoints": [
        "Claims scratch-resistant shell and smooth spinner wheels."
      ],
      "reviewPainPoints": [
        "Some buyers mention the zipper feels tight when fully packed."
      ],
      "differentiationNotes": [
        "用户说自己的箱子滚轮更顺滑，但没有测试证明。"
      ]
    },
    "keywordPatterns": [
      "carry on luggage",
      "spinner wheels",
      "hardside suitcase"
    ],
    "buyerPainPoints": [
      "Zipper may feel tight when overpacked",
      "Buyers care about wheel smoothness"
    ],
    "competitorAngles": [
      "Lightweight travel",
      "Expandable packing space",
      "Smooth mobility"
    ],
    "opportunities": [
      {
        "opportunity": "如果用户能确认滚轮结构或测试体验，可以把 smooth mobility 作为安全卖点。",
        "source": "user_differentiation",
        "requiredConfirmation": "确认滚轮材质、轮数、转向方式或真实测试反馈。"
      }
    ],
    "riskyClaims": [
      {
        "claim": "scratch-resistant",
        "reason": "除非用户确认材质或测试标准，否则不能直接写防刮。"
      }
    ],
    "blockedFromFinalListing": [
      {
        "claim": "scratch-resistant shell",
        "reason": "competitor_claim_unconfirmed"
      }
    ],
    "notes": {
      "competitorClaimsPolicy": "competitor claims cannot be copied directly into finalListing",
      "unconfirmedFeaturesPolicy": "unconfirmed competitor features must become missingInfo or opportunities"
    }
  }
}
```

有竞品输入生成规则：

- 竞品标题可用于提取关键词模式。
- 竞品卖点可用于发现市场角度。
- 竞品 claim 不能直接进入 `finalListing`。
- 未经用户确认的竞品功能只能进入 `missingInfo` 或 `opportunities`。
- 竞品品牌词、商标词不能进入 Search Terms。

## 七、Copy 输出规范

Copy 模块必须只读取 `GenerationResult.finalListing`，不能读取 `analysis`、`missingInfo`、`assumptions`、`listingStrategy` 或 `competitorInsights`。

### Copy Title

输入：

```ts
result.finalListing.title.english
```

输出：

```text
Lightweight Carry-On Suitcase for Weekend Trips and Business Travel
```

### Copy Bullet Points

输入：

```ts
result.finalListing.bulletPoints.map((item) => item.english)
```

输出要求：

- 只复制 5 条英文 bullet。
- 不复制中文解释。
- 不复制 bullet 排序理由。

### Copy Full Listing

输出结构：

```text
Title:
...

Bullet Points:
1. ...
2. ...
3. ...
4. ...
5. ...

Description:
...

Search Terms:
...
```

禁止包含：

- 中文解释
- `listingStrategy`
- `missingInfo`
- `assumptions`
- `analysis`
- `competitorInsights`
- `qualityScore`

## 八、校验规则

### GenerationResult 校验

1. `schemaVersion` 必须为 `"workup.v1"`。
2. `source` 必须为 `"deepseek"`。
3. `model` 必须非空，不能是 `"mock-local"`。
4. `qualityScore.overall` 必须是 0 到 100 的数字。
5. `qualityScore.level` 必须是 `"basic"`、`"good"` 或 `"strong"`。
6. 必须包含 `productBrief`、`competitorInsights`、`listingStrategy`、`finalListing`、`complianceNotes`、`missingInfo`、`assumptions`、`improvementSuggestions`、`analysis`。

### FinalListing 校验

1. `title.english` 非空。
2. `title.chineseExplanation` 非空。
3. `bulletPoints.length === 5`。
4. 每条 bullet 的 `english` 非空。
5. 每条 bullet 的 `chineseExplanation` 非空。
6. 每条 bullet 的 `sourceBasis` 必须是 `"confirmed_fact"`、`"safe_inference"` 或 `"competitor_inspired"`。
7. 每条 bullet 的 `evidenceFields` 必须是数组。
8. `description.english` 非空。
9. `description.chineseExplanation` 非空。
10. `searchTerms.english` 非空。
11. `searchTerms.chineseExplanation` 非空。
12. 英文字段中不应包含大段中文字符。

### 合规校验

1. `finalListing` 不能包含 `productBrief.prohibitedClaims.claim`。
2. `finalListing` 不能包含 `listingStrategy.avoidClaims.claim`。
3. `finalListing` 不能包含 `competitorInsights.blockedFromFinalListing.claim`。
4. 没有 confirmed fact 时，不得写具体尺寸、材质、承重、防水、认证、医疗、保修、排名等 claim。
5. `searchTerms.english` 不得包含竞品品牌词或商标词。

### MissingInfo 校验

每项必须包含：

1. `field`
2. `whyItMatters`
3. `example`
4. `impactArea`

### ListingStrategy 校验

1. `primaryKeyword` 非空。
2. `secondaryKeywords` 可以为空数组，但不能是 undefined。
3. `positioning.direction` 非空。
4. `sellingPointOrder.length === 5`。
5. `avoidClaims` 与 `safeClaims` 分离。
6. `safeClaims[].evidence` 必须能追溯到 confirmed facts 或用户输入。

### CompetitorInsights 校验

1. 原始 `CompetitorInput` 必须保留。
2. `blockedFromFinalListing` 必须参与最终 Listing 校验。
3. 竞品 claim 不能直接进入 `finalListing`。
4. 未经用户确认的竞品功能只能进入 `missingInfo` 或 `opportunities`。

### Mock 边界校验

1. `mockGenerationResult` 只能用于首页 preview。
2. 真实 `GenerationResult` schema 不应依赖 `mockGenerationResult`。
3. 真实 `GenerationResult` schema 不应依赖 `normalizeGenerationResult` 的 mock 兼容逻辑。
4. `/api/generate-listing` 返回真实结果时必须满足本文 `GenerationResult`。
5. DeepSeek 失败应返回真实错误，不用 mock 填充正式结果。

## 九、Supabase 保存结构

### `product_projects.form_data`

用途：保存用户原始输入。

保存内容：

- 当前 `listing-wizard` 中所有字段。
- 复选项，例如 `needs_chinese_explanation`、`needs_image_suggestions`。
- 不保存 AI 改写后的内容。
- 不保存 `ProductBrief`、`ListingStrategy` 或 `GenerationResult`。

原因：

- 原始输入要可追溯。
- 后续重新生成时可以重建 Product Brief。
- 避免 AI 输出覆盖用户资料。

### `generation_results.result_json`

用途：保存完整 `GenerationResult`。

保存内容：

- `source: "deepseek"`
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

规则：

- 只保存校验通过的 DeepSeek 结果。
- 不保存 `source: "mock"`。
- 不保存 `model: "mock-local"`。
- 不保存只有旧 mock shape 的结果。

### `generation_results.input_snapshot`

用途：保存本次生成使用的输入与 prompt 上下文。

保存内容：

- `ProductBrief`
- `CompetitorInsights`
- `ListingStrategy`
- prompt version
- model provider
- model name
- 原始 project snapshot

示例：

```json
{
  "schemaVersion": "workup.v1",
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "projectSnapshot": {
    "productNameCn": "行李箱",
    "marketplace": "US",
    "category": "Travel & Luggage",
    "formData": {
      "product_name_cn": "行李箱",
      "category": "Travel & Luggage",
      "material": "PC",
      "competitor_title": "Carry On Luggage with Spinner Wheels"
    }
  },
  "productBrief": {},
  "competitorInsights": {},
  "listingStrategy": {},
  "prompt": {
    "version": "amazon-listing-v1",
    "systemPromptId": "amazon-listing-system-prompt",
    "userPromptId": "amazon-listing-user-prompt"
  },
  "model": {
    "provider": "deepseek",
    "name": "deepseek-chat"
  },
  "createdAt": "2026-05-26T10:00:00.000Z"
}
```

## 十、与现有文件的对接建议

### `lib/types.ts`

建议：

- 保留现有轻量 UI 类型。
- 后续新增 Work UP 业务 schema 时，不要把所有复杂类型继续塞进 `lib/types.ts`。
- 可以新增 `lib/workup-schema.ts` 专门导出本文类型。

### `lib/project-draft.ts`

建议：

- 继续只负责从 FormData 构建 `product_projects` insert payload。
- 不要在这里生成 AI prompt。
- 后续可在保存 Draft 后，由服务端或结果页读取 project row，再调用 `buildProductBrief(project)`。

### `lib/mock-generation-result.ts`

建议：

- 保持为 landing preview 专用。
- 不要让真实 `GenerationResult` 依赖它。
- 后续真实 result validation 应迁移到 `lib/generation-result-validation.ts`。

### `lib/ai-listing.ts`

建议：

- 从直接 normalize DeepSeek JSON，逐步迁移为：

```text
ProductBrief
→ CompetitorInsights
→ ListingStrategy
→ buildListingPrompt
→ call DeepSeek
→ validateGenerationResult
→ GenerationResult
```

- DeepSeek prompt 应要求返回本文 `GenerationResult` shape。
- DeepSeek 失败时抛出真实错误，不 fallback 到 mock 正式结果。

### `app/api/generate-listing/route.ts`

建议：

- 读取 project row 后先构建 `GenerationInputSnapshot`。
- 调用 DeepSeek 后校验 `GenerationResult`。
- API 返回的正式结果必须满足本文 schema。
- 开发 mock fallback 必须受 `ENABLE_GENERATION_MOCK=true` 控制，且不能写入真实项目结果。

### `app/projects/[id]/result/page.tsx`

建议：

- 页面只展示 `GenerationResult`。
- 结果页保存前校验 `source === "deepseek"` 且 `model !== "mock-local"`。
- Copy 按钮只读 `finalListing` 的英文值。
- Missing Info、Assumptions、Analysis、Strategy 分区展示，但不参与 Copy。

### `components/ui/copy-button.tsx`

建议：

- 继续作为底层复制按钮。
- 上层应传入已经处理好的英文 only string。
- 不要在通用按钮内部判断业务 schema。

### 后续建议新增文件

- `lib/workup-schema.ts`
- `lib/product-brief.ts`
- `lib/competitor-insights.ts`
- `lib/listing-strategy.ts`
- `lib/listing-prompt.ts`
- `lib/generation-result-validation.ts`
- `lib/final-listing-copy.ts`
- `scripts/test-workup-schema.mjs`
- `scripts/test-final-listing-copy.mjs`

## 十一、开发落地顺序

1. 新增 `lib/workup-schema.ts`，落地本文 TypeScript 类型。
2. 新增 `buildProductBrief`，把现有 `product_projects.form_data` 转成 `ProductBrief`。
3. 新增 `analyzeCompetitorInput`，把竞品输入转成 `CompetitorInsights`。
4. 新增 `buildListingStrategy`，输出 `ListingStrategy`。
5. 修改 prompt，使 DeepSeek 返回完整 `GenerationResult`。
6. 新增 `validateGenerationResult`，阻止 mock、缺字段、非 5 bullets、中文混入 copy 字段。
7. 新增 `copyFinalListing`，只输出英文。
8. 更新结果页读取和展示新 schema。
9. 增加脚本测试和 E2E 回归。

## 十二、不可变约束

- 产品名固定为 Work UP。
- `FinalListing.bulletPoints` 必须 exactly 5 条。
- 每个最终英文 Listing 字段都必须和中文解释分离。
- `GenerationResult.source` 必须为 `"deepseek"`。
- Copy 输出必须 English only。
- 竞品 claims 不能直接进入 finalListing。
- 未经用户确认的竞品功能只能进入 missingInfo 或 opportunities。
- `mockGenerationResult` 只能用于首页 preview。
- 真实 result schema 不应依赖 mock normalizer。
- `product_projects.form_data` 保存原始输入。
- `generation_results.result_json` 保存完整 `GenerationResult`。
- `generation_results.input_snapshot` 保存 `ProductBrief`、`CompetitorInsights`、`ListingStrategy`、prompt version、model。
