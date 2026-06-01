"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { BrandLink } from "@/components/layout/brand-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ResultBlock } from "@/components/ui/result-block";
import {
  copyBulletPoints,
  copyDescription,
  copyFullListing,
  copySearchTerms,
  copyTitle,
} from "@/lib/final-listing-copy";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { GenerationInputSnapshot, GenerationResult } from "@/lib/workup-schema";

const oldResultMessage = "请重新生成新版 Listing";
const oldResultDescription =
  "这个结果来自旧版结构，无法按 Work UP 新版 Listing 格式展示。点击重新生成后，系统会基于当前项目资料生成包含 Final Listing、资料质量、策略、缺失信息和合规提醒的新结果。";
const emptyResultMessage = "尚未生成 Listing，请点击重新生成。";
const loadingMessage = "正在基于产品资料、竞品洞察和 Listing 策略生成...";

const resultNavItems = [
  ["最终 Listing", "final-listing"],
  ["质量与策略", "quality-strategy"],
  ["缺失信息", "missing-info"],
  ["保守假设", "assumptions"],
  ["合规提醒", "compliance-notes"],
  ["竞品洞察", "competitor-insights"],
  ["专家建议", "expert-analysis"],
];

type ProjectData = {
  product_name_cn?: string | null;
  product_name_en?: string | null;
  marketplace?: string | null;
  category?: string | null;
  target_price?: string | null;
  target_customer?: string | null;
  form_data?: Record<string, unknown> | null;
  status?: "Draft" | "Generated" | null;
};

type ResultState = "empty" | "ready" | "old";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value: unknown) {
  return textValue(value).length > 0;
}

function cleanDisplayText(value: unknown, fallback = "Not provided.") {
  let text = "";

  if (typeof value === "string") {
    text = value.trim();
  } else if (typeof value === "number" && Number.isFinite(value)) {
    text = String(value);
  } else if (typeof value === "boolean") {
    text = value ? "yes" : "no";
  }

  const normalized = text.toLowerCase();

  if (
    !text ||
    normalized === "undefined" ||
    normalized === "null" ||
    normalized === "nan" ||
    text === "-"
  ) {
    return fallback;
  }

  return text;
}

function hasDisplayText(value: unknown) {
  return cleanDisplayText(value, "") !== "";
}

function getRecordValue(record: Record<string, unknown> | null | undefined, key: string) {
  return record ? record[key] : undefined;
}

function collectGenerationPrerequisites(projectData: ProjectData | null) {
  const formData = isRecord(projectData?.form_data) ? projectData.form_data : {};
  const missing: string[] = [];

  if (!hasText(projectData?.product_name_cn) && !hasText(getRecordValue(formData, "product_name_cn"))) {
    missing.push("产品名称");
  }

  const marketplaceValue =
    projectData?.marketplace || textValue(getRecordValue(formData, "marketplace"));

  if (!marketplaceValue) {
    missing.push("Amazon 站点");
  }

  if (!hasText(projectData?.category) && !hasText(getRecordValue(formData, "category"))) {
    missing.push("类目");
  }

  const factFields = [
    "material",
    "color",
    "dimensions",
    "size",
    "weight",
    "capacity",
    "package_quantity",
    "use_cases",
    "usage_scenarios",
    "core_features",
    "supplier_description",
    "competitor_title",
    "competitor_selling_points",
    "review_pain_points",
    "differentiation",
  ];

  const hasProductFact = factFields.some((field) => hasText(getRecordValue(formData, field)));

  if (!hasProductFact) {
    missing.push("产品基础资料");
  }

  const hasGenerationSettings =
    hasText(getRecordValue(formData, "english_style")) &&
    hasText(getRecordValue(formData, "language"));

  if (!hasGenerationSettings) {
    missing.push("生成设置");
  }

  return missing;
}

