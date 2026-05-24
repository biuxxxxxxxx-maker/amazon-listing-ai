"use client";

import { useState } from "react";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProcessStrip } from "@/components/landing/process-strip";
import {
  mockGenerationResult,
  normalizeGenerationResult,
  type GenerationResult,
} from "@/lib/mock-generation-result";

const homeListingPayload = {
  productName: "便携式折叠收纳篮",
  productInfo:
    "材质：PP + TPR，可折叠，带双侧提手。场景：洗衣房、衣柜、后备箱、宿舍。差异化：折叠后更薄，适合小空间。",
  targetAudience: "小户型家庭、宿舍用户、车主",
  keywords:
    "collapsible storage basket, foldable organizer bin, laundry basket, closet organizer, car trunk organizer",
  languageMode: "bilingual",
};

export function HomePageContent() {
  const [result, setResult] = useState<GenerationResult>(mockGenerationResult);
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function generateListing() {
    setIsGenerating(true);
    setDemoMode(false);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-listing", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(homeListingPayload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "生成失败，请稍后再试。");
      }

      setResult(normalizeGenerationResult(data.result, homeListingPayload));
      setDemoMode(Boolean(data.demoMode));
      setStatusMessage(
        data.source === "deepseek"
          ? "已调用 DeepSeek 生成真实 Listing 结果。"
          : data.fallbackReason || "演示模式：当前使用本地 mock 结果。",
      );
    } catch (error) {
      setResult(mockGenerationResult);
      setErrorMessage(
        error instanceof Error ? error.message : "生成失败，请稍后再试。",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main>
      <Hero
        result={result}
        isGenerating={isGenerating}
        demoMode={demoMode}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
        onGenerate={generateListing}
      />
      <ProcessStrip />
      <FeatureGrid />
      <FinalCta isGenerating={isGenerating} onGenerate={generateListing} />
    </main>
  );
}
