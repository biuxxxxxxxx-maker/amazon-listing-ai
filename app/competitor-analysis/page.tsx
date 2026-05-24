import { MockToolPage } from "@/components/tools/mock-tool-page";
import { getMvpTool } from "@/lib/mvp-tools";

export default function CompetitorAnalysisPage() {
  return <MockToolPage tool={getMvpTool("competitor-analysis")!} />;
}