function compactTextItems(items: unknown[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const item of items) {
    const text = cleanDisplayText(item, "");
    const key = text.toLowerCase();

    if (!text || seen.has(key)) {
      continue;
    }

    seen.add(key);
    cleaned.push(text);
  }

  return cleaned;
}

function joinDisplayParts(parts: unknown[], separator = ": ") {
  return compactTextItems(parts).join(separator);
}

function isCompleteWorkUpGenerationResult(value: unknown): value is GenerationResult {
  if (!isRecord(value)) {
    return false;
  }

  const finalListing = value.finalListing;

  if (
    value.schemaVersion !== "workup.v1" ||
    value.source !== "deepseek" ||
    !isRecord(finalListing)
  ) {
    return false;
  }

  const title = isRecord(finalListing.title) ? finalListing.title : {};
  const description = isRecord(finalListing.description) ? finalListing.description : {};
  const searchTerms = isRecord(finalListing.searchTerms) ? finalListing.searchTerms : {};
  const bulletPoints = finalListing.bulletPoints;

  return (
    hasText(title.english) &&
    hasText(title.chineseExplanation) &&
    Array.isArray(bulletPoints) &&
    bulletPoints.length === 5 &&
    bulletPoints.every(
      (bullet) =>
        isRecord(bullet) &&
        hasText(bullet.english) &&
        hasText(bullet.chineseExplanation) &&
        Array.isArray(bullet.evidenceFields) &&
        hasText(bullet.sourceBasis),
    ) &&
    hasText(description.english) &&
    hasText(description.chineseExplanation) &&
    hasText(searchTerms.english) &&
    hasText(searchTerms.chineseExplanation)
  );
}

