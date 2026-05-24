"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { BrandLink } from "@/components/layout/brand-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductPreview } from "./product-preview";
import type { GenerationResult } from "@/lib/mock-generation-result";

const heroStats = [
  ["Amazon only", "只做 Amazon Listing"],
  ["Bilingual", "标题 / 五点 / 描述双语"],
  ["Guided", "按步骤完成上新资料"],
];

const heroProof = [
  "不做多平台分散功能",
  "不逐字翻译中文资料",
  "每段英文都有中文参照",
];

type HeroProps = {
  result?: GenerationResult;
  isGenerating?: boolean;
  demoMode?: boolean;
  statusMessage?: string;
  errorMessage?: string;
  onGenerate?: () => void;
};

export function Hero({
  result,
  isGenerating = false,
  demoMode = false,
  statusMessage = "",
  errorMessage = "",
  onGenerate,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-line/70 px-5 py-6 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandLink />
        <div className="hidden items-center gap-6 text-sm text-neutral-600 sm:flex">
          <a href="#process" className="transition hover:text-ink">
            流程
          </a>
          <a href="#features" className="transition hover:text-ink">
            功能
          </a>
          <Link href="/login" className="transition hover:text-ink">
            登录
          </Link>
        </div>
        <Button size="sm" type="button" onClick={onGenerate} disabled={isGenerating}>
          开始生成
          <ArrowRight className="size-4" />
        </Button>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-10 pb-14 pt-14 sm:gap-12 sm:pb-16 sm:pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:pb-24 lg:pt-24">
        <div>
          <Badge tone="warm" className="mb-6">
            <Sparkles className="mr-1 size-3.5" />
            Amazon 新手卖家的 Listing 智能体
          </Badge>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-normal text-ink sm:text-6xl lg:text-7xl">
            从中文产品资料到地道 Amazon Listing，一步完成。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:mt-7 sm:text-lg sm:leading-8">
            为 Amazon 新手卖家设计的 AI 上新助手，帮你分析卖点、翻译资料、生成标题、五点描述、商品描述和关键词。
          </p>
          <div className="mt-6 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
            {heroProof.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-gold" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成中..." : "开始生成 Listing"}
              <ArrowRight className="size-4" />
            </Button>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                查看 mock 工作台
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 rounded-lg border border-line bg-white/70 p-3 shadow-hairline sm:grid-cols-3">
            {heroStats.map(([label, value]) => (
              <div key={label} className="rounded-md bg-white px-3 py-3">
                <p className="text-xs font-semibold uppercase text-neutral-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <ProductPreview
          result={result}
          isGenerating={isGenerating}
          demoMode={demoMode}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
        />
      </div>
    </section>
  );
}
