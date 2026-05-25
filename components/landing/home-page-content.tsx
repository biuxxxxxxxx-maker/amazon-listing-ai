"use client";

import { useRouter } from "next/navigation";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProcessStrip } from "@/components/landing/process-strip";
import { mockGenerationResult } from "@/lib/mock-generation-result";

export function HomePageContent() {
  const router = useRouter();
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  function startListingFlow() {
    const hasSessionCookie = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("work_up_access_token="));

    router.push(!supabaseReady || hasSessionCookie ? "/projects/new" : "/login");
  }

  return (
    <main>
      <Hero
        result={mockGenerationResult}
        isGenerating={false}
        demoMode={false}
        statusMessage=""
        errorMessage=""
        onGenerate={startListingFlow}
      />
      <ProcessStrip />
      <FeatureGrid />
      <FinalCta isGenerating={false} onGenerate={startListingFlow} />
    </main>
  );
}
