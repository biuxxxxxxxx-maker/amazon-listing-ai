import { expect, test } from "@playwright/test";
import {
  getHealth,
  hasSupabaseEnv,
  mockListingResult,
  mockSupabaseProjectApi,
  signInWithMockSession,
} from "./helpers.mjs";

const workUpGenerationResult = {
  schemaVersion: "workup.v1",
  source: "deepseek",
  generatedAt: "2026-05-26T00:00:00.000Z",
  model: "e2e-mock-model",
  qualityScore: {
    overall: 82,
    level: "good",
    dimensions: {
      inputCompleteness: 60,
      keywordRelevance: 82,
      complianceSafety: 92,
      amazonReadiness: 80,
      copyClarity: 86,
    },
    summary: "资料足够生成保守版行李箱 Listing。",
  },
  productBrief: {
    schemaVersion: "workup.v1",
    product: {
      nameCn: "行李箱",
      nameEn: "",
      marketplace: "US",
      category: "Travel & Luggage",
      targetPrice: "$79.99",
      targetCustomer: "Business travelers",
    },
    confirmedFacts: [
      { field: "productNameCn", value: "行李箱", source: "user_input", confidence: "high" },
      { field: "category", value: "Travel & Luggage", source: "user_input", confidence: "high" },
      { field: "material", value: "PC", source: "user_input", confidence: "high" },
    ],
    missingInfo: [
      {
        field: "size",
        whyItMatters: "尺寸影响标题和购买判断。",
        example: "20 inch carry-on",
        impactArea: "title",
      },
    ],
    prohibitedClaims: [],
    rawInputCompleteness: {
      requiredFieldsProvided: 3,
      requiredFieldsTotal: 3,
      optionalFieldsProvided: 2,
    },
  },
  competitorInsights: {
    input: {
      titles: ["Carry On Luggage with Spinner Wheels"],
      urls: [],
      bulletPoints: [],
      reviewPainPoints: ["Wheels became noisy after a few trips."],
      differentiationNotes: ["轻便耐用，适合短途出行。"],
    },
    keywordPatterns: ["luggage", "suitcase"],
    buyerPainPoints: ["wheel noise"],
    competitorAngles: ["lightweight travel"],
    opportunities: [
      {
        opportunity: "如果确认轮子结构，可以强化移动性表达。",
        source: "competitor_claim",
        requiredConfirmation: "确认轮子类型。",
      },
    ],
    riskyClaims: [],
    blockedFromFinalListing: [
      { claim: "spinner wheels", reason: "competitor_claim_unconfirmed" },
    ],
    notes: {
      competitorClaimsPolicy: "competitor claims cannot be copied directly into finalListing",
      unconfirmedFeaturesPolicy: "unconfirmed competitor features must become missingInfo or opportunities",
    },
  },
  listingStrategy: {
    primaryKeyword: "hard shell suitcase",
    secondaryKeywords: ["black suitcase", "travel suitcase", "PC luggage"],
    positioning: {
      direction: "Entry-level travel suitcase positioned around practical travel use and confirmed product facts.",
      targetBuyer: "Business travelers",
      useCases: ["travel use"],
      tone: "professional",
    },
    sellingPointOrder: [
      {
        rank: 1,
        sellingPoint: "PC shell wording",
        reason: "Use confirmed material without adding unsupported claims.",
        evidenceFields: ["material"],
      },
      {
        rank: 2,
        sellingPoint: "Practical travel use",
        reason: "Use cases help buyers understand where the product fits without inventing specs.",
        evidenceFields: ["category"],
      },
      {
        rank: 3,
        sellingPoint: "Black appearance based on confirmed input",
        reason: "Confirmed facts should rank before competitor-inspired ideas.",
        evidenceFields: ["color"],
      },
      {
        rank: 4,
        sellingPoint: "General buyer concern response without unsupported features",
        reason: "Pain points can shape messaging, but unconfirmed competitor features stay out.",
        evidenceFields: ["category"],
      },
      {
        rank: 5,
        sellingPoint: "Practical purchase confidence with conservative compliance wording",
        reason: "Close with trust and clarity while avoiding unsupported guarantees or high-risk claims.",
        evidenceFields: ["avoidClaims", "safeClaims"],
      },
    ],
    avoidClaims: [{ claim: "TSA lock", reason: "Unconfirmed." }],
    safeClaims: [{ claim: "PC shell", evidence: "material confirmed by user input" }],
  },
  finalListing: {
    title: {
      english: "Black PC Hard Shell Suitcase for Practical Travel Use",
      chineseExplanation: "基于黑色、PC 和旅行箱类目生成的标题。",
    },
    bulletPoints: [
      {
        english: "PC shell wording uses confirmed material without adding unsupported claims.",
        chineseExplanation: "基于已确认 PC 材质。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["material"],
      },
      {
        english: "Travel-focused copy keeps use cases clear for short trips and daily movement.",
        chineseExplanation: "保守表达旅行场景。",
        sourceBasis: "safe_inference",
        evidenceFields: ["category"],
      },
      {
        english: "Organized packing language stays general until exact interior details are confirmed.",
        chineseExplanation: "未确认内部结构时不编造。",
        sourceBasis: "safe_inference",
        evidenceFields: ["missingInfo"],
      },
      {
        english: "Buyer concern messaging avoids copying competitor wheel claims directly.",
        chineseExplanation: "竞品 claim 不直接进入文案。",
        sourceBasis: "competitor_inspired",
        evidenceFields: ["competitorInsights.buyerPainPoints"],
      },
      {
        english: "Compliance-safe language avoids unverified promises such as locks or approvals.",
        chineseExplanation: "避免未确认锁具或认证。",
        sourceBasis: "safe_inference",
        evidenceFields: ["avoidClaims"],
      },
    ],
    description: {
      english: "This practical PC suitcase listing is built from confirmed Work UP product facts and conservative travel positioning.",
      chineseExplanation: "描述基于已确认信息，不编造参数。",
    },
    searchTerms: {
      english: "black suitcase pc luggage hard shell travel suitcase",
      chineseExplanation: "后台关键词不包含竞品品牌或未确认 claim。",
    },
  },
  complianceNotes: [
    {
      riskLevel: "medium",
      claim: "spinner wheels",
      reason: "Competitor claim is unconfirmed.",
      recommendation: "Confirm wheel type before using this claim.",
    },
  ],
  missingInfo: [
    {
      field: "dimensions",
      whyItMatters: "尺寸影响标题、五点和买家是否适合随身携带。",
      example: "22 x 14 x 9 inches",
      impactArea: "title",
    },
    {
      field: "capacity",
      whyItMatters: "容量缺失时不能安全写 large capacity。",
      example: "38L",
      impactArea: "compliance",
    },
    {
      field: "weight",
      whyItMatters: "重量会影响便携性表达和配送预期。",
      example: "6.4 lbs",
      impactArea: "bulletPoints",
    },
    {
      field: "wheelType",
      whyItMatters: "轮子类型会影响移动体验，是行李箱买家重点关注点。",
      example: "360° silent spinner wheels",
      impactArea: "bulletPoints",
    },
    {
      field: "handleMaterial",
      whyItMatters: "拉杆材质决定耐用性和使用体验表达。",
      example: "aluminum telescopic handle",
      impactArea: "bulletPoints",
    },
    {
      field: "lockType",
      whyItMatters: "锁具类型影响安全感，但 TSA lock 需要明确证明。",
      example: "TSA lock",
      impactArea: "compliance",
    },
    {
      field: "carryOnConfirmation",
      whyItMatters: "登机兼容性不能不加证明就写成所有航空公司通用。",
      example: "fits most airline carry-on guidance",
      impactArea: "compliance",
    },
  ],
  assumptions: [
    {
      assumption: "The suitcase is for general travel use.",
      reason: "Category is Travel & Luggage.",
      confidence: "medium",
      shouldVerifyWithUser: true,
    },
  ],
  improvementSuggestions: [
    {
      priority: "high",
      suggestion: "补充尺寸、轮子和锁具信息。",
      reason: "这些信息影响 Bullet 和合规边界。",
      expectedImpact: "bulletPoints",
    },
  ],
  analysis: {
    productSummary: "行李箱，PC 材质，旅行类目。",
    strategySummary: "使用保守关键词和卖点排序。",
    competitorSummary: "竞品信息用于机会发现，不直接复制。",
    complianceSummary: "避免未确认的 TSA lock、spinner wheels 等 claim。",
    beginnerExplanation: "资料越完整，Listing 越接近真实运营表达。",
  },
};

