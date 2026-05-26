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
    sellingPointOrder: [1, 2, 3, 4, 5].map((rank) => ({
      rank,
      sellingPoint: `Selling point ${rank}`,
      reason: "Follow Work UP conservative strategy.",
      evidenceFields: ["confirmedFacts"],
    })),
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
      field: "size",
      whyItMatters: "尺寸影响标题和购买判断。",
      example: "20 inch carry-on",
      impactArea: "title",
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

test.describe("listing creation and generation flow", () => {
  test("generation API is called only from the result flow and is mocked in E2E", async ({
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
      onGenerationInsert: (body) => savedGenerationRows.push(body),
    });
    await page.route("**/api/generate-listing", async (route) => {
      generationRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: true,
          source: "deepseek",
          model: "e2e-mock-model",
          result: workUpGenerationResult,
          inputSnapshot: {
            schemaVersion: "workup.v1",
            productBrief: workUpGenerationResult.productBrief,
            competitorInsights: workUpGenerationResult.competitorInsights,
            listingStrategy: workUpGenerationResult.listingStrategy,
          },
        }),
      });
    });

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await expect(page.getByRole("heading", { name: "创建 Amazon Listing 项目" })).toBeVisible();
    await expect(page.getByText("Step 1 / 4")).toBeVisible();
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
    await page.getByLabel("产品类目").fill("Travel & Luggage");
    await expect(generationRequests).toHaveLength(0);

    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 2 / 4")).toBeVisible();
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 3 / 4")).toBeVisible();
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 4 / 4")).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const draftSubmit = page.getByTestId("listing-draft-submit");
    await expect(draftSubmit).toBeVisible();
    await draftSubmit.click();
    await expect(page).toHaveURL(/\/projects\/e2e-project\/result/);
    expect(savedProjectRows).toHaveLength(1);
    expect(savedProjectRows[0].product_name_cn).toBe("行李箱");
    expect(savedProjectRows[0].marketplace).toBe("US");
    expect(savedProjectRows[0].category).toBe("Travel & Luggage");
    expect(savedProjectRows[0].form_data.product_name_cn).toBe("行李箱");
    expect(savedProjectRows[0].form_data.marketplace).toBe("US");
    expect(savedProjectRows[0].form_data.category).toBe("Travel & Luggage");
    expect(savedProjectRows[0].form_data.color).toBeNull();
    expect(savedProjectRows[0].form_data.material).toBeNull();
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("便携式折叠收纳篮");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("Collapsible Storage Basket");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("Home & Kitchen");
    expect(JSON.stringify(savedProjectRows[0])).not.toContain("$19.99");
    await expect(page.getByRole("heading", { name: "Work UP Listing Result" })).toBeVisible();
    await expect(page.getByText("当前项目：")).toBeVisible();
    await expect(page.getByText("行李箱").first()).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const generationResponse = page.waitForResponse("**/api/generate-listing");
    await expect(page.getByTestId("regenerate-listing-button")).toBeEnabled();
    await page.getByTestId("regenerate-listing-button").click();
    await generationResponse;
    await expect(page.getByText("DeepSeek generated", { exact: true })).toBeVisible();
    expect(generationRequests).toHaveLength(1);
    expect(generationRequests[0].body.projectId).toBe("e2e-project");
    expect(JSON.stringify(generationRequests[0].body)).toContain("行李箱");
    await expect(page.getByRole("heading", { name: "Final Amazon Listing" })).toBeVisible();
    await expect(page.locator("#title").getByText("Amazon Title")).toBeVisible();
    await expect(page.locator("#bullets").getByText("Bullet Points").first()).toBeVisible();
    await expect(page.locator("#description").getByText("Product Description")).toBeVisible();
    await expect(page.locator("#search-terms").getByText("Search Terms", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Listing Quality & Strategy" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Missing Info" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compliance Notes" })).toBeVisible();
    await expect(page.getByText("Black PC Hard Shell Suitcase for Practical Travel Use")).toBeVisible();
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

  test("missing required fields show validation errors and do not save draft", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const savedProjectRows = [];

    captureProjectInsertRequests(page, savedProjectRows);
    await mockSupabaseProjectApi(page);

    async function submitDraftFromNewPage() {
      await page.goto("/projects/new");
      await page.getByTestId("listing-next-step").click();
      await page.getByTestId("listing-next-step").click();
      await page.getByTestId("listing-next-step").click();
      await page.getByTestId("listing-draft-submit").click();
    }

    await signInWithMockSession(page);

    await submitDraftFromNewPage();
    await expect(page.getByText("保存失败：产品中文名称不能为空")).toBeVisible();

    await page.goto("/projects/new");
    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-draft-submit").click();
    await expect(page.getByText("保存失败：Amazon 站点不能为空")).toBeVisible();

    await page.goto("/projects/new");
    await page.getByLabel("产品中文名称").fill("行李箱");
    await page.getByLabel("Amazon 站点").selectOption("US");
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-next-step").click();
    await page.getByTestId("listing-draft-submit").click();
    await expect(page.getByText("保存失败：产品类目不能为空")).toBeVisible();
    expect(savedProjectRows).toHaveLength(0);
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
        name: "这是旧版本生成结果，请重新生成以获得 Work UP 新版 Listing。",
      }),
    ).toBeVisible();
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
