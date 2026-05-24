const steps = [
  ["产品资料输入", "用中文整理产品、场景、竞品和评论，不需要一开始就会写英文。"],
  ["卖点分析", "先看产品适合卖给谁、解决什么问题、哪些表达需要谨慎。"],
  ["地道翻译", "把中文资料改写成 Amazon 买家更熟悉的自然英文。"],
  ["Listing 生成", "生成标题、五点描述、商品描述、FAQ 和关键词。"],
  ["中文参照解释", "每段英文下方都有中文解释，新手知道每句话在卖什么。"],
  ["复制使用", "结果可分模块复制，也可以一键复制完整 Listing。"],
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
            从资料整理到 Listing 输出，每一步都围绕 Amazon 新手最容易卡住的环节设计。
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
