import { MockToolPage } from "@/components/tools/mock-tool-page";
import { getMvpTool } from "@/lib/mvp-tools";

export default function ProductAnalysisPage() {
  return <MockToolPage tool={getMvpTool("product-analysis")!} />;
}
