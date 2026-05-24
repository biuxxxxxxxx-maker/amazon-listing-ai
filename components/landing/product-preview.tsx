"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Search, ShieldAlert } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { mockGenerationResult, type GenerationResult } from "@/lib/mock-generation-result";

const analysisItems = [
  ["核心卖点", "折叠收纳 / 双侧提手 / 小空间整理"],
  ["目标用户", "小户型家庭、宿舍用户、车主"],
  ["风险提醒", "不要夸大承重，缺少数据时不写 heavy-duty"],
];

type ProductPreviewProps = {
  result?: GenerationResult;
  isGenerating?: boolean;
  demoMode?: boolean;
  statusMessage?: string;
  errorMessage?: string;
};

export function ProductPreview({
  result = mockGenerationResult,
  isGenerating = false,
  demoMode = false,
  statusMessage = "",
  errorMessage = "",
}: ProductPreviewProps) {
  const outputItems = [
    {
      label: "Title",
      value: result.title.english,
      copyText: result.title.english,
      highlight: false,
    },
    {
      label: "中文参照",
      value: result.title.chinese,
      copyText: result.title.chinese,
      highlight: true,
    },
  ];

  return (
    <Card id="home-listing-preview" className="relative overflow-hidden border-neutral-200 bg-white p-3 shadow-soft sm:p-4">
      <div className="rounded-lg border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line bg-white px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-300" />
            <span className="size-2.5 rounded-full bg-yellow-300" />
            <span className="size-2.5 rounded-full bg-green-300" />
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Amazon US</Badge>
            <Badge tone={isGenerating ? "warm" : demoMode ? "neutral" : "green"}>
              {isGenerating ? "Generating" : demoMode ? "Demo" : "Generated"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-neutral-500">中文产品资料</p>
                <FileText className="size-4 text-neutral-400" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink">便携式折叠收纳篮</h3>
              <div className="mt-4 space-y-2 text-sm leading-6 text-neutral-600">
                <p>材质：PP + TPR，可折叠，带双侧提手。</p>
                <p>场景：洗衣房、衣柜、后备箱、宿舍。</p>
                <p>差异化：折叠后更薄，适合小空间。</p>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Search className="size-4 text-gold" />
                <p className="text-xs font-semibold text-neutral-500">AI 分析摘要</p>
              </div>
              <div className="space-y-3">
                {analysisItems.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-neutral-400">{label}</p>
                    <p className="mt-1 text-sm leading-5 text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500">Amazon Listing Output</p>
                <p className="mt-1 text-xs text-neutral-400">英文为主，中文解释辅助理解</p>
              </div>
              <CopyButton text={result.copyReadyListing} label="复制" />
            </div>

            {statusMessage ? (
              <div className="mt-4 rounded-lg border border-line bg-paper p-3 text-xs leading-5 text-neutral-600">
                {statusMessage}
              </div>
            ) : null}
            {demoMode ? (
              <div className="mt-3 rounded-lg border border-orange-200 bg-amberSoft p-3 text-xs leading-5 text-[#8a5a1e]">
                演示模式：未连接真实 AI
              </div>
            ) : null}
            {errorMessage ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              {isGenerating ? (
                <div className="grid min-h-48 place-items-center rounded-lg bg-paper text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    正在调用 DeepSeek 生成 Listing...
                  </div>
                </div>
              ) : null}

              {!isGenerating ? outputItems.map((item) => (
                <div
                  key={item.label}
                  className={item.highlight ? "rounded-lg bg-neutral-50 p-3" : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      {item.label}
                    </p>
                    <CopyButton text={item.copyText} label="复制" />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink">{item.value}</p>
                </div>
              )) : null}
            </div>

            {!isGenerating ? (
              <div className="mt-5 space-y-2">
                {result.bullets.slice(0, 3).map((item, index) => (
                  <div key={`${item.english}-${index}`} className="rounded-lg border border-line bg-paper px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Bullet {index + 1}
                      </p>
                      <CopyButton text={`${item.english}\n${item.chinese}`} label="复制" />
                    </div>
                    <p className="mt-1 text-sm font-medium leading-6 text-ink">{item.english}</p>
                    <p className="mt-2 rounded-md bg-white px-2 py-1.5 text-xs leading-5 text-neutral-600">
                      {item.chinese}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {!isGenerating ? (
              <div className="mt-5 rounded-lg border border-line bg-paper p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    Search Terms
                  </p>
                  <CopyButton text={result.searchTerms.english} label="复制" />
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-ink">{result.searchTerms.english}</p>
              </div>
            ) : null}

            <div className="mt-5 flex gap-2 rounded-lg bg-amberSoft p-3 text-sm leading-6 text-[#8a5a1e]">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p>小白提示：缺少真实测试数据时，系统会提醒补充，不会乱写夸张承诺。</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
