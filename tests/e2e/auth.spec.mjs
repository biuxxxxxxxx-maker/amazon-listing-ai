import { expect, test } from "@playwright/test";
import {
  corsJsonHeaders,
  getHealth,
  hasSupabaseEnv,
  mockSupabaseAuth,
  mockSupabaseProjectApi,
} from "./helpers.mjs";

async function readWorkUpAuthState(page) {
  return page.evaluate(() => ({
    rememberLocal: window.localStorage.getItem("work_up_remember_me"),
    rememberSession: window.sessionStorage.getItem("work_up_remember_me"),
    hasAccessCookie: document.cookie.includes("work_up_access_token="),
    hasRefreshCookie: document.cookie.includes("work_up_refresh_token="),
  }));
}

test.describe("auth flow", () => {
  test("login page renders login and signup controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("正在恢复登录状态...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "登录 / 注册" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("输入密码，至少 6 位")).toBeVisible();
    await expect(page.getByLabel("保持登录状态")).toBeChecked();
    await expect(page.getByText("勾选后，下次打开 Work UP 会自动恢复登录状态。")).toBeVisible();
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

  test("signup does not send a redirect_to query parameter", async ({ page }) => {
    const signupUrls = [];

    await page.route("**/auth/v1/signup**", async (route) => {
      signupUrls.push(route.request().url());

      if (route.request().method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: corsJsonHeaders(),
          body: "",
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: corsJsonHeaders(),
        body: JSON.stringify({
          user: {
            id: "00000000-0000-4000-8000-000000000002",
            email: "needs-confirmation@example.com",
          },
          session: null,
        }),
      });
    });

    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill("needs-confirmation@example.com");
    await page.getByTestId("auth-password-input").fill("valid-password");
    await page.getByTestId("auth-signup-button").click();
    await expect(page.getByText("注册成功，请检查邮箱完成验证后再登录。")).toBeVisible();
    expect(signupUrls.some((url) => new URL(url).searchParams.has("redirect_to"))).toBe(false);
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
    await mockSupabaseProjectApi(page);
    await page.goto("/login");
    await page.getByTestId("auth-email-input").fill(process.env.E2E_TEST_EMAIL || "e2e@example.com");
    await page.getByTestId("auth-password-input").fill(process.env.E2E_TEST_PASSWORD || "e2e-password");
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(page.getByRole("heading", { name: "创建 Amazon Listing 项目" })).toBeVisible();
    const rememberedState = await readWorkUpAuthState(page);
    expect(rememberedState).toEqual({
      rememberLocal: "true",
      rememberSession: null,
      hasAccessCookie: true,
      hasRefreshCookie: true,
    });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sign out clears Work UP auth cookies and remember-me state", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the browser client.");

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
    await page.getByRole("button", { name: "退出登录" }).click();
    await expect(page).toHaveURL(/\/login/);

    const clearedState = await readWorkUpAuthState(page);
    expect(clearedState).toEqual({
      rememberLocal: null,
      rememberSession: null,
      hasAccessCookie: false,
      hasRefreshCookie: false,
    });

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("auth-email-input")).toBeVisible();
  });

  test("login page shows the form when there is no recoverable session", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the browser client.");

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("auth-email-input")).toBeVisible();
    await expect(page.getByLabel("保持登录状态")).toBeChecked();
  });

  test("unchecked remember me keeps auth state session-only", async ({
    page,
    request,
  }) => {
    const health = await getHealth(request);
    test.skip(!hasSupabaseEnv(health), "Supabase env is required for the browser client.");

    await mockSupabaseAuth(page);
    await mockSupabaseProjectApi(page);
    await page.goto("/login");
    await page.getByLabel("保持登录状态").uncheck();
    await page.getByTestId("auth-email-input").fill("e2e@example.com");
    await page.getByTestId("auth-password-input").fill("e2e-password");
    await page.getByTestId("auth-submit-button").click();
    await expect(page).toHaveURL(/\/dashboard/);

    const sessionOnlyState = await page.evaluate(() => ({
      rememberLocal: window.localStorage.getItem("work_up_remember_me"),
      rememberSession: window.sessionStorage.getItem("work_up_remember_me"),
      localStorageText: Array.from({ length: window.localStorage.length }, (_, index) => {
        const key = window.localStorage.key(index) || "";
        return `${key}:${window.localStorage.getItem(key) || ""}`;
      }).join("\n"),
      sessionStorageText: Array.from({ length: window.sessionStorage.length }, (_, index) => {
        const key = window.sessionStorage.key(index) || "";
        return `${key}:${window.sessionStorage.getItem(key) || ""}`;
      }).join("\n"),
    }));
    expect(sessionOnlyState.rememberLocal).toBeNull();
    expect(sessionOnlyState.rememberSession).toBe("false");
    expect(sessionOnlyState.localStorageText).not.toContain("e2e-refresh-token");
    expect(sessionOnlyState.sessionStorageText).toContain("e2e-refresh-token");
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