const highInfoGenerationResult = {
  ...workUpGenerationResult,
  qualityScore: {
    ...workUpGenerationResult.qualityScore,
    overall: 88,
    level: "strong",
    summary: "资料完整，已可生成接近正式上架的登机箱 Listing。",
  },
  productBrief: {
    ...workUpGenerationResult.productBrief,
    product: {
      ...workUpGenerationResult.productBrief.product,
      nameCn: "20寸登机行李箱",
      category: "Travel & Luggage / Carry-On Luggage",
      targetCustomer: "Business travelers, students, weekend travelers",
    },
    confirmedFacts: [
      { field: "productNameCn", value: "20寸登机行李箱", source: "user_input", confidence: "high" },
      { field: "marketplace", value: "US", source: "user_input", confidence: "high" },
      { field: "category", value: "Travel & Luggage / Carry-On Luggage", source: "user_input", confidence: "high" },
      { field: "material", value: "ABS + PC composite hardshell", source: "user_input", confidence: "high" },
      { field: "color", value: "black", source: "user_input", confidence: "high" },
      { field: "dimensions", value: "22 x 14 x 9 inches", source: "user_input", confidence: "high" },
      { field: "capacity", value: "38L", source: "user_input", confidence: "high" },
      { field: "weight", value: "6.4 lbs", source: "user_input", confidence: "high" },
      { field: "wheelType", value: "360° quiet spinner wheels", source: "user_input", confidence: "high" },
      { field: "lockType", value: "TSA lock", source: "user_input", confidence: "high" },
    ],
    missingInfo: [
      {
        field: "brand",
        whyItMatters: "品牌会影响标题、品牌归属和 Amazon 后台基础信息。",
        example: "Registered brand or private label name",
        impactArea: "title",
      },
    ],
  },
  competitorInsights: {
    ...workUpGenerationResult.competitorInsights,
    buyerPainPoints: ["wheel noise", "wobbly handle", "unclear capacity", "easy scratches"],
    competitorAngles: ["carry-on sizing", "quiet spinner wheels", "organized interior"],
  },
  finalListing: {
    title: {
      english:
        "20 Inch Carry On Luggage with TSA Lock, 38L ABS+PC Hardshell Suitcase with Silent Spinner Wheels, Black",
      chineseExplanation: "标题覆盖尺寸、容量、材质、TSA 锁、万向轮和颜色，接近 Amazon 标题结构。",
    },
    bulletPoints: [
      {
        english:
          "Carry-on size with 22 x 14 x 9 inch dimensions and 38L capacity supports short business trips, school travel, and weekend packing.",
        chineseExplanation: "第一条覆盖尺寸、容量和使用场景。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["dimensions", "capacity", "targetCustomer"],
      },
      {
        english:
          "ABS+PC composite hardshell balances lightweight 6.4 lb handling with everyday impact resistance for travel use.",
        chineseExplanation: "第二条覆盖材质、重量和抗冲击，但不写防摔或 100% 防刮。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["material", "weight", "prohibited_claims"],
      },
      {
        english:
          "360° quiet spinner wheels help the suitcase move smoothly through airports, campus paths, hotels, and transit stations.",
        chineseExplanation: "第三条覆盖静音万向轮和竞品痛点中的轮子噪音。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["wheelType", "review_pain_points"],
      },
      {
        english:
          "Built-in TSA lock adds travel security while keeping wording limited to the confirmed lock feature.",
        chineseExplanation: "第四条覆盖 TSA 锁，避免夸大安全承诺。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["lockType"],
      },
      {
        english:
          "Interior organization helps separate clothing, accessories, and daily essentials so packing stays clear for short trips.",
        chineseExplanation: "第五条覆盖内部分区和收纳便利。",
        sourceBasis: "confirmed_fact",
        evidenceFields: ["core_features"],
      },
    ],
    description: {
      english:
        "Designed for practical carry-on travel, this 20 inch black suitcase combines a 38L packing space, ABS+PC hardshell construction, quiet spinner movement, and a built-in TSA lock. It is positioned for business travelers, students, and weekend trips without relying on unverified universal airline approval or impossible scratch-proof claims.",
      chineseExplanation: "描述串联产品定位和使用人群，不只是重复五点，并明确避开未确认 claim。",
    },
    searchTerms: {
      english:
        "20 inch carry on luggage black hardshell suitcase tsa lock spinner wheels 38l travel suitcase abs pc cabin luggage",
      chineseExplanation: "后台关键词像 Amazon Search Terms，避免标点、竞品品牌和夸大 claim。",
    },
  },
  complianceNotes: [
    {
      riskLevel: "medium",
      claim: "符合多数航空公司登机尺寸",
      reason: "不同航空公司规则不同，应避免写成所有航空公司通用。",
      recommendation: "Use softer wording such as fits most common carry-on size guidance.",
    },
    {
      riskLevel: "high",
      claim: "防摔 / 100% 防刮",
      reason: "这些绝对化性能 claim 需要测试证明，且用户明确要求不要夸大。",
      recommendation: "Use everyday impact resistance and avoid scratch-proof guarantees.",
    },
  ],
  missingInfo: [
    {
      field: "brand",
      whyItMatters: "品牌会影响标题前缀、品牌归属和后台字段。",
      example: "Registered brand or seller private label",
      impactArea: "title",
    },
  ],
  assumptions: [
    {
      assumption: "Carry-on wording should stay qualified as common or most airline guidance.",
      reason: "The input gives dimensions but not a specific airline policy.",
      confidence: "high",
      shouldVerifyWithUser: true,
    },
  ],
  improvementSuggestions: [
    {
      priority: "high",
      suggestion: "补充品牌名和图片中的尺寸标注。",
      reason: "标题、主图和尺寸图可以互相支撑 carry-on 认知。",
      expectedImpact: "title",
    },
    {
      priority: "high",
      suggestion: "补充轮子和拉杆的实拍/视频证据。",
      reason: "这能支撑静音顺滑移动和拉杆稳定性的转化表达。",
      expectedImpact: "conversion",
    },
    {
      priority: "medium",
      suggestion: "准备 TSA 锁和材质说明的供应商证明。",
      reason: "锁具、材质和抗冲击表达需要可追溯证据。",
      expectedImpact: "compliance",
    },
  ],
  analysis: {
    productSummary: "20寸黑色 ABS+PC 登机箱，含 38L 容量、6.4 lbs 重量、TSA 锁和静音万向轮。",
    strategySummary: "标题和五点围绕尺寸容量、材质重量、移动体验、安全锁和收纳组织展开。",
    competitorSummary: "竞品痛点集中在轮子噪音、拉杆晃动、容量不清和外壳刮花。",
    complianceSummary: "避免所有航空公司通用、防摔、100% 防刮等绝对化表达。",
    beginnerExplanation: "高信息输入已经能生成更接近 Amazon 的 Listing，但正式上架前仍需品牌和证明资料。",
  },
};

