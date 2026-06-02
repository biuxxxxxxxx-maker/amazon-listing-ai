"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { BrandLink } from "@/components/layout/brand-link";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { projects as mockProjects } from "@/lib/mock-data";
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

function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  const isGenerated = status === "Generated";
  const label = isGenerated ? "已生成 / Generated" : "草稿 / Draft";

  return (
    <span
      className={
        isGenerated
          ? "inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
      }
    >
      {label}
    </span>
  );
}

function TopNav() {
  return (
    <nav className="flex h-16 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
      <div className="flex items-center gap-6">
        <BrandLink />
        <div className="hidden items-center gap-3 text-sm font-medium md:flex">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full bg-black px-5 font-semibold text-white shadow-sm transition hover:bg-slate-900"
          >
            控制台
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 px-5 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900"
          >
            新建 Listing
          </Link>
        </div>
      </div>
      <UserMenu />
    </nav>
  );
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

        const rows = Array.isArray(data) ? data : data ? [data] : [];
        setDashboardProjects((rows as ProductProjectRow[]).map(mapProject));
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

  const stats = useMemo(
    () => [
      {
        label: "全部项目",
        value: dashboardProjects.length,
        icon: FileText,
      },
      {
        label: "草稿 / Draft",
        value: dashboardProjects.filter((project) => project.status === "Draft").length,
        icon: ClipboardList,
      },
      {
        label: "已生成 / Generated",
        value: dashboardProjects.filter((project) => project.status === "Generated").length,
        icon: Sparkles,
      },
    ],
    [dashboardProjects],
  );

  return (
    <main className="min-h-screen bg-paper px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <TopNav />

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
                控制台 / Dashboard
              </p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                欢迎回来
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                继续编辑项目，或创建新的 Amazon Listing。Work UP 会帮你把中文资料转成英文 Listing，并提示缺失信息和合规风险。
              </p>
            </div>
            <Link href="/projects/new" className="w-full sm:w-auto">
              <Button className="h-12 w-full rounded-lg bg-indigo-600 px-5 text-white shadow-sm hover:bg-indigo-700 sm:w-auto">
                <Plus className="size-4" />
                新建 Listing
              </Button>
            </Link>
          </div>

          {created ? (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
              草稿项目已保存，并会出现在下方最近项目列表中。
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              {loadError}
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="size-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">最近项目</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                查看草稿和已生成项目，继续编辑或进入结果页。
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {supabaseReady ? "Supabase 项目" : "预览项目"}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
              正在读取 Supabase 项目...
            </div>
          ) : null}

          {!isLoading && dashboardProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                创建你的第一个 Amazon Listing
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                输入中文产品资料，Work UP 会生成英文 Listing 并提示缺失信息和合规风险。
              </p>
              <Link href="/projects/new" className="mt-6 inline-flex">
                <Button className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  新建 Listing
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="grid gap-4">
            {dashboardProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        {project.productNameCn}
                      </h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Amazon {project.marketplace} / {project.category}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
                      <CalendarClock className="size-4" />
                      更新于 {project.updatedAt || "-"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {project.status === "Draft" ? (
                      <Link href="/projects/new" className="w-full sm:w-auto">
                        <Button
                          variant="secondary"
                          className="h-10 w-full rounded-lg border-slate-300 text-slate-700 sm:w-auto"
                        >
                          继续编辑
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/projects/${project.id}/result`} className="w-full sm:w-auto">
                        <Button className="h-10 w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto">
                          查看结果
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/projects/${project.id}/result`} className="w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        className="h-10 w-full rounded-lg border-slate-300 text-slate-700 sm:w-auto"
                      >
                        <RefreshCw className="size-4" />
                        重新生成
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
