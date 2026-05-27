"use client";

import { createClient } from "@supabase/supabase-js";
import { normalizeEnvText, normalizeSupabaseProjectUrl } from "@/lib/supabase-config";

const REMEMBER_ME_KEY = "work_up_remember_me";
const ACCESS_COOKIE = "work_up_access_token";
const REFRESH_COOKIE = "work_up_refresh_token";
const LONG_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type BrowserSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function persistentStorage() {
  return canUseBrowserStorage() ? window.localStorage : null;
}

function sessionOnlyStorage() {
  return canUseBrowserStorage() ? window.sessionStorage : null;
}

export function readRememberMePreference() {
  if (!canUseBrowserStorage()) {
    return true;
  }

  if (window.localStorage.getItem(REMEMBER_ME_KEY) === "true") {
    return true;
  }

  if (window.sessionStorage.getItem(REMEMBER_ME_KEY) === "false") {
    return false;
  }

  return true;
}

export function setRememberMePreference(rememberMe: boolean) {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (rememberMe) {
    window.localStorage.setItem(REMEMBER_ME_KEY, "true");
    window.sessionStorage.removeItem(REMEMBER_ME_KEY);
    return;
  }

  window.localStorage.removeItem(REMEMBER_ME_KEY);
  window.sessionStorage.setItem(REMEMBER_ME_KEY, "false");
}

function cookieOptions(maxAge?: number) {
  const secure = canUseBrowserStorage() && window.location.protocol === "https:" ? "; secure" : "";
  const maxAgePart = typeof maxAge === "number" ? `; max-age=${maxAge}` : "";

  return `path=/; samesite=lax${secure}${maxAgePart}`;
}

function setAuthCookie(name: string, value: string, maxAge?: number) {
  if (!canUseBrowserStorage()) {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions(maxAge)}`;
}

function clearCookie(name: string) {
  if (!canUseBrowserStorage()) {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function syncWorkUpAuthCookies(session: BrowserSession | null, rememberMe = readRememberMePreference()) {
  if (!session?.access_token) {
    clearCookie(ACCESS_COOKIE);
    clearCookie(REFRESH_COOKIE);
    return;
  }

  const maxAge = rememberMe ? LONG_SESSION_MAX_AGE : undefined;

  setAuthCookie(ACCESS_COOKIE, session.access_token, maxAge);

  if (session.refresh_token) {
    setAuthCookie(REFRESH_COOKIE, session.refresh_token, maxAge);
  }
}

export function clearWorkUpAuthState() {
  clearCookie(ACCESS_COOKIE);
  clearCookie(REFRESH_COOKIE);

  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(REMEMBER_ME_KEY);
  window.sessionStorage.removeItem(REMEMBER_ME_KEY);
}

function authStorage() {
  return {
    getItem(key: string) {
      return readRememberMePreference()
        ? persistentStorage()?.getItem(key) || null
        : sessionOnlyStorage()?.getItem(key) || null;
    },
    setItem(key: string, value: string) {
      const rememberMe = readRememberMePreference();
      const primary = rememberMe ? persistentStorage() : sessionOnlyStorage();
      const secondary = rememberMe ? sessionOnlyStorage() : persistentStorage();

      primary?.setItem(key, value);
      secondary?.removeItem(key);
    },
    removeItem(key: string) {
      persistentStorage()?.removeItem(key);
      sessionOnlyStorage()?.removeItem(key);
    },
  };
}

export function getBrowserSupabase() {
  const supabaseUrl = normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 环境变量还没配置。请先填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage(),
    },
  });

  const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

  supabase.auth.getSession = async () => {
    const result = await originalGetSession();
    syncWorkUpAuthCookies(result.data.session);
    return result;
  };

  supabase.auth.onAuthStateChange((_event, session) => {
    syncWorkUpAuthCookies(session);
  });

  return supabase;
}