function hasCompetitorInput(result: GenerationResult) {
  const input = result.competitorInsights?.input;

  return Boolean(
    input &&
      [
        input.titles,
        input.urls,
        input.bulletPoints,
        input.reviewPainPoints,
        input.differentiationNotes,
      ].some((items) => Array.isArray(items) && items.length > 0),
  );
}

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [displayResult, setDisplayResult] = useState<GenerationResult | null>(null);
  const [displayModel, setDisplayModel] = useState("");
  const [inputSnapshot, setInputSnapshot] = useState<GenerationInputSnapshot | null>(null);
  const [resultState, setResultState] = useState<ResultState>("empty");
  const hasValidResult =
    resultState === "ready" &&
    displayResult?.source === "deepseek" &&
    displayModel !== "mock-local";
  const competitorInputProvided = displayResult ? hasCompetitorInput(displayResult) : false;
  const copyTexts = useMemo(() => {
    if (!displayResult || !hasValidResult) {
      return {
        full: "",
        title: "",
        bulletPoints: "",
        description: "",
        searchTerms: "",
      };
    }

    return {
      full: copyFullListing(displayResult),
      title: copyTitle(displayResult),
      bulletPoints: copyBulletPoints(displayResult),
      description: copyDescription(displayResult),
      searchTerms: copySearchTerms(displayResult),
    };
  }, [displayResult, hasValidResult]);

  useEffect(() => {
    if (!supabaseReady || projectId === "demo") {
      return;
    }

    async function loadProjectAndLatestResult() {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          return;
        }

        const { data: project, error: projectError } = await supabase
          .from("product_projects")
          .select(
            "product_name_cn,product_name_en,marketplace,category,target_price,target_customer,form_data,status",
          )
          .eq("id", projectId)
          .maybeSingle();

        if (projectError) {
          throw projectError;
        }

        if (project) {
          setProjectData(project as ProjectData);
        }

        const { data, error } = await supabase
          .from("generation_results")
          .select("created_at,model,result_json,input_snapshot")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data?.result_json) {
          setResultState("empty");
          setStatusMessage(emptyResultMessage);
          return;
        }

        if (isCompleteWorkUpGenerationResult(data.result_json) && data.model !== "mock-local") {
          setDisplayResult(data.result_json);
          setDisplayModel(data.model || data.result_json.model || "deepseek-chat");
          setInputSnapshot(
            isRecord(data.input_snapshot)
              ? (data.input_snapshot as GenerationInputSnapshot)
              : null,
          );
          setSavedAt(String(data.created_at).slice(0, 19).replace("T", " "));
          setResultState("ready");
          setStatusMessage("已读取到 Supabase 中保存过的 Work UP 新版 DeepSeek 结果。");
          return;
        }

        setDisplayResult(null);
        setDisplayModel("");
        setInputSnapshot(null);
        setSavedAt("");
        setResultState("old");
        setStatusMessage(oldResultMessage);
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? `读取结果记录失败：${error.message}`
            : "读取结果记录失败，请检查 generation_results 表和 RLS 策略。",
        );
      }
    }

    loadProjectAndLatestResult();
  }, [projectId, supabaseReady]);

  async function saveGeneratedResult(
    resultJson: GenerationResult | null,
    model = "",
    snapshot?: GenerationInputSnapshot | null,
    options: { clearStatus?: boolean } = {},
  ) {
    if (!supabaseReady) {
      setStatusMessage("Supabase 环境变量未配置，无法保存结果。");
      return;
    }

    if (projectId === "demo") {
      setStatusMessage("当前是 demo 项目，不能保存到数据库。请先创建真实项目再保存结果。");
      return;
    }

    if (!resultJson || !isCompleteWorkUpGenerationResult(resultJson)) {
      setStatusMessage("当前结果不是完整 Work UP 新版 GenerationResult，已停止保存。");
      return;
    }

    if (resultJson.source !== "deepseek" || model === "mock-local") {
      setStatusMessage("当前结果不是 DeepSeek 正式生成结果，已停止保存，避免把 mock 数据写入 Supabase。");
      return;
    }

    setIsSaving(true);
    if (options.clearStatus !== false) {
      setStatusMessage("");
    }

    try {
      const supabase = getBrowserSupabase();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      const { error: insertError } = await supabase.from("generation_results").insert({
        project_id: projectId,
        model,
        input_snapshot: snapshot || {
          schemaVersion: "workup.v1",
          savedFrom: "result_page",
          project: projectData,
        },
        result_json: resultJson,
      });

      if (insertError) {
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("product_projects")
        .update({ status: "Generated" })
        .eq("id", projectId);

      if (updateError) {
        throw updateError;
      }

      const now = new Date().toLocaleString("zh-CN", { hour12: false });
      setDisplayResult(resultJson);
      setDisplayModel(model);
      setInputSnapshot(snapshot || null);
      setResultState("ready");
      setSavedAt(now);
      setStatusMessage("Work UP 新版 DeepSeek 生成结果已保存到 Supabase。");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? `保存失败：${error.message}`
          : "保存失败，请检查登录状态、generation_results 表和 RLS 策略。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCurrentResult() {
    await saveGeneratedResult(displayResult, displayModel, inputSnapshot);
  }

  async function regenerateListing() {
    const missingPrerequisites = collectGenerationPrerequisites(projectData);

    if (missingPrerequisites.length > 0) {
      setStatusMessage(`生成前缺少必填信息：${missingPrerequisites.join("、")}。请补齐后再重新生成。`);
      setResultState(displayResult ? "ready" : "empty");
      return;
    }

    setIsGenerating(true);
    setStatusMessage(loadingMessage);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 70000);

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      if (supabaseReady) {
        const { data: sessionData } = await getBrowserSupabase().auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (accessToken) {
          headers.authorization = `Bearer ${accessToken}`;
        }
      }

      const response = await fetch("/api/generate-listing", {
        method: "POST",
        credentials: "same-origin",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          projectId,
          projectData,
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "生成失败，请稍后再试。");
      }

      if (data.source !== "deepseek") {
        throw new Error(data.fallbackReason || "生成接口返回了非 DeepSeek 正式结果，已停止保存。");
      }

      if (!isCompleteWorkUpGenerationResult(data.result)) {
        setDisplayResult(null);
        setDisplayModel("");
        setInputSnapshot(null);
        setResultState("old");
        setStatusMessage(oldResultMessage);
        return;
      }

      const nextResult = data.result as GenerationResult;
      const nextModel = textValue(data.model) || nextResult.model || "deepseek-chat";
      const nextSnapshot = isRecord(data.inputSnapshot)
        ? (data.inputSnapshot as GenerationInputSnapshot)
        : null;

      setDisplayResult(nextResult);
      setDisplayModel(nextModel);
      setInputSnapshot(nextSnapshot);
      setResultState("ready");

      if (projectId !== "demo") {
        setStatusMessage("DeepSeek 已生成，正在后台保存到 Supabase。");
        void saveGeneratedResult(nextResult, nextModel, nextSnapshot, {
          clearStatus: false,
        });
      } else {
        setStatusMessage("DeepSeek 已生成。当前是 demo 项目，所以没有写入数据库。");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatusMessage("生成失败：DeepSeek 响应超时，未保存任何结果。请稍后重试。");
        return;
      }

      setStatusMessage(
        error instanceof Error
          ? `生成失败：${error.message}`
          : "生成失败：没有收到详细错误，请稍后再试。",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  }

  const productName =
    projectData?.product_name_cn ||
    displayResult?.productBrief.product.nameCn ||
    "Amazon Listing 项目";
  const marketplace =
    projectData?.marketplace || displayResult?.productBrief.product.marketplace || "US";
  const category =
    projectData?.category || displayResult?.productBrief.product.category || "Uncategorized";

  return (
    <main className="min-h-screen px-5 pb-28 pt-6 sm:px-8 sm:pb-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-3">
            <Link href="/projects/new">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-4" />
                返回编辑
              </Button>
            </Link>
            <UserMenu />
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <PageHeader
            title="Work UP Listing 结果"
            description="先展示可复制到 Amazon 后台的英文 Listing，再解释资料质量、卖点策略、缺失信息、保守假设、竞品洞察和合规风险。"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[31rem]">
            <CopyButton
              text={copyTexts.full}
              label="复制英文 Listing"
              size="md"
              className={!hasValidResult ? "pointer-events-none opacity-50" : undefined}
            />
            <Button
              data-testid="regenerate-listing-button"
              variant="secondary"
              onClick={regenerateListing}
              disabled={isGenerating}
            >
              <RefreshCw className="size-4" />
              {isGenerating ? "生成中" : "重新生成"}
            </Button>
            <Button
              variant="warm"
              onClick={saveCurrentResult}
              disabled={isSaving || !hasValidResult}
            >
              <Save className="size-4" />
              {isSaving ? "保存中" : "保存结果"}
            </Button>
          </div>
        </div>

        {statusMessage ? <StatusMessage savedAt={savedAt}>{statusMessage}</StatusMessage> : null}

        {projectData || displayResult ? (
          <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm leading-6 text-neutral-600">
            当前项目：
            <span className="ml-1 font-semibold text-ink">{productName}</span>
            <span className="mx-2 text-neutral-300">/</span>
            Amazon {marketplace}
            <span className="mx-2 text-neutral-300">/</span>
            {category}
          </div>
        ) : null}

        {isGenerating ? (
          <Card className="mt-8 p-8 text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-gold" />
            <p className="mt-4 text-base font-semibold text-ink">{loadingMessage}</p>
          </Card>
        ) : null}

        {!isGenerating && !hasValidResult ? (
          <EmptyResultState
            state={resultState}
            isGenerating={isGenerating}
            onRegenerate={regenerateListing}
          />
        ) : null}

        {!isGenerating && hasValidResult && displayResult ? (
          <>
            <SummaryCard result={displayResult} productName={productName} category={category} />

            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {resultNavItems.map(([label, id]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <Card className="sticky top-6 p-3">
                  <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    结果模块
                  </p>
                  <div className="grid gap-1">
                    {resultNavItems.map(([label, id]) => (
                      <a
                        key={id}
                        href={`#${id}`}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-ink"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-amberSoft p-3 text-xs leading-5 text-[#8a5a1e]">
                    复制时只读取 Final Amazon Listing 的英文，不复制中文解释、策略或分析。
                  </div>
                </Card>
              </aside>

              <div className="grid gap-5">
                <FinalAmazonListing result={displayResult} copyTexts={copyTexts} />
                <ListingQualityAndStrategy result={displayResult} />
                <MissingInfoSection result={displayResult} />
                <AssumptionsSection result={displayResult} />
                <ComplianceNotesSection result={displayResult} />
                <CompetitorInsightsSection
                  result={displayResult}
                  hasCompetitorInput={competitorInputProvided}
                />
                <ExpertAnalysisSection result={displayResult} />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/92 p-3 shadow-[0_-12px_35px_rgba(23,23,23,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
          <CopyButton
            text={copyTexts.full}
            label="复制英文 Listing"
            size="md"
            className={`w-full ${!hasValidResult ? "pointer-events-none opacity-50" : ""}`}
          />
          <Button
            variant="warm"
            size="md"
            aria-label="保存结果"
            onClick={saveCurrentResult}
            disabled={isSaving || !hasValidResult}
          >
            <Save className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  result,
  productName,
  category,
}: {
  result: GenerationResult;
  productName: string;
  category: string;
}) {
  return (
    <Card className="mt-8 overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.55fr]">
        <div className="p-5 sm:p-6">
          <Badge tone="green">DeepSeek 已生成</Badge>
          <h2 className="mt-4 text-2xl font-semibold text-ink">{productName}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Work UP 新版生成结果 / {category} / Final Listing 优先展示
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              [result.qualityScore.level, "Quality Level"],
              [String(result.qualityScore.overall), "综合评分"],
              [String(result.finalListing.bulletPoints.length), "Bullet Points"],
              [result.model, "Model"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg bg-paper p-3">
                <p className="text-xl font-semibold text-ink">{value}</p>
                <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-line bg-paper p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-gold" />
            <p className="text-sm font-semibold text-ink">结果保护规则</p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              "只展示 source 为 deepseek 的新版结果",
              "Final Listing 正好 5 条 Bullet Points",
              "复制内容只来自 english 字段",
            ].map((check) => (
              <div key={check} className="flex gap-2 text-sm leading-6 text-neutral-600">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-gold" />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function FinalAmazonListing({
  result,
  copyTexts,
}: {
  result: GenerationResult;
  copyTexts: {
    full: string;
    title: string;
    bulletPoints: string;
    description: string;
    searchTerms: string;
  };
}) {
  return (
    <section id="final-listing" className="scroll-mt-24">
      <ResultBlock
        title="Final Amazon Listing"
        eyebrow="Copy Ready"
        description="这是第一优先级结果，可复制到 Amazon 后台；中文解释只用于理解。"
        copyText={copyTexts.full}
        copyLabel="Copy Full Listing"
      >
        <div className="grid gap-5">
          <ListingFieldBlock
            id="title"
            title="Amazon Title"
            english={result.finalListing.title.english}
            chineseExplanation={result.finalListing.title.chineseExplanation}
            copyText={copyTexts.title}
            copyLabel="Copy Title"
          />

          <div id="bullets" className="scroll-mt-24 overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Bullet Points</p>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Exactly 5 English bullets with separate Chinese explanations.
                </p>
              </div>
              <CopyButton text={copyTexts.bulletPoints} label="Copy Bullet Points" />
            </div>
            {result.finalListing.bulletPoints.map((bullet, index) => (
              <article
                key={`${bullet.english}-${index}`}
                data-testid="final-listing-bullet"
                className="border-b border-line px-4 py-5 last:border-b-0 sm:px-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-paper text-xs font-semibold text-neutral-500">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <LanguageLabel>English Bullet</LanguageLabel>
                      <p className="mt-2 text-[17px] font-semibold leading-8 text-ink sm:text-lg">
                        {bullet.english}
                      </p>
                    </div>
                  </div>
                  <CopyButton
                    text={bullet.english}
                    label="Copy"
                    className="w-full shrink-0 sm:w-auto"
                  />
                </div>
                <ChineseExplanation>{bullet.chineseExplanation}</ChineseExplanation>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <MetaLine label="Source Basis" value={bullet.sourceBasis} />
                  <MetaLine label="Evidence Fields" value={compactTextItems(bullet.evidenceFields).join(", ")} />
                </div>
              </article>
            ))}
          </div>

          <ListingFieldBlock
            id="description"
            title="Product Description"
            english={result.finalListing.description.english}
            chineseExplanation={result.finalListing.description.chineseExplanation}
            copyText={copyTexts.description}
            copyLabel="Copy Description"
          />

          <ListingFieldBlock
            id="search-terms"
            title="Search Terms"
            english={result.finalListing.searchTerms.english}
            chineseExplanation={result.finalListing.searchTerms.chineseExplanation}
            copyText={copyTexts.searchTerms}
            copyLabel="Copy Search Terms"
          />
        </div>
      </ResultBlock>
    </section>
  );
}

function ListingQualityAndStrategy({ result }: { result: GenerationResult }) {
  const strategy = result.listingStrategy;

  return (
    <ResultBlock
      id="quality-strategy"
      title="Listing Quality & Strategy"
      eyebrow="Strategy"
      description="展示资料质量、关键词策略、定位方向和 claim 边界。"
    >
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoCard label="Quality Level" value={result.qualityScore.level} />
          <InfoCard label="Overall Score" value={String(result.qualityScore.overall)} />
          <InfoCard label="Primary Keyword" value={strategy.primaryKeyword} />
        </div>
        <SoftNote label="Quality Summary">{result.qualityScore.summary}</SoftNote>
        <InfoList title="Secondary Keywords" items={strategy.secondaryKeywords} />
        <InfoCard label="Positioning Direction" value={strategy.positioning.direction} />
        <RankedList
          title="Selling Point Order"
          items={strategy.sellingPointOrder.map(
            (item) =>
              `${item.rank}. ${item.sellingPoint} — ${item.reason} (${item.evidenceFields.join(", ")})`,
          )}
        />
        <InfoList
          title="Avoid Claims"
          items={strategy.avoidClaims.map((item) => `${item.claim}: ${item.reason}`)}
        />
        <InfoList
          title="Safe Claims"
          items={strategy.safeClaims.map((item) => `${item.claim}: ${item.evidence}`)}
        />
      </div>
    </ResultBlock>
  );
}

function MissingInfoSection({ result }: { result: GenerationResult }) {
  const items = result.missingInfo.filter((item) => hasDisplayText(item.field));

  return (
    <ResultBlock
      id="missing-info"
      title="Missing Info"
      eyebrow="Input Quality"
      description="这些缺失信息会影响 Listing 精度、合规边界或转化表达。"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <StructuredItem
              key={`${item.field}-${item.impactArea}`}
              title={item.field}
              rows={[
                ["Why It Matters", item.whyItMatters],
                ["Example", item.example],
                ["Impact Area", item.impactArea],
              ]}
            />
          ))}
        </div>
      ) : (
        <EmptySection text="No critical missing information detected." />
      )}
    </ResultBlock>
  );
}

function AssumptionsSection({ result }: { result: GenerationResult }) {
  const items = result.assumptions.filter((item) => hasDisplayText(item.assumption));

  return (
    <ResultBlock
      id="assumptions"
      title="Assumptions"
      eyebrow="Conservative Inference"
      description="低信息输入时，系统做出的保守假设会在这里明示。"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <StructuredItem
              key={item.assumption}
              title={item.assumption}
              rows={[
                ["Reason", item.reason],
                ["Confidence", item.confidence],
                ["Should Verify With User", item.shouldVerifyWithUser ? "yes" : "no"],
              ]}
            />
          ))}
        </div>
      ) : (
        <EmptySection text="No major assumptions were needed." />
      )}
    </ResultBlock>
  );
}

function ComplianceNotesSection({ result }: { result: GenerationResult }) {
  const items = result.complianceNotes.filter((item) => hasDisplayText(item.claim));

  return (
    <ResultBlock
      id="compliance-notes"
      title="Compliance Notes"
      eyebrow="Risk Control"
      description="展示 DeepSeek 结果中的风险 claim、原因和建议处理方式。"
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <StructuredItem
              key={`${item.claim}-${item.reason}`}
              title={joinDisplayParts([item.riskLevel, item.claim])}
              rows={[
                ["Reason", item.reason],
                ["Recommendation", item.recommendation],
                ["Related Field", item.relatedField],
              ]}
            />
          ))}
        </div>
      ) : (
        <EmptySection text="No compliance risks detected from the provided input." />
      )}
    </ResultBlock>
  );
}

