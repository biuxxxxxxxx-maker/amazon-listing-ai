export function normalizeEnvText(value: unknown) {
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

export function getSupabaseUrlDiagnostic(value: unknown) {
  const rawUrl = normalizeEnvText(value).replace(/\/+$/, "");
  const diagnostic = {
    hasUrl: Boolean(rawUrl),
    urlLooksValid: false,
    urlHost: "",
  };

  if (!rawUrl) {
    return diagnostic;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    const hasProjectHost = /^[a-z0-9-]+\.supabase\.co$/i.test(parsedUrl.hostname);
    const hasProjectRootPath = parsedUrl.pathname === "" || parsedUrl.pathname === "/";

    return {
      hasUrl: true,
      urlLooksValid: parsedUrl.protocol === "https:" && hasProjectHost && hasProjectRootPath,
      urlHost: parsedUrl.host,
    };
  } catch {
    return diagnostic;
  }
}

export function getSupabaseAnonKeyDiagnostic(value: unknown) {
  const anonKey = normalizeEnvText(value);
  const jwtParts = anonKey.split(".");

  return {
    hasAnonKey: Boolean(anonKey),
    anonKeyLooksValid:
      jwtParts.length === 3 &&
      jwtParts.every((part) => part.length > 0) &&
      anonKey.startsWith("eyJ"),
  };
}

export function normalizeSupabaseProjectUrl(value: unknown) {
  const rawUrl = normalizeEnvText(value).replace(/\/+$/, "");

  if (!rawUrl) {
    return "";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 格式无效。请填写 https://你的项目ref.supabase.co。");
  }

  const diagnostic = getSupabaseUrlDiagnostic(rawUrl);

  if (!diagnostic.urlLooksValid) {
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    const pathMessage = path ? ` 当前值包含 path：${path}。` : "";

    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL 应该只填 Supabase 项目根 URL，例如 https://你的项目ref.supabase.co。${pathMessage}不要填写 /auth/v1、/rest/v1 或其他接口路径。`,
    );
  }

  return `${parsedUrl.protocol}//${parsedUrl.host}`;
}
