import { MockToolPage } from "@/components/tools/mock-tool-page";
import { getMvpTool } from "@/lib/mvp-tools";

export default function SeoKeywordsPage() {
  return <MockToolPage tool={getMvpTool("seo-keywords")!} />;
}
