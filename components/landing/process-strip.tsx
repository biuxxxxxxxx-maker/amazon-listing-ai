const steps = [
  ["产品资料输入", "用中文整理产品、场景、材质、尺寸、卖点和供应商描述。"],
  ["资料质量检查", "判断哪些信息足够支撑 Listing，哪些关键信息还缺失。"],
  ["竞品与痛点分析", "从竞品标题、五点和评论痛点中提炼关键词、机会和风险。"],
  ["Listing 策略生成", "确定主关键词、卖点排序、可用表达和需要避开的 claim。"],
  ["英文 Listing 输出", "生成 Title、5 Bullet Points、Product Description 和 Search Terms。"],
  ["中文解释与复制", "每个英文模块都有中文解释，复制时只复制英文成品。"],
];

export function ProcessStrip() {
  return (
    <section id="process" className="border-b border-line/70 px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gold">Core Flow</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
              不是翻译工具，是完整上新流程。
            </h2>
          </div>
          <p className="text-sm leading-6 text-neutral-600 lg:text-right">
            每一步都围绕真实资料、运营判断和合规边界，避免凭空编造卖点。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map(([step, desc], index) => (
            <div
              key={step}
              className="rounded-lg border border-line bg-white px-4 py-5 shadow-hairline transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-soft lg:min-h-52"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">{step}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
