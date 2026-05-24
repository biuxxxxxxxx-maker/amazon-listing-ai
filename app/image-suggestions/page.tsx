import { MockToolPage } from "@/components/tools/mock-tool-page";
import { getMvpTool } from "@/lib/mvp-tools";

export default function ImageSuggestionsPage() {
  return <MockToolPage tool={getMvpTool("image-suggestions")!} />;
}
