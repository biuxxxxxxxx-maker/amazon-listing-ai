import { NextResponse } from "next/server";
import { getServerEnvDiagnostic, readServerEnv } from "@/lib/cloudflare-env";
import { isUsableDeepSeekKey, readAIProvider } from "@/lib/ai-listing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const provider = await readAIProvider();
  const deepSeekKeyDiagnostic = await getServerEnvDiagnostic("DEEPSEEK_API_KEY");
  const deepSeekKey = deepSeekKeyDiagnostic.value;
  const deepSeekModel = await readServerEnv("DEEPSEEK_MODEL");
  const supabaseUrl = await readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = await readServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const keyLooksValid = provider === "deepseek" && isUsableDeepSeekKey(deepSeekKey);

  return NextResponse.json({
    ok: true,
    version: "runtime-env-2026-05-24-deepseek-01",
    ai: {
      provider,
      hasKey: Boolean(deepSeekKey),
      keyLooksValid,
      keySource: deepSeekKeyDiagnostic.source,
      generationMode: keyLooksValid ? provider : "mock",
      note: keyLooksValid
        ? "已检测到 DeepSeek API key。真实生成仍需要 DeepSeek API 余额。"
        : "未检测到可用 DeepSeek API key，将使用本地 mock 结果。",
      model: deepSeekModel || "deepseek-chat",
    },
    deepseek: {
      hasKey: Boolean(deepSeekKey),
      keyLooksValid: isUsableDeepSeekKey(deepSeekKey),
      keySource: deepSeekKeyDiagnostic.source,
      model: deepSeekModel || "deepseek-chat",
    },
    supabase: {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
    },
  });
}
