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
  mockGenerationResult,
  normalizeGenerationResult,
  type GenerationResult,
} from "@/lib/mock-generation-result";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const resultNavItems = [
  ["分析", "analysis"],
  ["竞品", "competitors"],
  ["痛点", "reviews"],
  ["差异化", "differentiation"],
  ["翻译", "translation"],
  ["标题", "title"],
  ["五点", "bullets"],
  ["描述", "description"],
  ["关键词", "search-terms"],
  ["FAQ", "faq"],
  ["图片", "images"],
];

const qualityChecks = [
  "英文内容避免逐字翻译",
  "未使用竞品品牌词",
  "缺少承重数据时不夸大",
];

const nativeTranslation = {
  title: "供应商中文资料改写",
  english:
    "A collapsible storage basket designed for everyday organization in small spaces, closets, laundry rooms, and car trunks.",
  chinese: "一款适合小空间、衣柜、洗衣房和汽车后备箱日常整理使用的可折叠收纳篮。",
  note:
    "翻译说明：英文没有逐字翻译“家庭多场景使用”，而是改成 Amazon 买家更容易搜索和理解的具体使用场景。",
};

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
  const [displayResult, setDisplayResult] = useState<GenerationResult>(mockGenerationResult);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

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
          setProjectData(project as ProjectData);
          setDisplayResult(
            normalizeGenerationResult({
              ...mockGenerationResult,
              product: {
                nameCn: project.product_name_cn,
                marketplace: project.marketplace,
                category: project.category,
              },
            }),
          );
        }

        const { data, error } = await supabase
          .from("generation_results")
          .select("created_at,result_json")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data?.created_at) {
          if (data.result_json) {
            setDisplayResult(normalizeGenerationResult(data.result_json));
          }
          setSavedAt(String(data.created_at).slice(0, 19).replace("T", " "));
          setStatusMessage("已读取到 Supabase 中保存过的生成结果。");
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
    resultJson: GenerationResult = mockGenerationResult,
    model = "mock-local",
    options: { clearStatus?: boolean } = {},
  ) {
    if (!supabaseReady) {
      setStatusMessage("Supabase 环境变量未配置，当前只能查看 mock 结果。");
      return;
    }

    if (projectId === "demo") {
      setStatusMessage("当前是 demo 项目，不能保存到数据库。请先创建真实项目再保存结果。");
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
          source: "local-mvp",
          saved_from: "result_page",
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
      setSavedAt(now);
      setStatusMessage(
        model === "mock-local"
          ? "Mock 生成结果已保存到 Supabase。"
          : "DeepSeek 生成结果已保存到 Supabase。",
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

  async function saveMockResult() {
    await saveGeneratedResult(mockGenerationResult, "mock-local");
  }

  async function regenerateListing() {
    setIsGenerating(true);
    setStatusMessage("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

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
          projectData:
            projectId === "demo"
              ? {
                  product_name_cn: "便携式折叠收纳篮",
                  marketplace: "US",
                  category: "Home & Kitchen",
                }
              : projectData,
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

      const normalizedResult = normalizeGenerationResult(data.result);

      if (projectId !== "demo") {
        setDisplayResult(normalizedResult);
        setStatusMessage(
          data.source === "deepseek"
            ? "已生成结果，正在后台保存到 Supabase。"
            : data.fallbackReason || "已返回 mock 生成结果，正在后台保存到 Supabase。",
        );
        void saveGeneratedResult(normalizedResult, data.model || "mock-local", {
          clearStatus: false,
        });
      } else {
        setDisplayResult(normalizedResult);
        setStatusMessage(
          data.source === "deepseek"
            ? "已调用 DeepSeek 生成结果。当前是 demo 项目，所以没有写入数据库。"
            : data.fallbackReason || "当前未配置 DEEPSEEK_API_KEY，已返回 mock 生成结果。",
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setDisplayResult(mockGenerationResult);
        setStatusMessage("生成请求响应较慢，已先显示本地 mock 结果，避免页面长时间等待。");
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

  const displayBullets =
    displayResult.bullets?.length === 5 ? displayResult.bullets : mockGenerationResult.bullets;
  const displayFaq = displayResult.faq?.length ? displayResult.faq : mockGenerationResult.faq;
  const displayImages = displayResult.imageSuggestions?.length
    ? displayResult.imageSuggestions
    : mockGenerationResult.imageSuggestions;
  const copyReadyListing = displayResult.copyReadyListing || mockGenerationResult.copyReadyListing;
  const titleCopyText = formatBilingualCopy({
    title: "Amazon 标题",
    english: displayResult.title.english,
    chinese: displayResult.title.chinese,
    note: "标题结构：核心关键词 / 产品形态 / 使用场景 / 小空间需求 / 家居风格。",
  });
  const translationCopyText = formatBilingualCopy(nativeTranslation);
  const descriptionCopyText = formatBilingualCopy({
    title: "Product Description",
    english: displayResult.description.english,
    chinese: displayResult.description.chinese,
    note: "小白提示：Product Description 可以比 Bullet 更自然，但仍然要避免夸大承诺。",
  });
  const searchTermsCopyText = formatBilingualCopy({
    title: "Backend Search Terms",
    english: displayResult.searchTerms.english,
    chinese: displayResult.searchTerms.chinese,
    note: "小白提示：这些词适合放在 Amazon 后台 Search Terms。不要堆砌竞品品牌词，也不要使用可能侵权的商标词。",
  });
  const currentDeliveryStats = [
    ["11", "结果模块"],
    [String(displayBullets.length), "Bullet Points"],
    [String(displayImages.length), "图片建议"],
    ["100%", "中文参照"],
  ];

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
            <Button variant="secondary" onClick={regenerateListing} disabled={isGenerating}>
              <RefreshCw className="size-4" />
              {isGenerating ? "生成中" : "重新生成"}
            </Button>
            <Button variant="warm" onClick={saveMockResult} disabled={isSaving}>
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
                  <Badge tone={savedAt ? "green" : "warm"}>
                    {savedAt ? "Saved Result" : "Mock Generated"}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold text-ink">
                    {displayResult.product?.nameCn || "Amazon Listing 项目"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Amazon {displayResult.product?.marketplace || "US"} /{" "}
                    {displayResult.product?.category || "Home & Kitchen"} / 双语解释
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
            id="analysis"
            title="选品与上新分析"
            eyebrow="Product Analysis"
            description="先判断产品适合卖给谁、解决什么问题，以及哪些表述需要谨慎。"
          >
            <div className="grid overflow-hidden rounded-lg border border-line bg-white md:grid-cols-2">
              {[
                ["选品可行性", "适合小户型、宿舍和车载收纳场景，需求清晰，价格带适合新手测试。"],
                ["目标用户", "空间有限、希望快速整理物品的家庭用户、学生、车主和租房人群。"],
                ["使用场景", "洗衣房、衣柜、厨房储物、车后备箱、房车和儿童房。"],
                ["风险提醒", "不要夸大承重能力；如果没有测试数据，不要写 heavy-duty 或 extreme load。"],
              ].map(([title, desc], index) => (
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
                    建议补充准确展开尺寸、折叠后厚度和真实承重范围。没有数据时，Listing 不会写
                    heavy-duty、extra strong 这类容易夸大的词。
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
              {[
                [
                  "常见竞品表达",
                  "Most competing listings focus on foldable storage, easy carrying, laundry organization, and multi-room use.",
                  "多数竞品会强调可折叠收纳、方便搬运、洗衣整理和多房间使用。",
                ],
                [
                  "可借鉴点",
                  "Keep the wording practical and specific. Buyers respond better to clear use cases than broad lifestyle claims.",
                  "可以借鉴具体场景表达。比起空泛的生活方式文案，买家更容易理解明确用途。",
                ],
                [
                  "可突破点",
                  "Position the product around small-space organization and quick access instead of only saying it saves space.",
                  "不要只说节省空间，可以进一步强调小空间整理和快速拿取。",
                ],
              ].map(([title, english, chinese]) => (
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
              {[
                ["站立不稳", "Listing 里要避免过度承诺，可强调 reinforced rim helps keep shape。"],
                ["占空间", "突出 folds flat when not in use，让用户理解不用时怎么收纳。"],
                ["搬运费力", "把双侧提手作为 Bullet 核心卖点，不只放在参数里。"],
              ].map(([title, desc], index) => (
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
              {["折叠后更薄", "开放式快速拿取", "中性色家居外观", "多场景搬运"].map((item, index) => (
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
            id="translation"
            title="地道英文翻译"
            eyebrow="Native Translation"
            description="把中文供应商资料改写成更自然的 Amazon 英文表达。"
            copyText={translationCopyText}
          >
            <BilingualPanel
              title={nativeTranslation.title}
              english={nativeTranslation.english}
              chinese={nativeTranslation.chinese}
              note={nativeTranslation.note}
            />
          </ResultBlock>

          <ResultBlock
            id="title"
            title="Amazon 标题"
            eyebrow="Title"
            description="标题同时服务买家理解和 Amazon 搜索，避免空泛营销话术。"
            copyText={titleCopyText}
          >
            <BilingualPanel
              title="英文标题"
              english={displayResult.title.english}
              chinese={displayResult.title.chinese}
              note="标题结构：核心关键词 / 产品形态 / 使用场景 / 小空间需求 / 家居风格。小白提示：标题重点不是写得华丽，而是让买家和 Amazon 都能快速识别产品。"
            />
          </ResultBlock>

          <ResultBlock
            id="bullets"
            title="Bullet Points"
            eyebrow="5 Key Bullets"
            description="五点描述逐条说明卖点、中文含义和对应痛点。"
          >
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              {displayBullets.map((bullet, index) => (
                <article
                  key={bullet.english}
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
            description="适合放进后台的商品描述版本，英文自然但不夸张。"
            copyText={descriptionCopyText}
          >
            <BilingualPanel
              title="后台可用版本"
              english={displayResult.description.english}
              chinese={displayResult.description.chinese}
              note="小白提示：Product Description 可以比 Bullet 更自然，但仍然要避免夸大承诺。"
            />
          </ResultBlock>

          <ResultBlock
            id="search-terms"
            title="SEO Tags / Search Terms / 关键词"
            eyebrow="Search Terms"
            description="给后台 Search Terms 使用，并配中文解释和侵权提醒。"
            copyText={searchTermsCopyText}
          >
            <BilingualPanel
              title="Backend Search Terms"
              english={displayResult.searchTerms.english}
              chinese={displayResult.searchTerms.chinese}
              note="小白提示：这些词适合放在 Amazon 后台 Search Terms。不要堆砌竞品品牌词，也不要使用可能侵权的商标词。"
            />
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
            onClick={saveMockResult}
            disabled={isSaving}
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

function formatBilingualCopy({
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
  return [
    title,
    "",
    "English:",
    english,
    "",
    "中文参照:",
    chinese,
    note ? "" : null,
    note || null,
  ]
    .filter(Boolean)
    .join("\n");
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
