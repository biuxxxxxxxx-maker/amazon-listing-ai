import Link from "next/link";
import { ArrowLeft, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLink } from "@/components/layout/brand-link";
import { AuthForm } from "@/app/login/auth-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-8 sm:py-10">
      <div className="w-full max-w-5xl">
        <nav className="mb-10 flex items-center justify-between">
          <BrandLink />
          <Link href="/">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              返回首页
            </Button>
          </Link>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge tone="warm">创建账号 / Create Account</Badge>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              创建账号后保存你的 Listing 项目。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">
              Work UP 只面向 Amazon 卖家，注册后可以继续使用工作台、项目草稿和后续 AI 生成能力。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-neutral-100 text-ink">
                  <LockKeyhole className="size-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">邮箱注册</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  使用 Supabase 浏览器端 SDK，不使用 service role key。
                </p>
              </Card>
              <Card className="p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-neutral-100 text-ink">
                  <Database className="size-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">项目保存</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  注册后进入工作台，继续创建 Amazon Listing 项目。
                </p>
              </Card>
            </div>
          </div>
          <Card className="overflow-hidden p-0 shadow-soft">
            <div className="border-b border-line bg-white px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">注册账号</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    使用邮箱和密码创建账号，注册成功后进入工作台。
                  </p>
                </div>
                <div className="hidden size-11 place-items-center rounded-lg bg-amberSoft text-[#8a5a1e] sm:grid">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
            </div>
            <AuthForm initialMode="signup" />
            <p className="px-6 pb-6 text-center text-sm text-neutral-500 sm:px-8">
              已有账号？{" "}
              <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
                去登录
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
