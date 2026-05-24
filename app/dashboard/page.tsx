"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Clock3,
  FileText,
  Image,
  ListChecks,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import { BrandLink } from "@/components/layout/brand-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { projects as mockProjects } from "@/lib/mock-data";
import { mvpTools } from "@/lib/mvp-tools";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Marketplace, Project } from "@/lib/types";

type ProductProjectRow = {
  id: string;
  product_name_cn: string;
  product_name_en: string | null;
  category: string | null;
  marketplace: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: "Draft" | "Generated" | null;
};

const workspaceTips = [
  "先补齐中文资料，再生成英文 Listing",
  "生成结果会逐段附中文参照",
  "项目数据已从 Supabase 读取",
];

const toolIcons = {
  sparkles: Sparkles,
  chart: BarChart3,
  list: ListChecks,
  tags: Tags,
  image: Image,
};

function mapProject(row: ProductProjectRow): Project {
  const marketplace: Marketplace =
    row.marketplace === "UK" || row.marketplace === "CA" || row.marketplace === "AU"
      ? row.marketplace
      : "US";

  return {
    id: row.id,
    productNameCn: row.product_name_cn,
    productNameEn: row.product_name_en || "",
    category: row.category || "Uncategorized",
    marketplace,
    createdAt: row.created_at?.slice(0, 10) || "",
    updatedAt: row.updated_at?.slice(0, 10) || "",
    status: row.status === "Generated" ? "Generated" : "Draft",
  };
}

function clearAuthCookies() {
  document.cookie = "work_up_access_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "work_up_refresh_token=; path=/; max-age=0; samesite=lax";
}