const lowInfoProject = {
  product_name_cn: "行李箱",
  product_name_en: "",
  marketplace: "US",
  category: "Travel & Luggage / Carry-On Luggage",
  target_price: "",
  target_customer: "",
  form_data: {
    product_name_cn: "行李箱",
    product_name_en: null,
    marketplace: "US",
    category: "Travel & Luggage / Carry-On Luggage",
    material: "ABS",
    color: "黑色",
    use_cases: "机场、学校、短途旅行",
    english_style: "localized",
    language: "English",
    needs_chinese_explanation: true,
    needs_image_suggestions: true,
  },
  status: "Draft",
};

const minimalRequiredProject = {
  product_name_cn: "行李箱",
  product_name_en: "",
  marketplace: "US",
  category: "Travel & Luggage",
  target_price: "",
  target_customer: "",
  form_data: {
    product_name_cn: "行李箱",
    marketplace: "US",
    category: "Travel & Luggage",
  },
  status: "Draft",
};

const highInfoProject = {
  product_name_cn: "20寸登机行李箱",
  product_name_en: "",
  marketplace: "US",
  category: "Travel & Luggage / Carry-On Luggage",
  target_price: "",
  target_customer: "商务出差、短途旅行、学生、周末旅行",
  form_data: {
    product_name_cn: "20寸登机行李箱",
    product_name_en: null,
    marketplace: "US",
    category: "Travel & Luggage / Carry-On Luggage",
    material: "ABS + PC 复合硬壳",
    color: "黑色",
    dimensions: "22 x 14 x 9 inches",
    capacity: "38L",
    weight: "6.4 lbs",
    use_cases: "商务出差、短途旅行、学生、周末旅行",
    core_features:
      "360° 静音万向轮；三段式铝合金拉杆；TSA 海关锁；内部分区方便收纳；轻量但抗冲击",
    review_pain_points: "普通行李箱轮子噪音大；拉杆晃动；外壳容易刮花；容量描述不清楚",
    differentiation: "符合多数航空公司登机尺寸；轻量但抗冲击；静音顺滑移动；TSA 锁提升出行安全",
    prohibited_claims: "不要夸大防摔、100%防刮、所有航空公司通用",
    english_style: "localized",
    language: "English",
    needs_chinese_explanation: true,
    needs_image_suggestions: true,
  },
  status: "Draft",
};

