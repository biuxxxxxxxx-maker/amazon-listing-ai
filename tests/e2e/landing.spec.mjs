import { expect, test } from "@playwright/test";
import {
  corsJsonHeaders,
  getHealth,
  hasSupabaseEnv,
  mockSupabaseAuth,
  mockSupabaseProjectApi,
} from "./helpers.mjs";

test.describe("landing page", () => {
  test("renders and routes CTA without calling generation API", async ({ page }) => {
    const generationRequests = [];

    await page.route("**/api/generate-listing", async (route) => {
      generationRequests.push(route.request().url());
      await route.fulfill({
        status: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Landing page must not call generation API." }),
      });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /中文产品资料，生成地道的/ })).toBeVisible();
    await expect(page.getByText("Amazon Listing Strategy Workspace")).toBeVisible();
    await expect(page.getByText("流程预览")).toBeVisible();
    await expect(page.getByText("Final Amazon Listing")).toBeVisible();
    await expect(page.getByText("看看 Work UP 的输出结构")).toBeVisible();
    await expect(page.getByTestId("example-preview-panel")).toHaveCount(0);
    await expect(page.getByText("Generating")).toHaveCount(0);
    await expect(page.getByTestId("home-login-link")).toBeVisible();
    await expect(page.getByTestId("user-menu-button")).toHaveCount(0);
    await expect(page.getByText("mock")).toHaveCount(0);
    await expect(page.getByText("第一阶段")).toHaveCount(0);
    await expect(page.getByText("暂不接 Supabase")).toHaveCount(0);
    await expect(page.getByText("暂不接 DeepSeek")).toHaveCount(0);
    await expect(page.getByText("DeepSeek")).toHaveCount(0);
    await expect(page.getByText("Supabase")).toHaveCount(0);

    await page.getByTestId("start-listing-cta").click();
    await expect(page).toHaveURL(/\/(login|projects\/new)$/);
    expect(generationRequests).toHaveLength(0);
  });

  test("example link does not call generation API", async ({ page }) => {
    const generationRequests = [];

    await page.route("**/api/generate-listing", async (route) => {
      generationRequests.push(route.request().url());
      await route.fulfill({
        status: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Mock dashboard link must not call generation API." }),
      });
    });

    await page.goto("/");
    const flowPreview = page.getByTestId("flow-preview-card");
    await expect(flowPreview.getByText("流程预览")).toBeVisible();
    await expect(flowPreview.getByText("Listing 策略")).toBeVisible();
    await expect(flowPreview.getByText("缺失信息 / 合规提醒")).toBeVisible();
    await expect(page.getByTestId("example-preview-panel")).toHaveCount(0);
    await page.getByTestId("example-preview-cta").click();
    await expect(page).toHaveURL(/\/#workup-example$/);
    const examplePanel = page.getByTestId("example-preview-panel");
    await expect(examplePanel).toBeVisible();
    await expect(examplePanel.getByText("中文产品资料")).toBeVisible();
    await expect(examplePanel.getByText("AI 分析摘要")).toBeVisible();
    await expect(examplePanel.getByText("Amazon Listing Output")).toBeVisible();
    expect(generationRequests).toHaveLength(0);
  });

  test("authenticated home navigation shows dashboard and user menu without login button", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for authenticated home navigation.");

    const generationRequests = [];

    await page.route("**/api/generate-listing", async (route) => {
      generationRequests.push(route.request().url());
      await route.fulfill({
        status: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Landing page must not call generation API." }),
      });
    });

    await mockSupabaseAuth(page);
    await mockSupabaseProjectApi(page);
    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill("e2e@example.com");
    await page.getByTestId("auth-password-input").fill("e2e-password");
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/");
    await expect(page.getByTestId("home-login-link")).toHaveCount(0);
    await expect(page.getByTestId("home-dashboard-link")).toBeVisible();
    await expect(page.getByTestId("user-menu-button")).toBeVisible();

    await page.getByTestId("home-dashboard-link").click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/");
    await page.getByTestId("start-listing-cta").click();
    await expect(page).toHaveURL(/\/projects\/new/);
    expect(generationRequests).toHaveLength(0);
  });

  test("authenticated home user menu can sign out", async ({ page, request }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for authenticated home navigation.");

    await mockSupabaseAuth(page);
    await mockSupabaseProjectApi(page);
    await page.route("**/auth/v1/logout**", async (route) => {
      await route.fulfill({
        status: 204,
        headers: corsJsonHeaders(),
        body: "",
      });
    });

    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill("e2e@example.com");
    await page.getByTestId("auth-password-input").fill("e2e-password");
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/");
    await expect(page.getByTestId("user-menu-button")).toBeVisible();
    await page.getByTestId("user-menu-button").click();
    await expect(page.getByRole("menuitem", { name: "进入控制台" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "个人设置" })).toBeVisible();
    await page.getByRole("menuitem", { name: "退出" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
