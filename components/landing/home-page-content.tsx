"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamplePreviewSection } from "@/components/landing/example-preview-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { ProcessStrip } from "@/components/landing/process-strip";
import { mockGenerationResult } from "@/lib/mock-generation-result";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type AuthStatus = "checking" | "authenticated" | "anonymous";

export function HomePageContent() {
  const router = useRouter();
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>(supabaseReady ? "checking" : "anonymous");
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  useEffect(() => {
    if (!supabaseReady) {
      setAuthStatus("anonymous");
      return;
    }

    let isMounted = true;
    const supabase = getBrowserSupabase();

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setAuthStatus(data.session?.user ? "authenticated" : "anonymous");
      } catch {
        if (isMounted) {
          setAuthStatus("anonymous");
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(session?.user ? "authenticated" : "anonymous");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  function startListingFlow() {
    router.push(authStatus === "authenticated" || !supabaseReady ? "/projects/new" : "/login");
  }

  function showExamplePreview() {
    setIsExampleOpen(true);
    window.history.pushState(null, "", "#workup-example");

    window.requestAnimationFrame(() => {
      document.getElementById("workup-example")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <main>
      <Hero
        result={mockGenerationResult}
        isGenerating={false}
        demoMode={false}
        statusMessage=""
        errorMessage=""
        authStatus={authStatus}
        onGenerate={startListingFlow}
        onShowExample={showExamplePreview}
      />
      <ExamplePreviewSection
        result={mockGenerationResult}
        isOpen={isExampleOpen}
        onToggle={() => setIsExampleOpen((current) => !current)}
      />
      <ProcessStrip />
      <FeatureGrid />
      <FinalCta isGenerating={false} onGenerate={startListingFlow} />
    </main>
  );
}
