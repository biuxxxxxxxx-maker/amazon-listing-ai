"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, LayoutDashboard, SearchCheck, ShieldCheck } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { BrandLink } from "@/components/layout/brand-link";
import { Button } from "@/components/ui/button";
import type { GenerationResult } from "@/lib/mock-generation-result";

const proofPoints = [
  {
    title: "不只是翻译",
    description: "先分析产品定位、目标买家和类目表达，再生成英文 Listing。",
  },
  {
    title: "更接近运营思维",
    description: "结合竞品标题、五点和评论痛点，提炼关键词、卖点机会和风险表达。",
  },
  {
    title: "可直接复制",
    description: "英文成品和中文解释分离，复制时只复制 Amazon 后台需要的英文内容。",
  },
];

const processSteps = [
  {
    title: "中文产品资料",
    titleEn: "Product Input",
    description: "输入产品事实、供应商描述和基础类目。",
    badge: "Input",
    icon: FileText,
    className: "border-stone-200 bg-white",
    iconClassName: "bg-stone-50 text-stone-700",
    titleClassName: "text-stone-950",
    titleEnClassName: "text-stone-400",
    descriptionClassName: "text-stone-500",
    badgeClassName: "bg-stone-100 text-stone-700",
  },
  {
    title: "Listing 策略",
    titleEn: "Listing Strategy",
    description: "提取关键词、卖点排序和定位方向。",
    badge: "Analyze",
    icon: SearchCheck,
    className: "border-stone-200 bg-white",
    iconClassName: "bg-stone-50 text-stone-700",
    titleClassName: "text-stone-950",
    titleEnClassName: "text-stone-400",
    descriptionClassName: "text-stone-500",
    badgeClassName: "bg-stone-100 text-stone-700",
  },
  {
    title: "最终 Amazon Listing",
    titleEn: "Final Amazon Listing",
    description: "生成可复制到 Amazon 后台的英文 Listing。",
    badge: "Ready to Copy",
    icon: ClipboardCheck,
    className: "border-stone-300 bg-stone-50 shadow-sm",
    iconClassName: "bg-stone-900 text-white",
    titleClassName: "text-stone-950",
    titleEnClassName: "text-stone-400",
    descriptionClassName: "text-stone-600",
    badgeClassName: "bg-stone-900 text-white",
  },
  {
    title: "缺失信息 / 合规提醒",
    titleEn: "Missing Info / Compliance",
    description: "提示缺失资料、保守假设和风险表达。",
    badge: "Guardrail",
    icon: ShieldCheck,
    className: "border-amber-200 bg-amber-50/90",
    iconClassName: "bg-white text-amber-700",
    titleClassName: "text-stone-950",
    titleEnClassName: "text-amber-700/70",
    descriptionClassName: "text-stone-600",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
];

type HeroProps = {
  result?: GenerationResult;
  isGenerating?: boolean;
  demoMode?: boolean;
  statusMessage?: string;
  errorMessage?: string;
  authStatus?: "checking" | "authenticated" | "anonymous";
  onGenerate?: () => void;
  onShowExample?: () => void;
};

export function Hero({
  isGenerating = false,
  authStatus = "anonymous",
  onGenerate,
  onShowExample,
}: HeroProps) {
  const isAuthenticated = authStatus === "authenticated";
  const isCheckingAuth = authStatus === "checking";

  return (
    <section className="min-h-screen bg-paper px-5 py-5 sm:px-8 lg:px-10">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-stone-200/70 bg-paper px-1 sm:px-2">
        <BrandLink />
        <div className="flex items-center gap-3">
          {isCheckingAuth ? (
            <div
              aria-label="正在检查登录状态"
              className="h-11 w-40 animate-pulse rounded-full bg-white/70"
            />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                data-testid="home-dashboard-link"
                className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
              >
                控制台
              </Link>
              <span className="hidden h-6 w-px bg-slate-300 sm:block" aria-hidden="true" />
              <UserMenu />
            </div>
          ) : (
            <Link
              href="/login"
              data-testid="home-login-link"
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900"
            >
              开始使用
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 py-10 sm:py-12 lg:min-h-[calc(100vh-5.25rem)] lg:grid-cols-[1fr_0.9fr] lg:gap-12 lg:py-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Amazon Listing Strategy Workspace
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.04] tracking-normal text-slate-900 sm:text-6xl lg:text-7xl">
            中文产品资料，生成地道的
            <span className="block text-indigo-600">Amazon Listing</span>
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Work UP 会把中文产品信息、竞品线索和买家痛点整理成英文 Amazon Listing，并同步给出资料质量、卖点策略、缺失信息和合规风险提醒。
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              data-testid="start-listing-cta"
              size="lg"
              className="w-full rounded-lg bg-black text-white shadow-sm hover:bg-slate-900 sm:w-auto"
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成中..." : "开始生成 Listing"}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              data-testid="example-preview-cta"
              className="w-full rounded-lg border-slate-300 bg-white/70 text-slate-700 hover:bg-white sm:w-auto"
              onClick={onShowExample}
            >
              查看示例
            </Button>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            {proofPoints.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          data-testid="flow-preview-card"
          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                流程预览 <span className="text-sm font-medium text-slate-500">Flow Preview</span>
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                从中文资料到可复制 Listing 的轻量流程摘要。
              </p>
            </div>
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-800">
              <LayoutDashboard className="size-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className={`relative rounded-xl border p-4 ${step.className}`}
                >
                  <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                      <div className={`grid size-9 shrink-0 place-items-center rounded-lg shadow-sm ${step.iconClassName}`}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${step.titleClassName}`}>
                          {index + 1}. {step.title}
                          <span className={`ml-2 text-xs font-medium ${step.titleEnClassName}`}>
                            {step.titleEn}
                          </span>
                        </p>
                        <p className={`mt-1 text-sm leading-6 ${step.descriptionClassName}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${step.badgeClassName}`}>
                      {step.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Copy Ready
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Final Listing 第一优先级展示；策略、缺失信息和合规提醒作为运营辅助，不混入复制内容。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
