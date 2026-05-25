"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type AuthMode = "signin" | "signup";

type SupabaseSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

async function requestSupabaseAuth(mode: AuthMode, email: string, password: string) {
  const supabase = getBrowserSupabase();
  const result =
    mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

  if (result.error) {
    throw new Error(toChineseAuthError(result.error.message, mode));
  }

  return {
    access_token: result.data.session?.access_token,
    refresh_token: result.data.session?.refresh_token,
    expires_in: result.data.session?.expires_in,
  } satisfies SupabaseSession;
}

function toChineseAuthError(message: string, mode: AuthMode) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login")) {
    return "登录失败，请检查邮箱和密码。";
  }

  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists")) {
    return "这个邮箱已经注册过，请直接登录。";
  }

  if (lowerMessage.includes("password")) {
    return "密码不符合要求，请至少填写 6 位。";
  }

  if (lowerMessage.includes("email")) {
    return "邮箱格式不正确，或需要先完成邮箱验证。";
  }

  return mode === "signin" ? "登录失败，请检查邮箱和密码。" : "注册失败，请检查邮箱或密码。";
}

export function AuthForm({ initialMode = "signin" }: { initialMode?: AuthMode }) {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingMode, setLoadingMode] = useState<AuthMode | null>(null);

  async function submitAuth(form: HTMLFormElement, mode: AuthMode) {
    setError("");
    setNotice("");
    setLoadingMode(mode);

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const session = await requestSupabaseAuth(mode, email, password);

      if (!session.access_token) {
        setNotice("注册成功，但当前 Supabase 项目需要邮箱验证。请先完成邮箱确认后再登录。");
        return;
      }

      setCookie("work_up_access_token", session.access_token, session.expires_in || 60 * 60);

      if (session.refresh_token) {
        setCookie("work_up_refresh_token", session.refresh_token, 60 * 60 * 24 * 30);
      }

      window.location.href = "/dashboard";
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "操作失败，请稍后再试。");
    } finally {
      setLoadingMode(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAuth(event.currentTarget, initialMode);
  }

  async function handleSignUp() {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    await submitAuth(formRef.current, "signup");
  }

  return (
    <form ref={formRef} className="space-y-4 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-lg border border-orange-200 bg-amberSoft p-3 text-sm leading-6 text-[#8a5a1e]">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
          {notice}
        </div>
      ) : null}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">邮箱</span>
        <Input
          data-testid="auth-email-input"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">密码</span>
        <Input
          data-testid="auth-password-input"
          name="password"
          type="password"
          placeholder="输入密码，至少 6 位"
          autoComplete="current-password"
          minLength={6}
          required
        />
      </label>
      <Button
        data-testid="auth-submit-button"
        type="submit"
        size="lg"
        className="w-full"
        disabled={Boolean(loadingMode)}
      >
        <Mail className="size-4" />
        {loadingMode === initialMode ? (initialMode === "signin" ? "登录中..." : "注册中...") : initialMode === "signin" ? "登录" : "注册新账号"}
      </Button>
      {initialMode === "signin" ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={Boolean(loadingMode)}
          onClick={handleSignUp}
        >
          {loadingMode === "signup" ? "注册中..." : "注册新账号"}
        </Button>
      ) : null}
      {!supabaseReady ? (
        <Link href="/dashboard">
          <Button type="button" variant="ghost" size="lg" className="mt-3 w-full">
            进入 mock 工作台
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      ) : null}
    </form>
  );
}
