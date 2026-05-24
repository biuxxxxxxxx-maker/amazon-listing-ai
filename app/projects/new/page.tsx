import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingWizard } from "@/components/project-form/listing-wizard";
import { BrandLink } from "@/components/layout/brand-link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const projectErrors: Record<string, string> = {
  missing_env: "Supabase 环境变量还没配置。请先填写 .env.local，再保存 Draft。",
  save_failed: "项目保存失败，请检查登录状态、数据库表和 RLS 策略。",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const error = typeof params.error === "string" ? projectErrors[params.error] : null;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <BrandLink />
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              返回工作台
            </Button>
          </Link>
        </nav>
        <PageHeader
          title="创建 Amazon Listing 项目"
          description="按步骤填写中文资料、竞品信息和生成偏好。第一阶段使用 mock 数据展示完整体验。"
        />
        {error ? (
          <div className="mt-6 rounded-lg border border-orange-200 bg-amberSoft p-4 text-sm leading-6 text-[#8a5a1e]">
            <div className="mb-1 flex items-center gap-2">
              <Badge tone="warm">保存提示</Badge>
            </div>
            {error}
          </div>
        ) : null}
        <div className="mt-10">
          <ListingWizard />
        </div>
      </div>
    </main>
  );
}
