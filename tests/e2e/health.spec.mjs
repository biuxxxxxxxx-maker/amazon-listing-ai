import { expect, test } from "@playwright/test";

test.describe("health diagnostics", () => {
  test("/api/health reports safe Supabase diagnostics without leaking keys", async ({ request }) => {
    const response = await request.get("/api/health");
    const responseText = await response.text();
    const body = JSON.parse(responseText);

    expect(response.ok()).toBeTruthy();
    expect(body.supabase).toEqual(
      expect.objectContaining({
        hasUrl: expect.any(Boolean),
        urlLooksValid: expect.any(Boolean),
        urlHost: expect.any(String),
        hasAnonKey: expect.any(Boolean),
        anonKeyLooksValid: expect.any(Boolean),
      }),
    );
    expect(body.deepseek).toEqual(
      expect.objectContaining({
        hasKey: expect.any(Boolean),
        baseUrl: expect.any(String),
      }),
    );
    expect(body.supabase).not.toHaveProperty("url");
    expect(body.supabase).not.toHaveProperty("anonKey");
    expect(body.deepseek).not.toHaveProperty("key");

    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      expect(responseText).not.toContain(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }

    if (process.env.DEEPSEEK_API_KEY) {
      expect(responseText).not.toContain(process.env.DEEPSEEK_API_KEY);
    }
  });
});
