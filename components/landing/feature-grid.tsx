import {
  BadgeCheck,
  Camera,
  ClipboardCheck,
  Languages,
  Lightbulb,
  type LucideIcon,
  MessageSquareText,
  Search,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FeatureItem = {
  title: string;
  desc: string;
  icon: LucideIcon;
};

const featureGroups: Array<{ title: string; subtitle: string; items: FeatureItem[] }> = [
  {
    title: "上新前分析",
    subtitle: "先理解产品，再写 Listing",
    items: [
      { title: "选品分析", desc: "判断产品适合怎么切入 Amazon 场景。", icon: Lightbulb },
      { title: "竞品分析", desc: "提炼竞品常见卖点和可避开的同质表达。", icon: BadgeCheck },
      {
        title: "评论痛点分析",
        desc: "把差评和顾虑转化成 Listing 应回应的问题。",
        icon: MessageSquareText,
      },
      { title: "差异化卖点", desc: "把普通功能整理成更清楚的购买理由。", icon: WandSparkles },
    ],
  },
  {
    title: "Listing 生成",
    subtitle: "把中文资料变成可用英文",
    items: [
      {
        title: "地道英文翻译",
        desc: "不是逐字翻译，而是 Amazon 买家能自然理解的英文。",
        icon: Languages,
      },
      { title: "标题与五点", desc: "生成标题、Bullet Points 和 Product Description。", icon: BadgeCheck },
      { title: "SEO 关键词", desc: "输出 Search Terms、关键词解释和侵权提醒。", icon: Search },
      { title: "图片建议", desc: "告诉新手主图、场景图、尺寸图应该怎么做。", icon: Camera },
    ],
  },
  {
    title: "新手友好",
    subtitle: "让不懂英文的人也能检查",
    items: [
      { title: "中文参照解释", desc: "每段英文下方都有中文解释。", icon: Languages },
      { title: "小白提示", desc: "告诉用户这段内容放哪里、为什么这样写。", icon: Lightbulb },
      { title: "风险提醒", desc: "避免夸大、医疗功效、侵权品牌词。", icon: ShieldAlert },
      { title: "复制与保存", desc: "结果可分块复制，也可一键复制完整 Listing。", icon: BadgeCheck },
    ],
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-gold">What Work UP Does</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">
              从产品理解到可复制 Listing，全程有中文参照。
            </h2>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
                <ClipboardCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">第一阶段先跑通高质量 mock 流程</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  暂不接 Supabase 和 DeepSeek，先确保页面、流程、双语结果和复制体验足够清楚。
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featureGroups.map((group, groupIndex) => (
            <Card key={group.title} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone={groupIndex === 1 ? "dark" : "neutral"}>
                    {String(groupIndex + 1).padStart(2, "0")}
                  </Badge>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{group.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{group.subtitle}</p>
                </div>
              </div>
              <div className="mt-5 divide-y divide-line">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-neutral-100 text-ink">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
