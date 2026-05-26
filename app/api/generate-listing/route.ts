import { NextResponse } from "next/server";
import { generateAmazonListing, isGenerationMockEnabled, readAIProvider } from "@/lib/ai-listing";
import { readServerEnv } from "@/lib/cloudflare-env";
import { shouldUseSupabaseGenerationAuth } from "@/lib/generation-auth";
import {
  getServerSupabaseAsync,
  hasSupabaseServerEnvAsync,
  readRequestAccessToken,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getBodyText(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function buildProjectDataFromBody(body: Record<string, unknown>) {
  const flatProjectData = {
    productName: getBodyText(body, "productName"),
    productInfo: getBodyText(body, "productInfo"),
    targetAudience: getBodyText(body, "targetAudience"),
    keywords: getBodyText(body, "keywords"),
    languageMode: getBodyText(body, "languageMode") || "bilingual",
  };
  const hasFlatListingInput = Object.entries(flatProjectData).some(
    ([key, value]) => key !== "languageMode" && value.length > 0,
  );

  if (!hasFlatListingInput) {
    return body.projectData;
  }

  return {
    ...(isRecord(body.projectData) ? body.projectData : {}),
    ...flatProjectData,
  };
}

function readProjectLogFields(projectData: unknown) {
  if (!isRecord(projectData)) {
    return {
      productName: "",
      category: "",
      marketplace: "",
    };
  }

  return {
    productName:
      getBodyText(projectData, "product_name_cn") ||
      getBodyText(projectData, "productName"),
    category: getBodyText(projectData, "category"),
    marketplace: getBodyText(projectData, "marketplace"),
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = isRecord(rawBody) ? rawBody : {};
    const projectId = typeof body.projectId === "string" ? body.projectId : undefined;
    let projectData = buildProjectDataFromBody(body);
    const requiresProjectAuth = shouldUseSupabaseGenerationAuth({
      projectId: projectId || "",
      supabaseReady: true,
    });
    const allowMockFallback = await isGenerationMockEnabled();

    if (!requiresProjectAuth) {
      const generation = await generateAmazonListing({
        projectId,
        projectData,
        allowMockFallback,
      });

      return NextResponse.json(generation);
    }

    if (await hasSupabaseServerEnvAsync()) {
      const accessToken = readRequestAccessToken(request);

      if (!accessToken) {
        return NextResponse.json(
          { error: "请先登录后再生成 Listing。" },
          { status: 401 },
        );
      }

      const supabase = await getServerSupabaseAsync(accessToken);
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

      if (userError || !userData.user) {
        return NextResponse.json(
          { error: "登录状态已失效，请重新登录。" },
          { status: 401 },
        );
      }

      if (projectId && projectId !== "demo") {
        const { data: project, error: projectError } = await supabase
          .from("product_projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();

        if (projectError) {
          throw projectError;
        }

        if (!project) {
          return NextResponse.json(
            { error: "没有找到这个项目，或当前账号无权访问。" },
            { status: 404 },
          );
        }

        projectData = project;
      }
    }

    const provider = await readAIProvider();
    const model = (await readServerEnv("DEEPSEEK_MODEL")) || "deepseek-chat";
    const projectLogFields = readProjectLogFields(projectData);

    console.log("[generate-listing]", {
      provider,
      model,
      productName: projectLogFields.productName,
      category: projectLogFields.category,
      marketplace: projectLogFields.marketplace,
      mock: allowMockFallback,
    });

    const generation = await generateAmazonListing({
      projectId,
      projectData,
      allowMockFallback,
    });

    return NextResponse.json(generation);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "生成失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
