import Link from "next/link";
import { ArrowLeft, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLink } from "@/components/layout/brand-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
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
            <Badge tone="warm">Email Login</Badge>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              登录后继续管理你的 Amazon Listing 项目。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600">
              已进入第二阶段：这里会使用 Supabase Auth 处理邮箱注册、登录和项目保存。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-neutral-100 text-ink">
                  <LockKeyhole className="size-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">邮箱登录</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  后续使用 Supabase Auth 管理登录状态。
                </p>
              </Card>
              <Card className="p-4">
                <div className="grid size-9 place-items-center rounded-lg bg-neutral-100 text-ink">
                  <Database className="size-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">保存项目</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  项目草稿和生成结果会保存到数据库。
                </p>
              </Card>
            </div>
          </div>
          <Card className="overflow-hidden p-0 shadow-soft">
            <div className="border-b border-line bg-white px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">登录 / 注册</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    使用邮箱继续。本地预览会直接从浏览器连接 Supabase。
                  </p>
                </div>
                <div className="hidden size-11 place-items-center rounded-lg bg-amberSoft text-[#8a5a1e] sm:grid">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
            </div>
            <AuthForm />
            <div className="mx-6 rounded-lg border border-line bg-paper p-4 sm:mx-8">
              <div className="flex gap-3">
                <Badge tone="neutral">Phase 1</Badge>
                <div>
                  <p className="text-sm font-semibold text-ink">当前阶段</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    登录会写入安全会话 cookie；创建 Listing 时会保存 Draft 项目到 Supabase。
                  </p>
                </div>
              </div>
            </div>
            <p className="px-6 py-5 text-center text-xs leading-5 text-neutral-500 sm:px-8">
              登录即表示你同意将项目信息用于生成 Amazon Listing。DeepSeek 生成会在第三阶段启用。
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
