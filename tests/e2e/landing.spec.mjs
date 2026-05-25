import { expect, test } from "@playwright/test";

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
    await expect(page.getByRole("heading", { name: /从中文产品资料到地道 Amazon Listing/ })).toBeVisible();
    await expect(page.getByText("Amazon Listing Output")).toBeVisible();
    await expect(page.getByText("Generating")).toHaveCount(0);

    await page.getByRole("button", { name: "开始生成 Listing" }).click();
    await expect(page).toHaveURL(/\/(login|projects\/new)$/);
    expect(generationRequests).toHaveLength(0);
  });

  test("mock dashboard link does not call generation API", async ({ page }) => {
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
    await page.getByRole("link", { name: "查看 mock 工作台" }).click();
    await expect(page).toHaveURL(/\/(dashboard|login)$/);
    expect(generationRequests).toHaveLength(0);
  });
});
