import {
  BadgeCheck,
  Camera,
  ClipboardCheck,
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
      { title: "选品定位", desc: "明确产品是什么、卖给谁、适合什么使用场景。", icon: Lightbulb },
      { title: "竞品分析", desc: "提炼竞品常见表达和可以避开的同质化卖点。", icon: BadgeCheck },
      {
        title: "评论痛点分析",
        desc: "把买家顾虑转化成 Listing 应回应的问题。",
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
        title: "自然英文表达",
        desc: "不是逐字翻译，而是 Amazon 买家能自然理解的英文。",
        icon: ClipboardCheck,
      },
      { title: "标题与五点", desc: "生成标题、Bullet Points 和 Product Description。", icon: BadgeCheck },
      { title: "SEO 关键词", desc: "输出 Search Terms、关键词解释和风险提醒。", icon: Search },
      { title: "图片建议", desc: "告诉新手主图、场景图、尺寸图应该怎么做。", icon: Camera },
    ],
  },
  {
    title: "中文可检查",
    subtitle: "让不懂英文的人也能检查",
    items: [
      { title: "中文参照解释", desc: "每段英文下方都有中文解释。", icon: MessageSquareText },
      { title: "新手提示", desc: "解释这段内容放哪里、为什么这样写。", icon: Lightbulb },
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
              从产品理解到可复制 Listing，全程有中文参考
            </h2>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white">
                <ClipboardCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">面向真实 Amazon 上新场景</p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Work UP 把中文资料、竞品线索和合规边界整理成可检查、可复制的 Listing 输出。
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
