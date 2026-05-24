"use client";

import { ArrowRight, CheckCircle2, Files, Languages, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ctaPoints = [
  { label: "Amazon 专用流程", icon: ShieldCheck },
  { label: "完整双语结果", icon: Languages },
  { label: "可复制可保存", icon: Files },
];

type FinalCtaProps = {
  isGenerating?: boolean;
  onGenerate?: () => void;
};

export function FinalCta({ isGenerating = false, onGenerate }: FinalCtaProps) {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-10">
      <Card className="mx-auto max-w-7xl overflow-hidden bg-ink p-6 text-white sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-orange-200">Work UP</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">
              让第一次写 Amazon Listing，也能知道每句话为什么这样写。
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300">
              第一阶段为 mock 流程，后续会接入 Supabase 保存项目，并用 DeepSeek 生成真实结果。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {ctaPoints.map((point) => {
                const Icon = point.icon;

                return (
                <span
                  key={point.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200"
                >
                  <Icon className="size-4 text-orange-200" />
                  {point.label}
                </span>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
              <CheckCircle2 className="size-4 text-orange-200" />
              当前 mock 流程可体验
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-300">
              <p>1. 创建产品项目</p>
              <p>2. 按步骤填写中文资料</p>
              <p>3. 查看英文 Listing + 中文解释</p>
            </div>
            <Button
              variant="warm"
              size="lg"
              className="mt-5 w-full"
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成中..." : "开始生成 Listing"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