function CompetitorInsightsSection({
  result,
  hasCompetitorInput,
}: {
  result: GenerationResult;
  hasCompetitorInput: boolean;
}) {
  const insights = result.competitorInsights;

  return (
    <ResultBlock
      id="competitor-insights"
      title="Competitor Insights"
      eyebrow="Market Pattern"
      description="竞品内容只用于关键词、市场模式、痛点和机会，不直接复制进 Final Listing。"
    >
      {!hasCompetitorInput ? (
        <SoftNote label="未提供竞品资料">
          未提供竞品资料，本次主要基于产品资料和类目常识生成。粘贴竞品标题、五点和评论痛点后，可以获得更准确的关键词和差异化建议。
        </SoftNote>
      ) : (
        <div className="grid gap-4">
          <InfoList title="Keyword Patterns" items={insights.keywordPatterns} />
          <InfoList title="Buyer Pain Points" items={insights.buyerPainPoints} />
          <InfoList title="Competitor Angles" items={insights.competitorAngles} />
          <InfoList
            title="Opportunities"
            items={insights.opportunities.map(
              (item) =>
                `${item.opportunity}${item.requiredConfirmation ? ` Required: ${item.requiredConfirmation}` : ""}`,
            )}
          />
          <InfoList
            title="Risky Claims"
            items={insights.riskyClaims.map((item) => `${item.claim}: ${item.reason}`)}
          />
          <InfoList
            title="Blocked From Final Listing"
            items={insights.blockedFromFinalListing.map(
              (item) => `${item.claim}: ${item.reason}`,
            )}
          />
        </div>
      )}
    </ResultBlock>
  );
}

