type SupabaseGenerationAuthInput = {
  projectId: string;
  supabaseReady: boolean;
};

export function shouldUseSupabaseGenerationAuth({
  projectId,
  supabaseReady,
}: SupabaseGenerationAuthInput) {
  return supabaseReady && Boolean(projectId) && projectId !== "demo";
}
