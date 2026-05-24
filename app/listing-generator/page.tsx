import { MockToolPage } from "@/components/tools/mock-tool-page";
import { getMvpTool } from "@/lib/mvp-tools";

export default function ListingGeneratorPage() {
  return <MockToolPage tool={getMvpTool("listing-generator")!} />;
}