function ExpertAnalysisSection({ result }: { result: GenerationResult }) {
  const suggestions = result.improvementSuggestions
    .filter((item) => hasDisplayText(item.suggestion))
    .map((item) => {
      const suggestion = cleanDisplayText(item.suggestion);
      const reason = cleanDisplayText(item.reason);
      const expectedImpact = cleanDisplayText(item.expectedImpact, "general");

      return joinDisplayParts([
        item.priority,
        `${suggestion} - ${reason} (${expectedImpact})`,
      ]);
    });

  return (
    <ResultBlock
      id="expert-analysis"
      title="Expert Suggestions / Analysis"
      eyebrow="Explanation"
      description="给新手看的运营解释和后续优化建议。"
    >
      <div className="grid gap-4">
        <InfoList
          title="Improvement Suggestions"
          items={suggestions}
        />
        <StructuredItem
          title="Analysis"
          rows={[
            ["Product Summary", result.analysis.productSummary],
            ["Strategy Summary", result.analysis.strategySummary],
            ["Competitor Summary", result.analysis.competitorSummary],
            ["Compliance Summary", result.analysis.complianceSummary],
            ["Beginner Explanation", result.analysis.beginnerExplanation],
          ]}
        />
      </div>
    </ResultBlock>
  );
}

function ListingFieldBlock({
  id,
  title,
  english,
  chineseExplanation,
  copyText,
  copyLabel,
}: {
  id: string;
  title: string;
  english: string;
  chineseExplanation: string;
  copyText: string;
  copyLabel: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-lg border border-line bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <LanguageLabel>English</LanguageLabel>
          <p className="mt-2 text-base font-semibold leading-7 text-ink">{english}</p>
        </div>
        <CopyButton text={copyText} label={copyLabel} className="w-full shrink-0 sm:w-auto" />
      </div>
      <ChineseExplanation>{chineseExplanation}</ChineseExplanation>
    </div>
  );
}