export default function DashboardPage() {
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [created, setCreated] = useState(false);
  const [dashboardProjects, setDashboardProjects] = useState<Project[]>(
    supabaseReady ? [] : mockProjects,
  );
  const [isLoading, setIsLoading] = useState(supabaseReady);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setCreated(new URLSearchParams(window.location.search).get("created") === "1");

    if (!supabaseReady) {
      setDashboardProjects(mockProjects);
      setIsLoading(false);
      return;
    }

    async function loadProjects() {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from("product_projects")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          throw error;
        }

        setDashboardProjects(((data || []) as ProductProjectRow[]).map(mapProject));
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? `读取项目失败：${error.message}`
            : "读取项目失败，请检查 Supabase 表结构和 RLS 策略。",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, [supabaseReady]);

  async function signOut() {
    try {
      if (supabaseReady) {
        await getBrowserSupabase().auth.signOut();
      }
    } finally {
      clearAuthCookies();
      window.location.href = "/login";
    }
  }

  const focusProject = dashboardProjects[0] || mockProjects[0];
  const stats = useMemo(
    () => [
      {
        label: "全部项目",
        value: dashboardProjects.length,
        description: "当前账号下的项目总数",
        icon: FileText,
      },
      {
        label: "已生成",
        value: dashboardProjects.filter((project) => project.status === "Generated").length,
        description: "可直接查看双语 Listing 结果",
        icon: Sparkles,
      },
      {
        label: "草稿",
        value: dashboardProjects.filter((project) => project.status === "Draft").length,
        description: "可继续补充资料并生成",
        icon: Clock3,
      },
    ],
    [dashboardProjects],
  );

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between">
          <BrandLink />
          <Button variant="secondary" size="sm" onClick={signOut}>
            退出登录
          </Button>
        </nav>

        <PageHeader
          title="项目工作台"
          description="查看历史项目、继续编辑草稿，或进入 MVP 功能页体验前端 mock 生成流程。"
          action={
            <Link href="/projects/new">
              <Button size="lg">
                新建 Listing
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          }
        />

        {created ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
            Draft 项目已保存，并会出现在下方真实项目列表中。
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-6 rounded-lg border border-orange-200 bg-amberSoft p-4 text-sm leading-6 text-[#8a5a1e]">
            {loadError}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">MVP 功能入口</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                每个功能页都先提供前端输入、生成按钮、loading 状态和 mock 结果。
              </p>
            </div>
            <Badge tone="warm">Frontend Mock</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {mvpTools.map((tool) => {
              const Icon = toolIcons[tool.icon];

              return (
                <Link key={tool.slug} href={`/${tool.slug}`}>
                  <Card className="h-full p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="grid size-10 place-items-center rounded-lg bg-neutral-100 text-ink">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-ink">{tool.titleCn}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                      {tool.description}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                      打开
                      <ArrowRight className="size-4" />
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-white px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {dashboardProjects.length > 0 ? "最近项目" : "项目起点"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink">
                    {dashboardProjects.length > 0 ? focusProject.productNameCn : "还没有真实项目"}
                  </h2>
                </div>
                <Badge tone={dashboardProjects.length > 0 ? "green" : "neutral"}>
                  {dashboardProjects.length > 0 ? focusProject.status : "Empty"}
                </Badge>
              </div>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-[1fr_0.82fr]">
              <div>
                <p className="text-sm leading-6 text-neutral-600">
                  {dashboardProjects.length > 0
                    ? "这个项目已保存到 Supabase。后续接入 DeepSeek 后，可以在这里生成和查看双语 Listing。"
                    : "先创建一个 Amazon Listing 项目，保存后会显示在真实项目列表里。"}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["站点", `Amazon ${focusProject.marketplace}`],
                    ["类目", focusProject.category],
                    ["更新", focusProject.updatedAt || "-"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-paper p-3">
                      <p className="text-xs font-semibold text-neutral-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-paper p-4">
                <p className="text-sm font-semibold text-ink">下一步建议</p>
                <div className="mt-3 space-y-3">
                  {workspaceTips.map((tip) => (
                    <div key={tip} className="flex gap-2 text-sm leading-6 text-neutral-600">
                      <ArrowRight className="mt-1 size-4 shrink-0 text-gold" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={dashboardProjects.length > 0 ? `/projects/${focusProject.id}/result` : "/projects/new"}
                  className="mt-5 block"
                >
                  <Button className="w-full">
                    {dashboardProjects.length > 0 ? "查看结果页" : "新建 Listing"}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-500">工作区状态</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">
                  {supabaseReady ? "Supabase Workspace" : "Mock Workspace"}
                </h2>
              </div>
              <div className="grid size-11 place-items-center rounded-lg bg-amberSoft text-[#8a5a1e]">
                <Sparkles className="size-5" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["当前阶段", supabaseReady ? "浏览器端 Auth + Draft 保存" : "高质量 UI 与 mock 数据"],
                ["数据状态", isLoading ? "正在读取项目" : supabaseReady ? "读取 product_projects" : "未配置 .env.local"],
                ["AI 阶段", "下一步接入 DeepSeek Listing 生成接口"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-white p-3">
                  <p className="text-sm text-neutral-500">{label}</p>
                  <p className="text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-ink">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-500">{stat.description}</p>
                  </div>
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-neutral-100 text-ink">
                    <Icon className="size-4" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">真实项目</h2>
              <p className="mt-1 text-sm text-neutral-500">
                这里读取当前登录用户在 Supabase 中保存的项目。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3 text-sm text-neutral-500 shadow-hairline">
                <Search className="size-4" />
                搜索项目
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {["全部", "Draft", "Generated", "Amazon US"].map((filter, index) => (
                  <button
                    key={filter}
                    type="button"
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      index === 0
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-neutral-600 hover:border-neutral-300 hover:text-ink"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <Card className="p-6 text-sm leading-6 text-neutral-600">
              正在读取 Supabase 项目...
            </Card>
          ) : null}

          {!isLoading && dashboardProjects.length === 0 ? (
            <Card className="p-6 text-sm leading-6 text-neutral-600">
              还没有项目。点击右上角“新建 Listing”，创建第一个 Amazon 产品项目。
            </Card>
          ) : null}

          <div className="grid gap-4">
            {dashboardProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_0.75fr_0.6fr_0.75fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-ink">{project.productNameCn}</h2>
                      <Badge tone={project.status === "Generated" ? "green" : "neutral"}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{project.productNameEn || "英文名待生成"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">类目</p>
                    <p className="mt-1 text-sm font-medium text-ink">{project.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">站点</p>
                    <p className="mt-1 text-sm font-medium text-ink">Amazon {project.marketplace}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">更新时间</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                      <CalendarClock className="size-4 text-neutral-400" />
                      {project.updatedAt || "-"}
                    </p>
                  </div>
                  <Link href={project.status === "Generated" ? `/projects/${project.id}/result` : "/projects/new"}>
                    <Button
                      variant={project.status === "Generated" ? "primary" : "secondary"}
                      className="w-full lg:w-auto"
                    >
                      {project.status === "Generated" ? "查看结果" : "继续编辑"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="border-t border-line bg-paper px-5 py-3">
                  <div className="flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      {project.status === "Generated"
                        ? "已生成双语 Listing，可查看、复制或重新生成。"
                        : "草稿已保存，后续可接入 DeepSeek 生成双语 Listing。"}
                    </p>
                    <p className="text-xs font-semibold text-neutral-400">
                      Created {project.createdAt || "-"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
