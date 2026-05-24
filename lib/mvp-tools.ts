export type MvpToolSlug =
  | "product-analysis"
  | "competitor-analysis"
  | "listing-generator"
  | "seo-keywords"
  | "image-suggestions";

export type MvpTool = {
  slug: MvpToolSlug;
  titleCn: string;
  titleEn: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  buttonLabel: string;
  emptyHint: string;
  helperTips: string[];
  mockOutput: Array<{
    title: string;
    english?: string;
    chinese: string;
  }>;
  icon: "sparkles" | "chart" | "list" | "tags" | "image";
};

export const mvpTools: MvpTool[] = [
  {
    slug: "product-analysis",
    titleCn: "选品分析",
    titleEn: "Product Analysis",
    description: "输入产品资料，快速判断核心卖点、目标用户、使用场景和新手风险。",
    inputLabel: "产品资料",
    inputPlaceholder: "例如：便携式折叠收纳篮，PP+TPR 材质，适合小户型、宿舍、汽车后备箱...",
    buttonLabel: "生成选品分析",
    emptyHint: "先粘贴产品中文资料，系统会用 mock 数据生成一份分析示例。",
    helperTips: ["不要编造尺寸和材质", "写清楚目标用户", "把使用场景写成真实生活画面"],
    icon: "sparkles",
    mockOutput: [
      {
        title: "核心卖点",
        chinese: "可折叠、轻便搬运、开放式拿取和易清洁，是适合小空间用户的主卖点。",
      },
      {
        title: "目标用户",
        english: "Small-space households, dorm users, car owners, and renters who need flexible everyday storage.",
        chinese: "小户型家庭、宿舍用户、车主和租房人群，需要灵活、日常可用的收纳工具。",
      },
      {
        title: "风险提醒",
        chinese: "如果没有承重数据，不要写 heavy-duty 或 strong load-bearing，避免夸大承诺。",
      },
    ],
  },
  {
    slug: "competitor-analysis",
    titleCn: "竞品分析",
    titleEn: "Competitor Analysis",
    description: "拆解竞品标题、卖点和表达方式，找到可借鉴和可避开的方向。",
    inputLabel: "竞品标题 / 卖点",
    inputPlaceholder: "粘贴 1-3 个 Amazon 竞品标题、五点描述或你观察到的主图卖点...",
    buttonLabel: "生成竞品分析",
    emptyHint: "粘贴竞品标题后，会输出关键词结构、常见卖点和差异化机会。",
    helperTips: ["标题看关键词", "五点看痛点", "主图看买家第一眼理解"],
    icon: "chart",
    mockOutput: [
      {
        title: "竞品常见关键词",
        english: "collapsible basket, storage bin, laundry organizer, closet, car trunk, dorm room",
        chinese: "竞品常用关键词集中在折叠篮、收纳盒、洗衣收纳、衣柜、车后备箱和宿舍。",
      },
      {
        title: "表达机会",
        chinese: "多数竞品强调功能，但对“小空间”和“折叠后厚度”的解释不够清楚，可以作为差异化。",
      },
      {
        title: "避坑提醒",
        chinese: "不要直接复制竞品标题结构，也不要使用竞品品牌词或疑似商标词。",
      },
    ],
  },
  {
    slug: "listing-generator",
    titleCn: "Listing 生成",
    titleEn: "Listing Generator",
    description: "生成 Amazon 标题、五点描述、商品描述，并在每段英文下方给中文参照。",
    inputLabel: "完整产品资料",
    inputPlaceholder: "粘贴产品名称、材质、尺寸、颜色、包装内容、使用场景、核心功能、注意事项...",
    buttonLabel: "生成 Listing",
    emptyHint: "输入产品资料后，会生成带中文参照的英文 Listing mock 结果。",
    helperTips: ["英文要自然，不逐字翻译", "每条 Bullet 对应一个清晰卖点", "不确定的信息会提示补充"],
    icon: "list",
    mockOutput: [
      {
        title: "Amazon Title",
        english:
          "Collapsible Storage Basket with Handles, Foldable Organizer Bin for Laundry, Closet, Pantry, Car Trunk and Small Spaces",
        chinese:
          "带提手折叠收纳篮，适用于洗衣、衣柜、食品储物、汽车后备箱和小空间整理。",
      },
      {
        title: "Bullet Point 1",
        english:
          "Folds flat when not in use, helping you save closet, shelf, or trunk space without adding clutter.",
        chinese: "不用时可以压平折叠，帮助节省衣柜、架子或后备箱空间，减少杂乱。",
      },
      {
        title: "小白提示",
        chinese: "标题先放核心关键词，再补充使用场景和人群，不要为了关键词堆砌牺牲可读性。",
      },
    ],
  },
  {
    slug: "seo-keywords",
    titleCn: "SEO 关键词",
    titleEn: "SEO Keywords",
    description: "生成 Backend Search Terms、关键词中文解释和侵权风险提醒。",
    inputLabel: "产品关键词 / 使用场景",
    inputPlaceholder: "例如：折叠收纳篮、洗衣房、衣柜、宿舍、汽车后备箱、小户型...",
    buttonLabel: "生成 SEO Keywords",
    emptyHint: "输入产品关键词或使用场景，会生成后台 Search Terms 示例。",
    helperTips: ["不要放竞品品牌词", "避免重复堆砌", "优先覆盖真实搜索场景"],
    icon: "tags",
    mockOutput: [
      {
        title: "Backend Search Terms",
        english: "collapsible basket foldable storage bin laundry organizer closet pantry car trunk dorm small space",
        chinese: "这些词适合放在 Amazon 后台 Search Terms，不是放在前台标题里全部堆出来。",
      },
      {
        title: "关键词解释",
        chinese: "覆盖了产品形态、功能、收纳场景和目标空间，有利于新手理解为什么这样组合。",
      },
      {
        title: "侵权提醒",
        chinese: "不要加入 IKEA、Sterilite、Rubbermaid 等品牌词，除非你拥有合法授权。",
      },
    ],
  },
  {
    slug: "image-suggestions",
    titleCn: "图片建议",
    titleEn: "Image Suggestions",
    description: "为主图、场景图、尺寸图、细节图和包装图生成可执行拍摄建议。",
    inputLabel: "产品外观 / 卖点",
    inputPlaceholder: "描述产品外观、颜色、材质、尺寸、核心卖点和你已有的图片素材...",
    buttonLabel: "生成图片建议",
    emptyHint: "输入产品外观和卖点，会输出给摄影师或设计师看的图片 brief。",
    helperTips: ["主图只展示产品本体", "场景图解决买家理解", "尺寸图一定要清楚"],
    icon: "image",
    mockOutput: [
      {
        title: "主图建议",
        chinese: "白底展示展开后的完整收纳篮，提手和折叠边缘要清晰，不放文字和道具。",
      },
      {
        title: "场景图建议",
        chinese: "放在洗衣房、衣柜、宿舍或车后备箱中，突出小空间收纳和快速拿取。",
      },
      {
        title: "尺寸图建议",
        chinese: "同时标出展开尺寸和折叠厚度，用柜子或车后备箱作为比例参照。",
      },
    ],
  },
];

export function getMvpTool(slug: string) {
  return mvpTools.find((tool) => tool.slug === slug);
}