function StructuredItem({
  title,
  rows,
}: {
  title: unknown;
  rows: Array<[string, unknown]>;
}) {
  const displayRows = rows
    .map(([label, value]) => [label, cleanDisplayText(value, "")] as const)
    .filter(([, value]) => value);
  const rowsToRender =
    displayRows.length > 0 ? displayRows : ([["Details", "Not provided."]] as const);

  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">{cleanDisplayText(title)}</p>
      <div className="mt-3 grid gap-2">
        {rowsToRender.map(([label, value]) => (
          <MetaLine key={label} label={label} value={value} />
        ))}
      </div>
    </article>
  );
}

function InfoCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink">
        {cleanDisplayText(value)}
      </p>
    </div>
  );
}

function InfoList({
  title,
  items,
  emptyText = "No usable data provided.",
}: {
  title: string;
  items: unknown[];
  emptyText?: string;
}) {
  const displayItems = compactTextItems(items);

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {displayItems.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm leading-5 text-neutral-700"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-neutral-500">{emptyText}</p>
      )}
    </div>
  );
}

function RankedList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      {items.map((item) => (
        <p key={item} className="border-b border-line px-4 py-3 text-sm leading-6 text-neutral-700 last:border-b-0">
          {item}
        </p>
      ))}
    </div>
  );
}

