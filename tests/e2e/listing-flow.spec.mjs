import { expect, test } from "@playwright/test";
import {
  getHealth,
  hasSupabaseEnv,
  mockListingResult,
  mockSupabaseProjectApi,
  signInWithMockSession,
} from "./helpers.mjs";

test.describe("listing creation and generation flow", () => {
  test("generation API is called only from the result flow and is mocked in E2E", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the authenticated listing flow.");

    const generationRequests = [];

    await mockSupabaseProjectApi(page);
    await page.route("**/api/generate-listing", async (route) => {
      generationRequests.push({
        url: route.request().url(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "deepseek",
          model: "e2e-mock-model",
          result: mockListingResult,
        }),
      });
    });

    await signInWithMockSession(page);
    await page.goto("/projects/new");
    await expect(page.getByRole("heading", { name: "创建 Amazon Listing 项目" })).toBeVisible();
    await expect(page.getByText("Step 1 / 4")).toBeVisible();

    await page.getByLabel("产品中文名称").fill("E2E 收纳篮");
    await page.getByLabel("产品类目").fill("Home & Kitchen");
    await expect(generationRequests).toHaveLength(0);

    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 2 / 4")).toBeVisible();
    await page.getByLabel("材质").fill("PP");
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 3 / 4")).toBeVisible();
    await page.getByLabel("自己想突出的差异化").fill("折叠后更薄，适合宿舍和车载场景。");
    await page.getByTestId("listing-next-step").click();
    await expect(page.getByText("Step 4 / 4")).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const draftSubmit = page.getByTestId("listing-draft-submit");
    await expect(draftSubmit).toBeVisible();
    await draftSubmit.click();
    await expect(page).toHaveURL(/\/projects\/e2e-project\/result/);
    await expect(page.getByRole("heading", { name: "AI Listing 交付结果" })).toBeVisible();
    await expect(page.getByText("当前生成使用真实项目资料")).toBeVisible();
    await expect(generationRequests).toHaveLength(0);

    const generationResponse = page.waitForResponse("**/api/generate-listing");
    await expect(page.getByTestId("regenerate-listing-button")).toBeEnabled();
    await page.getByTestId("regenerate-listing-button").click();
    await generationResponse;
    await expect(page.getByText(/已生成结果|正在后台保存|DeepSeek 生成结果已保存/)).toBeVisible();
    expect(generationRequests).toHaveLength(1);
    expect(generationRequests[0].body.projectId).toBe("e2e-project");
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
    await expect(page.getByTestId("regenerate-listing-button")).toBeEnabled();
  });
});
