import { expect } from "@playwright/test";

export const mockListingResult = {
  title: {
    english: "Lightweight Carry-On Suitcase for Weekend Trips and Business Travel",
    chinese: "适合周末旅行和商务出行的轻便登机行李箱标题。",
  },
  bullets: [
    {
      english: "Lightweight shell makes short trips easier to pack and carry.",
      chinese: "轻便箱体让短途出行更容易打包和携带。",
      sellingPoint: "Lightweight luggage",
      painPoint: "Heavy suitcase",
    },
    {
      english: "Smooth rolling wheels help move through airports, hotels and train stations.",
      chinese: "顺滑滚轮方便穿过机场、酒店和火车站。",
      sellingPoint: "Smooth wheels",
      painPoint: "Difficult travel movement",
    },
    {
      english: "Organized interior helps keep clothing and travel essentials separated.",
      chinese: "分区内部空间帮助衣物和旅行用品分开放置。",
      sellingPoint: "Organized packing",
      painPoint: "Messy luggage",
    },
    {
      english: "Compact carry-on design is suitable for business trips and weekend travel.",
      chinese: "紧凑登机箱设计适合商务差旅和周末旅行。",
      sellingPoint: "Carry-on size",
      painPoint: "Short trip packing",
    },
    {
      english: "Simple exterior style pairs well with everyday travel needs.",
      chinese: "简洁外观适合日常旅行需求。",
      sellingPoint: "Travel style",
      painPoint: "Overly bulky luggage",
    },
  ],
  description: {
    english: "Pack confidently for short trips with a lightweight suitcase designed for organized travel.",
    chinese: "用为有序出行设计的轻便行李箱，自信完成短途打包。",
  },
  searchTerms: {
    english: "carry on suitcase lightweight luggage spinner suitcase travel luggage",
    chinese: "登机箱、轻便行李箱、旅行箱、万向轮行李箱。",
  },
  faq: [],
  imageSuggestions: [],
  copyReadyListing: "Lightweight Carry-On Suitcase for Weekend Trips and Business Travel",
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

export async function mockSupabaseProjectApi(page, options = {}) {
  const project = {
    id: "e2e-project",
    product_name_cn: "行李箱",
    product_name_en: "",
    marketplace: "US",
    category: "Travel & Luggage",
    target_price: "$79.99",
    target_customer: "Business travelers",
    form_data: {
      product_name_cn: "行李箱",
      material: "PC",
      usage_scenarios: "商务出差、周末旅行、登机随身携带。",
      core_features: "轻便箱体、顺滑滚轮、内部收纳分区。",
      differentiation: "轻便耐用，适合短途出行。",
      english_style: "localized",
      language: "English",
      needs_chinese_explanation: true,
      needs_image_suggestions: true,
    },
    status: "Draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(options.project || {}),
  };

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
      body: JSON.stringify(project),
    });
  });

  await page.route("**/rest/v1/generation_results**", async (route) => {
    const request = route.request();

    if (request.method() === "POST") {
      options.onGenerationInsert?.(request.postDataJSON());

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
