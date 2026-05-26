import { expect } from "@playwright/test";

export const mockListingResult = {
  title: {
    english: "Collapsible Storage Basket for Home, Dorm, Closet and Car Organization",
    chinese: "适合家庭、宿舍、衣柜和车载整理的可折叠收纳篮标题。",
  },
  bullets: [
    {
      english: "Folds flat when not in use to help save storage space.",
      chinese: "不用时可折叠收纳，帮助节省空间。",
      sellingPoint: "Foldable storage",
      painPoint: "Limited home space",
    },
    {
      english: "Side handles make it easier to move between rooms.",
      chinese: "双侧提手方便在不同房间移动。",
      sellingPoint: "Side handles",
      painPoint: "Hard to carry",
    },
    {
      english: "Open-top design keeps everyday items easy to reach.",
      chinese: "开放式设计方便日常拿取物品。",
      sellingPoint: "Easy access",
      painPoint: "Messy storage",
    },
    {
      english: "Simple neutral look fits closets, laundry rooms and car trunks.",
      chinese: "简洁中性色适合衣柜、洗衣房和后备箱。",
      sellingPoint: "Neutral design",
      painPoint: "Mixed home style",
    },
    {
      english: "Useful for organizing laundry, toys, pantry items and small accessories.",
      chinese: "可用于整理衣物、玩具、食品储物和小配件。",
      sellingPoint: "Multi-use",
      painPoint: "Scattered items",
    },
  ],
  description: {
    english: "Keep everyday storage simple with a foldable basket designed for small spaces.",
    chinese: "用适合小空间的可折叠收纳篮，让日常整理更简单。",
  },
  searchTerms: {
    english: "collapsible storage basket foldable organizer bin laundry basket closet organizer",
    chinese: "可折叠收纳篮、折叠整理盒、洗衣篮、衣柜收纳。",
  },
  faq: [],
  imageSuggestions: [],
  copyReadyListing: "Collapsible Storage Basket for Home, Dorm, Closet and Car Organization",
};

export async function getHealth(request) {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export function hasSupabaseEnv(health) {
  return Boolean(
    health?.supabase?.hasUrl &&
      health?.supabase?.urlLooksValid &&
      health?.supabase?.hasAnonKey &&
      health?.supabase?.anonKeyLooksValid,
  );
}

export async function mockSupabaseAuth(page) {
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsJsonHeaders(),
      body: JSON.stringify({
        access_token: "e2e-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "e2e-refresh-token",
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          aud: "authenticated",
          role: "authenticated",
          email: "e2e@example.com",
          email_confirmed_at: new Date().toISOString(),
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

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
}

export async function mockSupabaseProjectApi(page) {
  await page.route("**/rest/v1/product_projects**", async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === "POST") {
      await route.fulfill({
        status: 201,
        headers: corsJsonHeaders(),
        body: JSON.stringify({ id: "e2e-project" }),
      });
      return;
    }

    if (method === "PATCH") {
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
        id: "e2e-project",
        product_name_cn: "E2E 收纳篮",
        product_name_en: "",
        marketplace: "US",
        category: "Home & Kitchen",
        target_price: "$19.99",
        target_customer: "Dorm users",
        form_data: {},
        status: "Draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("**/rest/v1/generation_results**", async (route) => {
    const request = route.request();

    if (request.method() === "POST") {
      await route.fulfill({
        status: 201,
        headers: corsJsonHeaders(),
        body: JSON.stringify({ id: "e2e-generation-result" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: corsJsonHeaders(),
      body: JSON.stringify(null),
    });
  });
}

export async function signInWithMockSession(page) {
  await mockSupabaseAuth(page);
  await page.goto("/login");
  await page.getByTestId("auth-email-input").fill("e2e@example.com");
  await page.getByTestId("auth-password-input").fill("e2e-password");
  await page.getByTestId("auth-submit-button").click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export function corsJsonHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "apikey, authorization, content-type, x-client-info",
    "content-type": "application/json",
  };
}
