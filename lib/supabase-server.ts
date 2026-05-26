import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/cloudflare-env";
import { normalizeEnvText, normalizeSupabaseProjectUrl } from "@/lib/supabase-config";

export function hasSupabaseServerEnv() {
  return Boolean(
    normalizeEnvText(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      normalizeEnvText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function readBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorizationHeader.slice("bearer ".length).trim();
}

function readCookieValue(cookieHeader: string | null, name: string) {
  return (
    cookieHeader
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ""
  );
}

export function readRequestAccessToken(request: Request) {
  const bearerToken = readBearerToken(request.headers.get("authorization"));

  if (bearerToken) {
    return bearerToken;
  }

  const cookieToken = readCookieValue(request.headers.get("cookie"), "work_up_access_token");
  return cookieToken ? decodeURIComponent(cookieToken) : "";
}

export function getServerSupabase(accessToken?: string) {
  const supabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 环境变量未配置。");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function hasSupabaseServerEnvAsync() {
  return Boolean(
    normalizeEnvText(await readServerEnv("NEXT_PUBLIC_SUPABASE_URL")) &&
      normalizeEnvText(await readServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
  );
}

export async function getServerSupabaseAsync(accessToken?: string) {
  const supabaseUrl = normalizeSupabaseProjectUrl(await readServerEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const supabaseAnonKey = normalizeEnvText(await readServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 环境变量未配置。");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
