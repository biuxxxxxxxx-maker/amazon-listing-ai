import { NextResponse } from "next/server";
import { getServerEnvDiagnostic, readServerEnv } from "@/lib/cloudflare-env";
import { isUsableDeepSeekKey, readAIProvider } from "@/lib/ai-listing";
import {
  getSupabaseAnonKeyDiagnostic,
  getSupabaseUrlDiagnostic,
} from "@/lib/supabase-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const provider = await readAIProvider();
  const deepSeekKeyDiagnostic = await getServerEnvDiagnostic("DEEPSEEK_API_KEY");
  const deepSeekKey = deepSeekKeyDiagnostic.value;
  const deepSeekBaseUrl = await readServerEnv("DEEPSEEK_BASE_URL");
  const deepSeekModel = await readServerEnv("DEEPSEEK_MODEL");
  const supabaseUrl = await readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = await readServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const keyLooksValid = provider === "deepseek" && isUsableDeepSeekKey(deepSeekKey);
  const supabaseUrlDiagnostic = getSupabaseUrlDiagnostic(supabaseUrl);
  const supabaseAnonKeyDiagnostic = getSupabaseAnonKeyDiagnostic(supabaseAnonKey);

  return NextResponse.json({
    ok: true,
    version: "supabase-auth-diagnostics-2026-05-26-01",
    ai: {
      provider,
      hasKey: Boolean(deepSeekKey),
      keyLooksValid,
      keySource: deepSeekKeyDiagnostic.source,
      generationMode: keyLooksValid ? provider : "mock",
      note: keyLooksValid
        ? "已检测到 DeepSeek API key。真实生成仍需要 DeepSeek API 余额。"
        : "未检测到可用 DeepSeek API key，将使用本地 mock 结果。",
      baseUrl: deepSeekBaseUrl || "https://api.deepseek.com/chat/completions",
      model: deepSeekModel || "deepseek-chat",
    },
    deepseek: {
      hasKey: Boolean(deepSeekKey),
      keyLooksValid: isUsableDeepSeekKey(deepSeekKey),
      keySource: deepSeekKeyDiagnostic.source,
      baseUrl: deepSeekBaseUrl || "https://api.deepseek.com/chat/completions",
      model: deepSeekModel || "deepseek-chat",
    },
    supabase: {
      ...supabaseUrlDiagnostic,
      ...supabaseAnonKeyDiagnostic,
    },
  });
}
