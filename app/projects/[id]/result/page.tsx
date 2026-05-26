"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrandLink } from "@/components/layout/brand-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ResultBlock } from "@/components/ui/result-block";
import {
  normalizeGenerationResult,
  type GenerationResult,
} from "@/lib/mock-generation-result";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const resultNavItems = [
  ["标题", "title"],
  ["五点", "bullets"],
  ["描述", "description"],
  ["关键词", "search-terms"],
  ["风险", "compliance"],
  ["分析", "analysis"],
  ["竞品", "competitors"],
  ["痛点", "reviews"],
  ["差异化", "differentiation"],
  ["FAQ", "faq"],
  ["图片", "images"],
];

const qualityChecks = [
  "英文内容避免逐字翻译",
  "未使用竞品品牌词",
  "避免 best、guaranteed、medical、heavy-duty 等高风险词",
];

const complianceNotes = [
  "不要写 best、#1、guaranteed 这类无法证明的绝对化承诺。",
  "没有测试数据时，不要写 heavy-duty、extra strong 或具体承重。",
  "非医疗产品不要写 medical、therapeutic、cure、pain relief 等医疗暗示。",
  "不要堆砌竞品品牌词或可能侵权的商标词。",
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

function createEmptyResult(project?: ProjectData | null): GenerationResult {
  return {
    source: "pending",
    product: {
      nameCn: project?.product_name_cn || "Amazon Listing 项目",
      marketplace: project?.marketplace || "US",
      category: project?.category || "Uncategorized",
    },
    analysis: {
      coreSellingPoints: [],
      beginnerExplanation: "",
    },
    title: {
      english: "",
      chinese: "",
    },
    bullets: [],
    description: {
      english: "",
      chinese: "",
    },
    searchTerms: {
      english: "",
      chinese: "",
    },
    faq: [],
    imageSuggestions: [],
    copyReadyListing: "",
  };
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
  const [displayResult, setDisplayResult] = useState<GenerationResult>(() => createEmptyResult());
  const [displayModel, setDisplayModel] = useState("mock-local");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const hasDeepSeekResult = displayResult.source === "deepseek" && displayModel !== "mock-local";

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
          .select("product_name_cn,product_name_en,marketplace,category,target_price,target_customer,form_data,status")
          .eq("id", projectId)
          .maybeSingle();

        if (projectError) {
          throw projectError;
        }

        if (project) {
          const typedProject = project as ProjectData;
          setProjectData(typedProject);
          setDisplayResult(createEmptyResult(typedProject));
        }

        const { data, error } = await supabase
          .from("generation_results")
          .select("created_at,model,result_json")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data?.created_at) {
          const normalizedSavedResult = normalizeGenerationResult(data.result_json);

          if (data.result_json && normalizedSavedResult.source === "deepseek" && data.model !== "mock-local") {
            setDisplayResult(normalizedSavedResult);
            setDisplayModel(data.model || "deepseek-chat");
            setSavedAt(String(data.created_at).slice(0, 19).replace("T", " "));
            setStatusMessage("已读取到 Supabase 中保存过的 DeepSeek 生成结果。");
          } else {
            setSavedAt("");
            setDisplayModel("mock-local");
            setStatusMessage("已忽略历史非 DeepSeek 结果。请点击重新生成，获取 DeepSeek 正式结果。");
          }
        }
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
    resultJson: GenerationResult,
    model = "mock-local",
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

    if (model === "mock-local" || resultJson.source === "mock") {
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
        input_snapshot: {
          source: "deepseek",
          saved_from: "result_page",
          project: projectData,
        },
        result_json: resultJson,
      });

      if (insertError) {
        throw insertError;
      }

      await supabase
        .from("product_projects")
        .update({ status: "Generated" })
        .eq("id", projectId);

      const now = new Date().toLocaleString("zh-CN", { hour12: false });
      setDisplayResult(normalizeGenerationResult(resultJson));
      setDisplayModel(model);
      setSavedAt(now);
      setStatusMessage(
        "DeepSeek 生成结果已保存到 Supabase。",
      );
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
    await saveGeneratedResult(displayResult, displayModel);
  }

  async function regenerateListing() {
    setIsGenerating(true);
    setStatusMessage("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      const response = await fetch("/api/generate-listing", {
        method: "POST",
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

      if (!response.ok) {
        throw new Error(data?.error || "生成失败，请稍后再试。");
      }

      if (projectId !== "demo" && data.source !== "deepseek") {
        throw new Error(data.fallbackReason || "生成接口返回了非 DeepSeek 正式结果，已停止保存。请检查 DeepSeek 配置。");
      }

      const normalizedResult = normalizeGenerationResult(data.result, projectData || undefined);
      const projectProduct = projectData
        ? {
            ...normalizedResult.product,
            nameCn: projectData.product_name_cn || normalizedResult.product.nameCn,
            marketplace: projectData.marketplace || normalizedResult.product.marketplace,
            category: projectData.category || normalizedResult.product.category,
          }
        : normalizedResult.product;
      const generatedResult =
        data.source === "deepseek"
          ? ({
              ...normalizedResult,
              product: projectProduct,
              source: "deepseek",
            } as GenerationResult)
          : ({
              ...normalizedResult,
              product: projectProduct,
            } as GenerationResult);

      if (projectId !== "demo") {
        setDisplayResult(generatedResult);
        setDisplayModel(data.model || "mock-local");
        setStatusMessage(
          data.source === "deepseek"
            ? "已生成结果，正在后台保存到 Supabase。"
            : data.fallbackReason || "生成接口返回了非正式结果，已停止保存。请检查 DeepSeek 配置。",
        );
        void saveGeneratedResult(generatedResult, data.model || "mock-local", {
          clearStatus: false,
        });
      } else {
        setDisplayResult(generatedResult);
        setDisplayModel(data.model || "mock-local");
        setStatusMessage(
          data.source === "deepseek"
            ? "已调用 DeepSeek 生成结果。当前是 demo 项目，所以没有写入数据库。"
            : data.fallbackReason || "当前未生成 DeepSeek 正式结果。",
        );
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

  const displayBullets = displayResult.bullets || [];
  const displayFaq = displayResult.faq || [];
  const displayImages = displayResult.imageSuggestions || [];
  const copyReadyListing = displayResult.copyReadyListing || "";
  const titleCopyText = displayResult.title.english;
  const bulletCopyText = displayBullets.map((bullet) => bullet.english).filter(Boolean).join("\n");
  const descriptionCopyText = displayResult.description.english;
  const searchTermsCopyText = displayResult.searchTerms.english;
  const currentDeliveryStats = [
    ["11", "结果模块"],
    [String(displayBullets.length), "Bullet Points"],
    [String(displayImages.length), "图片建议"],
    ["100%", "中文参照"],
  ];
  const productName = projectData?.product_name_cn || displayResult.product?.nameCn || "当前产品";
  const formData = projectData?.form_data || {};
  const analysisItems = [
    ["选品可行性", `围绕“${productName}”的真实资料判断卖点、使用场景和买家需求，不使用默认 demo 产品。`],
    ["目标用户", String(projectData?.target_customer || formData.target_user || "根据用户填写的目标用户和使用场景生成。")],
    ["使用场景", String(formData.usage_scenarios || "根据用户填写的使用场景生成，未填写时不编造具体场景。")],
    ["风险提醒", "不要夸大承重、功效、材质、认证或医疗属性；没有证据的数据不要写进 Listing。"],
  ];
  const competitorItems = [
    [
      "常见竞品表达",
      "Use the competitor titles and selling points provided by the user to identify reusable keyword patterns.",
      "基于用户填写的竞品标题和卖点，提炼可借鉴的关键词表达。",
    ],
    [
      "可借鉴点",
      "Keep wording practical and specific. Buyers respond better to clear use cases than broad lifestyle claims.",
      "表达要具体、实用，优先说明真实场景，而不是空泛营销。",
    ],
    [
      "可突破点",
      "Highlight differences that can be supported by the product materials, images, or specifications.",
      "差异化必须能被产品、图片或参数证明，不要编造卖点。",
    ],
  ];
  const reviewPainItems = [
    ["资料完整度", "评论痛点会根据用户填写的差评或顾虑生成；未填写时不套用 demo 痛点。"],
    ["买家担心", "把真实顾虑反向写成清晰 Bullet，但不要承诺无法证明的效果。"],
    ["售后风险", "如果资料缺少尺寸、材质或限制，结果页会提醒补充，而不是自动填充。"],
  ];
  const differentiationItems = String(formData.differentiation || "")
    .split(/[，,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  const safeDifferentiationItems =
    differentiationItems.length > 0
      ? differentiationItems
      : ["核心功能", "使用场景", "目标用户", "风险边界"];

  return (
    <main className="min-h-screen px-5 pb-28 pt-6 sm:px-8 sm:pb-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between">
          <BrandLink />
          <Link href="/projects/new">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              返回编辑
            </Button>
          </Link>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <PageHeader
            title="AI Listing 交付结果"
            description="英文内容可直接用于 Amazon Listing，每个关键输出都带中文参照、结构说明和新手提示。"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[31rem]">
            <CopyButton text={copyReadyListing} label="复制英文 Listing" size="md" />
            <Button
              data-testid="regenerate-listing-button"
              variant="secondary"
              onClick={regenerateListing}
              disabled={isGenerating}
            >
              <RefreshCw className="size-4" />
              {isGenerating ? "生成中" : "重新生成"}
            </Button>
            <Button variant="warm" onClick={saveCurrentResult} disabled={isSaving || !hasDeepSeekResult}>
              <Save className="size-4" />
              {isSaving ? "保存中" : "保存结果"}
            </Button>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-6 rounded-lg border border-line bg-paper p-4 text-sm leading-6 text-neutral-700">
            {statusMessage}
            {savedAt ? <span className="ml-2 font-semibold text-ink">保存时间：{savedAt}</span> : null}
          </div>
        ) : null}

        {projectData ? (
          <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm leading-6 text-neutral-600">
            当前生成使用真实项目资料：
            <span className="ml-1 font-semibold text-ink">{projectData.product_name_cn}</span>
            <span className="mx-2 text-neutral-300">/</span>
            Amazon {projectData.marketplace || "US"}
            <span className="mx-2 text-neutral-300">/</span>
            {projectData.category || "Uncategorized"}
          </div>
        ) : null}

        <Card className="mt-8 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.58fr]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone={hasDeepSeekResult ? "green" : "warm"}>
                    {hasDeepSeekResult ? "DeepSeek Result" : "Not Generated"}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold text-ink">
                    {displayResult.product?.nameCn || "Amazon Listing 项目"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Amazon {displayResult.product?.marketplace || "US"} /{" "}
                    {displayResult.product?.category || "Uncategorized"} / 双语解释
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-neutral-600">
                  <Copy className="size-4" />
                  可分模块复制
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {currentDeliveryStats.map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-paper p-3">
                    <p className="text-2xl font-semibold text-ink">{value}</p>
                    <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-line bg-paper p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-gold" />
                <p className="text-sm font-semibold text-ink">合规与质量检查</p>
              </div>
              <div className="mt-4 space-y-3">
                {qualityChecks.map((check) => (
                  <div key={check} className="flex gap-2 text-sm leading-6 text-neutral-600">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-gold" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

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
                Result Modules
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
                每个模块都可单独复制；英文为主，中文用于检查含义和新手理解。
              </div>
            </Card>
          </aside>

          <div className="grid gap-5">
          <ResultBlock
            id="title"
            title="Amazon Title"
            eyebrow="Title"
            description="英文标题优先展示，可直接复制到 Amazon 后台。"
            copyText={titleCopyText}
            copyLabel="Copy Title"
          >
            <BilingualPanel
              title="英文标题"
              english={displayResult.title.english}
              chinese={displayResult.title.chinese}
              note="标题结构应围绕核心关键词、产品形态、真实使用场景和明确买家需求。"
            />
          </ResultBlock>

          <ResultBlock
            id="bullets"
            title="Bullet Points"
            eyebrow="5 Key Bullets"
            description="5 条英文 Bullet Points 优先用于 Amazon Listing，中文只作理解参考。"
            copyText={bulletCopyText}
            copyLabel="Copy Bullet Points"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {displayBullets.map((bullet, index) => (
                <article
                  key={`${bullet.english}-${index}`}
                  className="border-b border-line px-4 py-5 last:border-b-0 sm:px-5 sm:py-6"
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
                      label="复制英文"
                      className="w-full shrink-0 sm:w-auto"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:ml-12">
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="text-xs font-semibold text-neutral-400">中文参照</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">{bullet.chinese}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <MetaLine label="对应卖点" value={bullet.sellingPoint} />
                      <MetaLine label="用户痛点" value={bullet.painPoint} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="description"
            title="Product Description"
            eyebrow="Description"
            description="可放进后台的英文商品描述，中文解释仅作参考。"
            copyText={descriptionCopyText}
            copyLabel="Copy Description"
          >
            <BilingualPanel
              title="后台可用版本"
              english={displayResult.description.english}
              chinese={displayResult.description.chinese}
              note="Product Description 可以比 Bullet 更自然，但仍然要避免夸大承诺。"
            />
          </ResultBlock>

          <ResultBlock
            id="search-terms"
            title="Search Terms"
            eyebrow="Backend Search Terms"
            description="后台关键词以英文为主，避免重复标题关键词和竞品品牌词。"
            copyText={searchTermsCopyText}
            copyLabel="Copy Search Terms"
          >
            <BilingualPanel
              title="Backend Search Terms"
              english={displayResult.searchTerms.english}
              chinese={displayResult.searchTerms.chinese}
              note="这些词适合放在 Amazon 后台 Search Terms。不要堆砌竞品品牌词，也不要使用可能侵权的商标词。"
            />
          </ResultBlock>

          <ResultBlock
            id="compliance"
            title="Compliance Notes / 风险提醒"
            eyebrow="Compliance"
            description="这些词和表达需要谨慎使用，避免 Listing 风险。"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {complianceNotes.map((note, index) => (
                <div
                  key={note}
                  className="flex gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amberSoft text-xs font-semibold text-[#8a5a1e]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-neutral-700">{note}</p>
                </div>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="analysis"
            title="选品与上新分析"
            eyebrow="Product Analysis"
            description="先判断产品适合卖给谁、解决什么问题，以及哪些表述需要谨慎。"
          >
            <div className="grid overflow-hidden rounded-lg border border-line bg-white md:grid-cols-2">
              {analysisItems.map(([title, desc], index) => (
                <div
                  key={title}
                  className="border-b border-line px-4 py-4 last:border-b-0 md:border-r md:[&:nth-child(2n)]:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0 sm:px-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Insight {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-orange-200 bg-amberSoft p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#8a5a1e]" />
                <div>
                  <p className="text-sm font-semibold text-[#8a5a1e]">需要补充的信息</p>
                  <p className="mt-2 text-sm leading-6 text-[#8a5a1e]">
                    建议补充准确尺寸、材质、包装内容、使用限制和真实测试数据。没有数据时，Listing 不会写
                    heavy-duty、guaranteed、medical 这类容易带来风险的词。
                  </p>
                </div>
              </div>
            </div>
            <SoftNote label="小白解释">
              这个分析帮你先判断“产品应该卖给谁、解决什么问题、哪些话不能乱写”，避免直接生成一段看似漂亮但不准确的 Listing。
            </SoftNote>
          </ResultBlock>

          <ResultBlock
            id="competitors"
            title="竞品分析"
            eyebrow="Competitor Analysis"
            description="把竞品表达拆开看，找到可以借鉴和可以避开的地方。"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {competitorItems.map(([title, english, chinese]) => (
                <article key={title} className="border-b border-line px-4 py-5 last:border-b-0 sm:px-5">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-3 text-base font-medium leading-7 text-ink">{english}</p>
                  <div className="mt-3 rounded-lg bg-neutral-50 px-4 py-3">
                    <p className="text-xs font-semibold text-neutral-400">中文参照</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{chinese}</p>
                  </div>
                </article>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="reviews"
            title="评论痛点分析"
            eyebrow="Review Pain Points"
            description="从评论里提炼买家担心什么，再反向写进 Listing。"
          >
            <div className="grid overflow-hidden rounded-lg border border-line bg-white md:grid-cols-3">
              {reviewPainItems.map(([title, desc], index) => (
                <div
                  key={title}
                  className="border-b border-line px-4 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:px-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                    Pain {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{desc}</p>
                </div>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="differentiation"
            title="差异化卖点提炼"
            eyebrow="Differentiation"
            description="把普通功能整理成更明确的购买理由。"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {safeDifferentiationItems.map((item, index) => (
                <div
                  key={item}
                  className="grid gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:px-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amberSoft text-xs font-semibold text-[#8a5a1e]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-ink">{item}</p>
                  </div>
                  <p className="text-sm leading-6 text-neutral-600">
                    适合放进标题或 Bullet，但需要结合真实尺寸和材质信息，不要编造数据。
                  </p>
                </div>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="faq"
            title="FAQ"
            eyebrow="Buyer Questions"
            description="提前回答买家可能会问的问题，减少理解成本。"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {displayFaq.map((item, index) => (
                <article
                  key={item.question.english}
                  className="border-b border-line px-4 py-5 last:border-b-0 sm:px-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                        Question {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7 text-ink">
                        {item.question.english}
                      </p>
                    </div>
                    <CopyButton
                      text={`${item.question.english}\n${item.answer.english}`}
                      label="复制英文"
                      className="w-full shrink-0 sm:w-auto"
                    />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="text-xs font-semibold text-neutral-400">问题中文参照</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {item.question.chinese}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-white px-4 py-3">
                      <LanguageLabel>English Answer</LanguageLabel>
                      <p className="mt-2 text-sm font-medium leading-7 text-ink sm:text-base">
                        {item.answer.english}
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="text-xs font-semibold text-neutral-400">回答中文参照</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {item.answer.chinese}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </ResultBlock>

          <ResultBlock
            id="images"
            title="图片建议"
            eyebrow="Image Suggestions"
            description="告诉新手每张图应该拍什么、突出什么，以及怎么给设计师下需求。"
          >
            <div className="grid overflow-hidden rounded-lg border border-line bg-white md:grid-cols-2">
              {displayImages.map((image, index) => (
                <article
                  key={image.type}
                  className="border-b border-line px-4 py-5 last:border-b-0 md:border-r md:last:border-r-0 md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(2n)]:border-r-0 sm:px-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amberSoft text-xs font-semibold text-[#8a5a1e]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{image.type}</p>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        <span className="font-semibold text-ink">突出卖点：</span>
                        {image.focus}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3">
                    <p className="text-xs font-semibold text-neutral-400">中文执行说明</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{image.guidance}</p>
                  </div>
                </article>
              ))}
            </div>
          </ResultBlock>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/92 p-3 shadow-[0_-12px_35px_rgba(23,23,23,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] gap-2">
          <CopyButton text={copyReadyListing} label="复制英文 Listing" size="md" className="w-full" />
          <Button
            variant="warm"
            size="md"
            aria-label="保存结果"
            onClick={saveCurrentResult}
            disabled={isSaving || !hasDeepSeekResult}
          >
            <Save className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function BilingualPanel({
  title,
  english,
  chinese,
  note,
}: {
  title: string;
  english: string;
  chinese: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-neutral-500">{title}</p>
        <Badge tone="neutral">双语参照</Badge>
      </div>
      <div className="mt-4">
        <LanguageLabel>English</LanguageLabel>
        <p className="mt-2 text-base font-semibold leading-7 text-ink">{english}</p>
      </div>
      <ChineseReference>{chinese}</ChineseReference>
      {note ? <SoftNote label="说明">{note}</SoftNote> : null}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2.5">
      <p className="text-[11px] font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-700">{value}</p>
    </div>
  );
}

function LanguageLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </p>
  );
}

function ChineseReference({
  children,
  compact = false,
}: {
  children: string;
  compact?: boolean;
}) {
  return (
    <div className={`mt-3 rounded-lg bg-neutral-50 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs font-semibold text-neutral-400">中文参照</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{children}</p>
    </div>
  );
}

function SoftNote({ label, children }: { label: string; children: string }) {
  return (
    <div className="mt-3 rounded-lg bg-amberSoft p-4 text-sm leading-6 text-[#8a5a1e]">
      <p className="text-xs font-semibold text-[#9a681f]">{label}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}
