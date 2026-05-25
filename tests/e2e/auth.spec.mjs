import { expect, test } from "@playwright/test";
import { corsJsonHeaders, getHealth, hasSupabaseEnv, mockSupabaseAuth } from "./helpers.mjs";

test.describe("auth flow", () => {
  test("login page renders login and signup controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "登录 / 注册" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("输入密码，至少 6 位")).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
    await expect(page.getByRole("button", { name: "注册新账号" })).toBeVisible();
  });

  test("auth errors show the Supabase message in the UI", async ({ page }) => {
    await page.route("**/auth/v1/token?grant_type=password", async (route) => {
      await route.fulfill({
        status: 400,
        headers: corsJsonHeaders(),
        body: JSON.stringify({ error_description: "Invalid login credentials" }),
      });
    });

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("wrong@example.com");
    await page.getByPlaceholder("输入密码，至少 6 位").fill("wrong-password");
    await page.getByRole("button", { name: "登录" }).click();
    await expect(page.getByText(/Invalid login credentials|Supabase 环境变量/)).toBeVisible();
  });

  test("signup errors show the Supabase message in the UI", async ({ page }) => {
    await page.route("**/auth/v1/signup**", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: corsJsonHeaders(),
          body: "",
        });
        return;
      }

      await route.fulfill({
        status: 400,
        headers: corsJsonHeaders(),
        body: JSON.stringify({ msg: "User already registered" }),
      });
    });

    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill("registered@example.com");
    await page.getByTestId("auth-password-input").fill("valid-password");
    await page.getByTestId("auth-signup-button").click();
    await expect(page.getByText("User already registered")).toBeVisible();
  });

  test("short passwords show a clear client-side error", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill("new@example.com");
    await page.getByTestId("auth-password-input").fill("123");
    await page.getByTestId("auth-signup-button").click();
    await expect(page.getByText("密码至少 6 位。")).toBeVisible();
  });

  test("anonymous dashboard access redirects to login when Supabase is configured", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is not configured, so dashboard uses mock mode.");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("anonymous project creation access redirects to login when Supabase is configured", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is not configured, so project creation stays in mock mode.");

    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("successful login redirects to dashboard with a mocked Supabase session", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the browser client.");

    await mockSupabaseAuth(page);
    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill(process.env.E2E_TEST_EMAIL || "e2e@example.com");
    await page.getByTestId("auth-password-input").fill(process.env.E2E_TEST_PASSWORD || "e2e-password");
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("real Supabase login is optional and uses E2E_TEST_EMAIL/E2E_TEST_PASSWORD", async ({
    page,
    request,
  }) => {
    test.skip(
      !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run the real login smoke test.",
    );

    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for real login.");

    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill(process.env.E2E_TEST_EMAIL);
    await page.getByTestId("auth-password-input").fill(process.env.E2E_TEST_PASSWORD);
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
