"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Image, ListChecks, Loader2, Sparkles, Tags } from "lucide-react";
import { useState } from "react";
import { BrandLink } from "@/components/layout/brand-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/textarea";
import type { MvpTool } from "@/lib/mvp-tools";
import {
  mockGenerationResult,
  normalizeGenerationResult,
  type GenerationResult,
} from "@/lib/mock-generation-result";

type MockToolPageProps = {
  tool: MvpTool;
};

export function MockToolPage({ tool }: MockToolPageProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [listingResult, setListingResult] = useState<GenerationResult | null>(null);

  async function generateResult() {
    setIsLoading(true);
    setHasResult(false);
    setStatusMessage("");

    if (tool.slug !== "listing-generator") {
      window.setTimeout(() => {
        setIsLoading(false);
        setHasResult(true);
      }, 650);
      return;
    }

    try {
      const response = await fetch("/api/generate-listing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectData: {
            source: "listing-generator-tool",
            rawInput: input,
          },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "生成失败，请稍后再试。");
      }

      setListingResult(normalizeGenerationResult(data.result));
      setStatusMessage(
        data.source === "deepseek"
          ? "已调用 DeepSeek 生成真实 Listing 结果。"
          : data.fallbackReason || "演示模式：当前使用本地 mock 结果。",
      );
      setHasResult(true);
    } catch (error) {
      setListingResult(mockGenerationResult);
      setStatusMessage(
        error instanceof Error
          ? `演示模式：${error.message} 已显示本地 mock 结果。`
          : "演示模式：生成失败，已显示本地 mock 结果。",
      );
      setHasResult(true);
    } finally {
      setIsLoading(false);
    }
  }

  const listingOutput = listingResult
    ? [
        {
          title: "Amazon Title",
          english: listingResult.title.english,
          chinese: listingResult.title.chinese,
        },
        ...listingResult.bullets.map((bullet, index) => ({
          title: `Bullet Point ${index + 1}`,
          english: bullet.english,
          chinese: bullet.chinese,
        })),
        {
          title: "Product Description",
          english: listingResult.description.english,
          chinese: listingResult.description.chinese,
        },
        {
          title: "Backend Search Terms",
          english: listingResult.searchTerms.english,
          chinese: listingResult.searchTerms.chinese,
        },
      ]
    : [];
  const outputItems = tool.slug === "listing-generator" && listingResult ? listingOutput : tool.mockOutput;
  const copyText =
    tool.slug === "listing-generator" && listingResult
      ? listingResult.copyReadyListing
      : tool.mockOutput
          .map((item) => [item.title, item.english, item.chinese].filter(Boolean).join("\n"))
          .join("\n\n");
  const iconMap = {
    sparkles: Sparkles,
    chart: BarChart3,
    list: ListChecks,
    tags: Tags,
    image: Image,
  };
  const Icon = iconMap[tool.icon];

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center justify-between">
          <BrandLink />
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              返回工作台
            </Button>
          </Link>
        </nav>

        <PageHeader
          title={tool.titleCn}
          description={tool.description}
          action={<Badge tone="warm">{tool.titleEn}</Badge>}
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Card className="p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-amberSoft text-[#8a5a1e]">
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">{tool.inputLabel}</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{tool.emptyHint}</p>
              </div>
            </div>
            <Textarea
              className="mt-5 min-h-48"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tool.inputPlaceholder}
            />
            <Button className="mt-4 w-full" size="lg" onClick={generateResult} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isLoading ? "生成中..." : tool.buttonLabel}
            </Button>
            {statusMessage ? (
              <div className="mt-4 rounded-lg border border-line bg-paper p-3 text-sm leading-6 text-neutral-700">
                {statusMessage}
              </div>
            ) : null}
            <div className="mt-5 rounded-lg border border-line bg-paper p-4">
              <p className="text-sm font-semibold text-ink">小白友好提示</p>
              <div className="mt-3 space-y-2">
                {tool.helperTips.map((tip) => (
                  <p key={tip} className="text-sm leading-6 text-neutral-600">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-soft">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  Mock Output
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">生成结果预览</h2>
              </div>
              {hasResult ? <CopyButton text={copyText} label="复制结果" /> : null}
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {!hasResult && !isLoading ? (
                <div className="rounded-lg border border-dashed border-line bg-paper p-5 text-sm leading-6 text-neutral-600">
                  输入资料后点击生成，这里会出现 mock 结果。后续接入 DeepSeek 后会替换成真实 AI 输出。
                </div>
              ) : null}

              {isLoading ? (
                <div className="grid min-h-64 place-items-center rounded-lg bg-paper text-sm text-neutral-600">
                  正在整理资料并生成示例结果...
                </div>
              ) : null}

              {hasResult
                ? outputItems.map((item) => (
                    <div key={item.title} className="rounded-lg border border-line bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                        <Badge tone="neutral">双语</Badge>
                      </div>
                      {item.english ? (
                        <p className="mt-3 text-sm leading-7 text-ink">{item.english}</p>
                      ) : null}
                      <div className="mt-3 rounded-lg bg-paper p-3 text-sm leading-6 text-neutral-600">
                        <span className="font-semibold text-ink">中文参照：</span>
                        {item.chinese}
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
