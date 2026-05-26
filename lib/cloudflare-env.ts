type WorkUpCloudflareEnv = {
  AI_PROVIDER?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_MODEL?: string;
  ENABLE_GENERATION_MOCK?: string;
};

export async function getCloudflareEnv(): Promise<WorkUpCloudflareEnv> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return getCloudflareContext().env as WorkUpCloudflareEnv;
  } catch {
    return {};
  }
}

function normalizeEnvValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export async function readServerEnv(name: keyof WorkUpCloudflareEnv) {
  const cloudflareEnv = await getCloudflareEnv();
  return normalizeEnvValue(cloudflareEnv[name]) || normalizeEnvValue(process.env[name]);
}

export async function getServerEnvDiagnostic(name: keyof WorkUpCloudflareEnv) {
  const cloudflareEnv = await getCloudflareEnv();
  const cloudflareValue = normalizeEnvValue(cloudflareEnv[name]);
  const processValue = normalizeEnvValue(process.env[name]);
  const value = cloudflareValue || processValue;

  return {
    value,
    source: cloudflareValue ? "cloudflare" : processValue ? "process" : "missing",
  };
}
