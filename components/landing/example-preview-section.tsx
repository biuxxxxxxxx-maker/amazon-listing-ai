"use client";

import { ChevronDown } from "lucide-react";
import { ProductPreview } from "@/components/landing/product-preview";
import { Button } from "@/components/ui/button";
import type { GenerationResult } from "@/lib/mock-generation-result";
import { cn } from "@/lib/utils";

type ExamplePreviewSectionProps = {
  result: GenerationResult;
  isOpen: boolean;
  onToggle: () => void;
};

export function ExamplePreviewSection({
  result,
  isOpen,
  onToggle,
}: ExamplePreviewSectionProps) {
  return (
    <section id="workup-example" className="border-b border-line/70 px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">
                示例预览
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
                看看 Work UP 的输出结构
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base sm:leading-7">
                这是一个静态示例，用来展示 Work UP 会如何组织中文资料、Listing 策略、英文成品和合规提醒。真实生成会基于你的产品资料、竞品信息和合规边界生成。
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              data-testid="example-preview-toggle"
              className="h-11 shrink-0 rounded-full border-stone-300 bg-stone-50 px-5 text-stone-800 hover:bg-white"
              aria-expanded={isOpen}
              aria-controls="workup-example-panel"
              onClick={onToggle}
            >
              {isOpen ? "收起示例" : "展开示例"}
              <ChevronDown
                className={cn("size-4 transition", {
                  "rotate-180": isOpen,
                })}
              />
            </Button>
          </div>

          {isOpen ? (
            <div id="workup-example-panel" data-testid="example-preview-panel" className="mt-6">
              <ProductPreview result={result} demoMode={false} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