function EmptyResultState({
  state,
  isGenerating,
  onRegenerate,
}: {
  state: ResultState;
  isGenerating: boolean;
  onRegenerate: () => void;
}) {
  const message = state === "old" ? oldResultMessage : emptyResultMessage;
  const buttonLabel = state === "old" ? "重新生成新版 Listing" : "立即生成 Listing";

  return (
    <Card className="mt-8 p-8 text-center">
      <Badge tone="warm">{state === "old" ? "旧版本结果" : "尚未生成"}</Badge>
      <h2 className="mt-4 text-xl font-semibold text-ink">{message}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
        {state === "old"
          ? oldResultDescription
          : "点击重新生成后，Work UP 会基于当前项目资料输出 Final Listing、资料质量、策略、缺失信息和合规提醒。"}
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={onRegenerate} disabled={isGenerating}>
          <RefreshCw className="size-4" />
          {isGenerating ? "生成中" : buttonLabel}
        </Button>
      </div>
    </Card>
  );
}

function StatusMessage({
  children,
  savedAt,
}: {
  children: string;
  savedAt?: string;
}) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-paper p-4 text-sm leading-6 text-neutral-700">
      {children}
      {savedAt ? <span className="ml-2 font-semibold text-ink">保存时间：{savedAt}</span> : null}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper p-4 text-sm leading-6 text-neutral-500">
      {text}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-700">
        {cleanDisplayText(value)}
      </p>
    </div>
  );
}

function LanguageLabel({ children }: { children: string }) {
  return (
    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </p>
  );
}

function ChineseExplanation({ children }: { children: string }) {
  return (
    <div className="mt-3 rounded-lg bg-neutral-50 p-4">
      <p className="text-xs font-semibold text-neutral-400">Chinese Explanation</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{children}</p>
    </div>
  );
}

function SoftNote({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-lg bg-amberSoft p-4 text-sm leading-6 text-[#8a5a1e]">
      <p className="text-xs font-semibold text-[#9a681f]">{label}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