function captureProjectInsertRequests(page, target) {
  page.on("request", (request) => {
    if (!request.url().includes("/rest/v1/product_projects") || request.method() !== "POST") {
      return;
    }

    try {
      target.push(request.postDataJSON());
    } catch {
      const body = request.postData();

      if (body) {
        target.push(JSON.parse(body));
      }
    }
  });
}

async function mockGenerationRoute(page, result, requests = []) {
  await page.route("**/api/generate-listing", async (route) => {
    requests.push({
      url: route.request().url(),
      body: route.request().postDataJSON(),
      authorization: route.request().headers().authorization || "",
    });

    await route.fulfill({
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: true,
        source: "deepseek",
        model: "e2e-mock-model",
        result,
        inputSnapshot: {
          schemaVersion: "workup.v1",
          productBrief: result.productBrief,
          competitorInsights: result.competitorInsights,
          listingStrategy: result.listingStrategy,
        },
      }),
    });
  });
}

test.describe("listing creation and generation flow", () => {
  test("low-info seller flow saves, generates, copies, regenerates, and saves result", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const generationRequests = [];
    const savedGenerationRows = [];
    const savedProjectRows = [];

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("clipboard permission denied");
          },
        },
      });

      document.execCommand = (command) => command === "copy";
    });
    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page, {
      project: lowInfoProject,
      onGenerationInsert: (body) => savedGenerationRows.push(body),
    });
    await mockGenerationRoute(page, workUpGenerationResult, generationRequests);

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await expect(page.getByRole("heading", { name: "创建 Amazon Listing 项目" })).toBeVisible();
    await expect(page.getByText("步骤 1 / 4")).toBeVisible();
    await expect(page.getByText("仅 Amazon")).toBeVisible();
    await expect(page.getByLabel("产品中文名称")).toHaveValue("");
    await expect(page.getByLabel("产品英文名称")).toHaveValue("");
    await expect(page.getByLabel("Amazon 站点")).toHaveValue("");
    await expect(page.getByLabel("产品类目")).toHaveValue("");
    await expect(page.getByLabel("目标售价")).toHaveValue("");
    await expect(page.getByLabel("目标用户")).toHaveValue("");
    await expect(page.getByText("便携式折叠收纳篮")).toHaveCount(0);
    await expect(page.getByText("Collapsible Storage Basket")).toHaveCount(0);
    await expect(page.getByText("Home & Kitchen")).toHaveCount(0);
    await expect(page.getByText("$19.99")).toHaveCount(0);

    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByLabel("Amazon 站点").selectOption("US");
    await page.getByLabel("产品类目").fill("Travel & Luggage / Carry-On Luggage");
    await expect(generationRequests).toHaveLength(0);

    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("步骤 2 / 4")).toBeVisible();
    await page.getByLabel("颜色").fill("黑色");
    await page.getByLabel("材质").fill("ABS");
    await page.getByLabel("使用场景").fill("机场、学校、短途旅行");
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("步骤 3 / 4")).toBeVisible();
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("步骤 4 / 4")).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const draftSubmit = page.getByTestId("listing-draft-submit");
    await expect(draftSubmit).toBeVisible();
    await draftSubmit.click();
    await expect(page).toHaveURL(/\/projects\/e2e-project\/result/);
    expect(savedProjectRows).toHaveLength(1);
    expect(savedProjectRows[0].product_name_cn).toBe("行李箱");
    expect(savedProjectRows[0].marketplace).toBe("US");
    expect(savedProjectRows[0].category).toBe("Travel & Luggage / Carry-On Luggage");
    expect(savedProjectRows[0].form_data.product_name_cn).toBe("行李箱");
    expect(savedProjectRows[0].form_data.marketplace).toBe("US");
    expect(savedProjectRows[0].form_data.category).toBe("Travel & Luggage / Carry-On Luggage");
    expect(savedProjectRows[0].form_data.color).toBe("黑色");
    expect(savedProjectRows[0].form_data.material).toBe("ABS");
    expect(savedProjectRows[0].form_data.use_cases).toBe("机场、学校、短途旅行");
    expect(savedProjectRows[0].form_data.english_style).toBe("localized");
    expect(savedProjectRows[0].form_data.language).toBe("English");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("便携式折叠收纳篮");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("Collapsible Storage Basket");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("Home & Kitchen");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("$19.99");
    await expect(page.getByRole("heading", { name: "Work UP Listing 结果" })).toBeVisible();
    await expect(page.getByText("当前项目：")).toBeVisible();
    await expect(page.getByText("行李箱").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "立即生成 Listing" })).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const generationResponse = page.waitForResponse("**/api/generate-listing");
    await expect(page.getByTestId("regenerate-listing-button")).toBeEnabled();
    await page.getByTestId("regenerate-listing-button").click();
    await generationResponse;
    await expect(page.getByText("DeepSeek 已生成", { exact: true })).toBeVisible();
    expect(generationRequests).toHaveLength(1);
    expect(generationRequests[0].body.projectId).toBe("e2e-project");
    expect(generationRequests[0].body.projectData.marketplace).toBe("US");
    expect(generationRequests[0].body.projectData.category).toBe("Travel & Luggage / Carry-On Luggage");
    expect(generationRequests[0].body.projectData.form_data.material).toBe("ABS");
    expect(generationRequests[0].authorization).toMatch(/^Bearer\s+e2e-access-token/);
    expect(JSON.stringify(generationRequests[0].body)).toContain("行李箱");
    await expect(page.getByRole("heading", { name: "最终亚马逊 Listing / Final Amazon Listing" })).toBeVisible();
    await expect(page.locator("#title").getByText("亚马逊标题 / Amazon Title")).toBeVisible();
    await expect(page.locator("#bullets").getByText("五点描述 / Bullet Points").first()).toBeVisible();
    await expect(page.locator("#description").getByText("产品描述 / Product Description")).toBeVisible();
    await expect(page.locator("#search-terms").getByText("搜索关键词 / Search Terms")).toBeVisible();
    await expect(page.locator("#final-listing")).toContainText("中文翻译");
    await expect(page.locator("#final-listing")).not.toContainText("Chinese Explanation");
    await expect(page.getByRole("button", { name: "复制完整 Listing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "复制标题" })).toBeVisible();
    await expect(page.getByRole("button", { name: "复制五点" })).toBeVisible();
    await expect(page.getByRole("button", { name: "复制描述" })).toBeVisible();
    await expect(page.getByRole("button", { name: "复制关键词" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Listing 质量与策略 / Listing Quality & Strategy" })).toBeVisible();
    await expect(page.locator("#quality-strategy")).toContainText("卖点排序 / Selling Point Order");
    await expect(page.locator("#quality-strategy")).toContainText("英文原文");
    await expect(page.locator("#quality-strategy")).toContainText("中文翻译");
    await expect(page.locator("#quality-strategy")).toContainText("PC 外壳文案：使用已确认材质，不添加未经支持的声明。");
    await expect(page.locator("#quality-strategy")).toContainText("避免使用的声明 / Avoid Claims");
    await expect(page.locator("#quality-strategy")).toContainText("TSA 锁");
    await expect(page.locator("#quality-strategy")).toContainText("未确认。");
    await expect(page.locator("#quality-strategy")).toContainText("安全可用声明 / Safe Claims");
    await expect(page.locator("#quality-strategy")).toContainText("PC 外壳");
    await expect(page.getByRole("heading", { name: "Missing Info" })).toBeVisible();
    await expect(page.locator("#missing-info")).toContainText("英文原文");
    await expect(page.locator("#missing-info")).toContainText("中文翻译");
    await expect(page.locator("#missing-info")).toContainText("重量 / weight");
    await expect(page.locator("#missing-info")).toContainText("为什么重要 / Why It Matters");
    await expect(page.locator("#missing-info")).toContainText("五点描述 / bulletPoints");
    await expect(page.getByRole("heading", { name: "合规提醒 / Compliance Notes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "专家建议与分析 / Expert Suggestions / Analysis" })).toBeVisible();
    await expect(page.locator("#expert-analysis")).toContainText("优化建议 / Improvement Suggestions");
    await expect(page.locator("#expert-analysis")).toContainText("英文原文");
    await expect(page.locator("#expert-analysis")).toContainText("中文翻译");
    await expect(page.locator("#expert-analysis")).toContainText("产品总结 / Product Summary");
    await expect(page.locator("#expert-analysis")).toContainText("high: 补充尺寸、轮子和锁具信息。");
    await expect(page.locator("#expert-analysis")).toContainText("高优先级");
    await expect(page.locator("#expert-analysis")).toContainText("五点描述");
    await expect(page.getByText("Black PC Hard Shell Suitcase for Practical Travel Use")).toBeVisible();
    await expect(page.getByTestId("final-listing-bullet")).toHaveCount(5);
    await expect(page.getByText("搜索关键词 / Search Terms").first()).toBeVisible();
    await expect(page.getByText("dimensions")).toBeVisible();
    await expect(page.getByText("Improvement Suggestions")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\bundefined\b/i);
    await expect(page.locator("body")).not.toContainText(/\bnull\b/i);
    await expect(page.locator("body")).not.toContainText(/\bNaN\b/i);
    await page.getByRole("button", { name: "复制完整 Listing" }).click();
    await expect(page.getByRole("button", { name: "已复制" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("复制失败");
    await page.evaluate(() => {
      document.execCommand = () => false;
    });
    await page.getByRole("button", { name: "复制标题" }).click();
    await expect(page.getByRole("button", { name: "请按 Ctrl+C" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("复制失败");
    await expect(page.locator("#title")).toBeVisible();
    await expect(page.locator("#bullets")).toBeVisible();
    await expect(page.locator("#description")).toBeVisible();
    await expect(page.locator("#search-terms")).toBeVisible();
    const titleBox = await page.locator("#title").boundingBox();
    const bulletsBox = await page.locator("#bullets").boundingBox();
    const descriptionBox = await page.locator("#description").boundingBox();
    const searchTermsBox = await page.locator("#search-terms").boundingBox();
    const analysisBox = await page.locator("#quality-strategy").boundingBox();
    expect(titleBox?.y ?? 0).toBeLessThan(analysisBox?.y ?? Number.POSITIVE_INFINITY);
    expect(bulletsBox?.y ?? 0).toBeLessThan(analysisBox?.y ?? Number.POSITIVE_INFINITY);
    expect(descriptionBox?.y ?? 0).toBeLessThan(analysisBox?.y ?? Number.POSITIVE_INFINITY);
    expect(searchTermsBox?.y ?? 0).toBeLessThan(analysisBox?.y ?? Number.POSITIVE_INFINITY);
    await expect(page.getByText("便携式折叠收纳篮")).toHaveCount(0);
    await expect(page.getByText("Collapsible Storage Basket")).toHaveCount(0);
    await expect.poll(() => savedGenerationRows.length).toBe(1);
    expect(JSON.stringify(savedGenerationRows)).toContain("Black PC Hard Shell Suitcase");
    expect(JSON.stringify(savedGenerationRows)).not.toContain("便携式折叠收纳篮");

    const secondGenerationResponse = page.waitForResponse("**/api/generate-listing");
    await page.getByTestId("regenerate-listing-button").click();
    await secondGenerationResponse;
    expect(generationRequests).toHaveLength(2);
    await expect(page.getByRole("heading", { name: "最终亚马逊 Listing / Final Amazon Listing" })).toBeVisible();

    await page.getByRole("button", { name: "保存结果" }).click();
    await expect.poll(() => savedGenerationRows.length).toBeGreaterThanOrEqual(2);
  });

  test("optional product fields and competitor inputs are saved into draft form_data only", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const savedProjectRows = [];

    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page);

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByLabel("Amazon 站点").selectOption("US");
    await page.getByLabel("产品类目").fill("Travel & Luggage");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("颜色").fill("黑色");
    await page.getByLabel("材质").fill("ABS");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("竞品标题").fill("Carry On Luggage with Spinner Wheels");
    await page.getByLabel("竞品五点").fill("TSA Lock and expandable design");
    await page.getByLabel("评论痛点").fill("zipper issue");
    await page.getByLabel("我方差异化").fill("黑色 ABS 箱体，适合基础旅行需求。");
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-draft-submit").click();

    await expect(page).toHaveURL(/\/projects\/e2e-project\/result/);
    expect(savedProjectRows).toHaveLength(1);
    expect(savedProjectRows[0].form_data.color).toBe("黑色");
    expect(savedProjectRows[0].form_data.material).toBe("ABS");
    expect(savedProjectRows[0].form_data.competitor_title).toBe(
      "Carry On Luggage with Spinner Wheels",
    );
    expect(savedProjectRows[0].form_data.competitor_selling_points).toBe(
      "TSA Lock and expandable design",
    );
    expect(savedProjectRows[0].form_data.review_pain_points).toBe("zipper issue");
    expect(savedProjectRows[0].form_data.differentiation).toBe(
      "黑色 ABS 箱体，适合基础旅行需求。",
    );
    expect(savedProjectRows[0].form_data.productBrief).toBeUndefined();
    expect(savedProjectRows[0].form_data.listingStrategy).toBeUndefined();
    expect(savedProjectRows[0].form_data.generationResult).toBeUndefined();
  });

  test("step 1 validation blocks missing required fields before advancing", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const savedProjectRows = [];

    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page);

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await expect(page.getByText("步骤 1 / 4")).toBeVisible();
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("请先补全当前步骤的必填项。")).toBeVisible();
    await expect(page.getByText("产品中文名称不能为空。")).toBeVisible();
    await expect(page.getByText("Amazon 站点不能为空。")).toBeVisible();
    await expect(page.getByText("产品类目不能为空。")).toBeVisible();
    await expect(page.getByText("步骤 1 / 4")).toBeVisible();
    expect(savedProjectRows).toHaveLength(0);

    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Amazon 站点不能为空。")).toBeVisible();
    await expect(page.getByText("步骤 1 / 4")).toBeVisible();
    expect(savedProjectRows).toHaveLength(0);
  });

  test("save failure does not jump to result and keeps form state", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const savedProjectRows = [];

    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page, {
      project: lowInfoProject,
    });
    await page.route("**/rest/v1/product_projects**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: "Amazon 站点不能为空",
            hint: "save failed intentionally",
          }),
        });
        return;
      }

      await route.fallback();
    });

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByLabel("Amazon 站点").selectOption("US");
    await page.getByLabel("产品类目").fill("Travel & Luggage / Carry-On Luggage");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("颜色").fill("黑色");
    await page.getByLabel("材质").fill("ABS");
    await page.getByLabel("使用场景").fill("机场、学校、短途旅行");
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-draft-submit").click();
    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(page.getByText("保存失败")).toBeVisible();
    expect(savedProjectRows.length).toBeGreaterThan(0);
  });

  test("high-info seller flow produces an Amazon-style listing and saves result", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const generationRequests = [];
    const savedGenerationRows = [];
    const savedProjectRows = [];

    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page, {
      project: highInfoProject,
      onGenerationInsert: (body) => savedGenerationRows.push(body),
    });
    await mockGenerationRoute(page, highInfoGenerationResult, generationRequests);

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await page.getByLabel("产品中文名称").fill("20寸登机行李箱");
    await page.getByLabel("Amazon 站点").selectOption("US");
    await page.getByLabel("产品类目").fill("Travel & Luggage / Carry-On Luggage");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("颜色").fill("黑色");
    await page.getByLabel("材质").fill("ABS + PC 复合硬壳");
    await page.getByLabel("尺寸").fill("22 x 14 x 9 inches");
    await page.getByLabel("尺码 / 规格").fill("20寸");
    await page.getByLabel("重量").fill("6.4 lbs");
    await page.getByLabel("容量").fill("38L");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("竞品标题").fill("Carry On Luggage with Spinner Wheels");
    await page.getByLabel("竞品五点").fill("Noise, handle wobble, unclear capacity, scratches");
    await page.getByLabel("评论痛点").fill("轮子噪音大、拉杆晃动、容量描述不清楚");
    await page.getByLabel("我方差异化").fill("静音顺滑移动、TSA 锁、内部分区方便收纳");
    await page.getByTestId("listing-next-step").click();
    await page.getByLabel("英文风格").selectOption("localized");
    await page.getByTestId("listing-draft-submit").click();

    await expect(page).toHaveURL(/\/projects\/e2e-project\/result/);
    await expect(page.getByRole("heading", { name: "Work UP Listing 结果" })).toBeVisible();
    await expect(page.getByText("20寸登机行李箱").first()).toBeVisible();
    const firstResponse = page.waitForResponse("**/api/generate-listing");
    await page.getByTestId("regenerate-listing-button").click();
    await firstResponse;
    await expect(page.getByText("DeepSeek 已生成", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "最终亚马逊 Listing / Final Amazon Listing" })).toBeVisible();
    await expect(page.getByText(/22 x 14 x 9 inch/i)).toBeVisible();
    await expect(page.locator("#bullets")).toContainText("38L");
    await expect(page.locator("#bullets")).toContainText("TSA lock");
    await expect(page.getByTestId("final-listing-bullet")).toHaveCount(5);
    await expect(page.getByText("搜索关键词 / Search Terms")).toBeVisible();
    await expect(page.getByRole("heading", { name: "缺失信息 / Missing Info" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "专家建议与分析 / Expert Suggestions / Analysis" })).toBeVisible();
    await expect(page.getByText("Compliance Notes")).toBeVisible();
    await expect(page.getByText("防摔 / 100% 防刮")).toBeVisible();
    await page.getByRole("button", { name: "复制英文 Listing" }).click();
    await expect(page.locator("body")).not.toContainText("复制失败");
    await expect(page.locator("body")).not.toContainText(/\bundefined\b/i);
    await expect(page.locator("body")).not.toContainText(/\bnull\b/i);
    await expect(page.locator("body")).not.toContainText(/\bNaN\b/i);
    expect(generationRequests).toHaveLength(1);
    expect(savedProjectRows).toHaveLength(1);
    expect(savedGenerationRows.length).toBe(1);
    expect(generationRequests[0].body.projectData.marketplace).toBe("US");
    expect(generationRequests[0].body.projectData.form_data.capacity).toBe("38L");

    const secondResponse = page.waitForResponse("**/api/generate-listing");
    await page.getByTestId("regenerate-listing-button").click();
    await secondResponse;
    expect(generationRequests).toHaveLength(2);

    await page.getByRole("button", { name: "保存结果" }).click();
    await expect.poll(() => savedGenerationRows.length).toBeGreaterThanOrEqual(2);
  });

  test("result page blocks generation when marketplace is missing", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const generationRequests = [];

    await mockSupabaseProjectApi(page, {
      project: {
        ...lowInfoProject,
        marketplace: "",
        form_data: {
          ...lowInfoProject.form_data,
          marketplace: "",
        },
      },
    });
    await mockGenerationRoute(page, highInfoGenerationResult, generationRequests);

    await signInWithMockSession(page);
    await page.goto("/projects/e2e-project/result");
    await expect(page.getByText("尚未生成 Listing，请点击重新生成。")).toBeVisible();
    await page.getByTestId("regenerate-listing-button").click();
    await expect(page.getByText("生成前缺少必填信息：Amazon 站点。请补齐后再重新生成。")).toBeVisible();
    expect(generationRequests).toHaveLength(0);
  });

  test("minimal required project can generate without optional product facts", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const generationRequests = [];

    await mockSupabaseProjectApi(page, {
      project: minimalRequiredProject,
    });
    await mockGenerationRoute(page, workUpGenerationResult, generationRequests);

    await signInWithMockSession(page);
    await page.goto("/projects/e2e-project/result");
    await expect(page.getByText("尚未生成 Listing，请点击重新生成。")).toBeVisible();

    const generationResponse = page.waitForResponse("**/api/generate-listing");
    await page.getByTestId("regenerate-listing-button").click();
    await generationResponse;

    expect(generationRequests).toHaveLength(1);
    expect(generationRequests[0].body.projectData.product_name_cn).toBe("行李箱");
    expect(generationRequests[0].body.projectData.marketplace).toBe("US");
    expect(generationRequests[0].body.projectData.category).toBe("Travel & Luggage");
    await expect(page.getByText("DeepSeek 已生成", { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("生成前缺少必填信息");
  });

  test("old mock generation response is not displayed as a successful Work UP result", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const savedGenerationRows = [];

    await mockSupabaseProjectApi(page, {
      onGenerationInsert: (body) => savedGenerationRows.push(body),
    });
    await page.route("**/api/generate-listing", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: true,
          source: "deepseek",
          model: "e2e-mock-model",
          result: mockListingResult,
        }),
      });
    });

    await signInWithMockSession(page);
    await page.goto("/projects/e2e-project/result");
    await page.getByTestId("regenerate-listing-button").click();
    await expect(
      page.getByRole("heading", {
        name: "请重新生成新版 Listing",
      }),
    ).toBeVisible();
    await expect(page.getByText("这个结果来自旧版结构，无法按 Work UP 新版 Listing 格式展示。")).toBeVisible();
    await expect(page.getByText("Final Amazon Listing")).toHaveCount(0);
    await expect(page.getByText("Lightweight Carry-On Suitcase for Weekend Trips and Business Travel")).toHaveCount(0);
    expect(savedGenerationRows).toHaveLength(0);
  });

  test("generation failure displays a visible error and leaves loading state", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    await mockSupabaseProjectApi(page);
    await page.route("**/api/generate-listing", async (route) => {
      await route.fulfill({
        status: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "E2E mocked generation failure" }),
      });
    });

    await signInWithMockSession(page);
    await page.goto("/projects/e2e-project/result");
    await page.getByTestId("regenerate-listing-button").click();
    await expect(page.getByText("生成失败：E2E mocked generation failure")).toBeVisible();
    await expect(page.getByText("已先显示本地 mock 结果")).toHaveCount(0);
    await expect(page.getByText("便携式折叠收纳篮")).toHaveCount(0);
    await expect(page.getByTestId("regenerate-listing-button")).toBeEnabled();
  });
});
