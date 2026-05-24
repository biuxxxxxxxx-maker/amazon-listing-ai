import type { BulletPoint, FaqItem, ImageSuggestion, Project, WizardStep } from "./types";

export const projects: Project[] = [
  {
    id: "demo",
    productNameCn: "便携式折叠收纳篮",
    productNameEn: "Collapsible Storage Basket",
    category: "Home & Kitchen",
    marketplace: "US",
    createdAt: "2026-05-18",
    updatedAt: "2026-05-22",
    status: "Generated",
  },
  {
    id: "draft-01",
    productNameCn: "硅胶厨房沥水垫",
    productNameEn: "Silicone Dish Drying Mat",
    category: "Kitchen & Dining",
    marketplace: "CA",
    createdAt: "2026-05-19",
    updatedAt: "2026-05-21",
    status: "Draft",
  },
  {
    id: "draft-02",
    productNameCn: "宠物旅行水杯",
    productNameEn: "Dog Travel Water Bottle",
    category: "Pet Supplies",
    marketplace: "UK",
    createdAt: "2026-05-20",
    updatedAt: "2026-05-20",
    status: "Draft",
  },
];

export const wizardSteps: WizardStep[] = [
  {
    id: "basic",
    title: "基础信息",
    description: "先确认产品、站点、类目和目标用户。",
  },
  {
    id: "materials",
    title: "产品资料",
    description: "整理材质、尺寸、功能和供应商描述。",
  },
  {
    id: "competitors",
    title: "竞品评论",
    description: "补充竞品卖点、评论痛点和差异化想法。",
  },
  {
    id: "settings",
    title: "生成设置",
    description: "选择英文风格、中文解释和图片建议。",
  },
];

export const bulletPoints: BulletPoint[] = [
  {
    english:
      "Collapsible design folds flat when not in use, helping you save shelf, closet, or trunk space without adding clutter.",
    chinese:
      "可折叠设计在不用时可以压平收纳，帮助节省架子、衣柜或后备箱空间，不会增加杂乱感。",
    sellingPoint: "折叠收纳",
    painPoint: "小户型和车内空间有限，普通收纳篮占地方。",
  },
  {
    english:
      "Sturdy side handles make it easy to carry laundry, toys, pantry items, picnic supplies, or car essentials from room to room.",
    chinese:
      "两侧稳固提手方便搬运衣物、玩具、食品储物、野餐用品或车内常用品。",
    sellingPoint: "多场景搬运",
    painPoint: "用户需要一个轻便但能承重的日常收纳工具。",
  },
  {
    english:
      "Smooth, wipe-clean surface helps keep daily storage simple, especially in kitchens, bathrooms, laundry rooms, and kids' spaces.",
    chinese:
      "表面顺滑易擦拭，适合厨房、浴室、洗衣房和儿童空间等日常收纳场景。",
    sellingPoint: "易清洁",
    painPoint: "收纳篮容易沾灰或弄脏，清洁麻烦。",
  },
  {
    english:
      "Open-top shape lets you see what is inside at a glance, so frequently used items stay easy to grab and put away.",
    chinese:
      "开放式篮口可以一眼看到里面的物品，经常使用的东西更容易拿取和归位。",
    sellingPoint: "快速拿取",
    painPoint: "带盖收纳盒找东西慢，新手用户更需要直观整理。",
  },
  {
    english:
      "Neutral color and clean lines blend naturally with modern homes, dorm rooms, RVs, and small apartments.",
    chinese:
      "中性色和简洁线条适合现代家居、宿舍、房车和小公寓，不会显得突兀。",
    sellingPoint: "简约外观",
    painPoint: "用户担心收纳用品影响空间美观。",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: {
      english: "Can this basket stand upright when empty?",
      chinese: "这个篮子空着的时候能自己立起来吗？",
    },
    answer: {
      english:
        "Yes. The reinforced rim helps the basket keep its shape for everyday use, while the foldable body still makes storage easy.",
      chinese:
        "可以。加固边缘能帮助篮子在日常使用时保持形状，同时折叠结构也方便收纳。",
    },
  },
  {
    question: {
      english: "Is it suitable for laundry?",
      chinese: "适合装衣物吗？",
    },
    answer: {
      english:
        "Yes. It works well for light laundry, towels, kids' clothes, and other household items. Avoid overloading beyond normal daily use.",
      chinese:
        "适合。可以用于轻量衣物、毛巾、儿童衣服和其他家居用品。建议不要超过日常合理承重。",
    },
  },
  {
    question: {
      english: "How do I clean it?",
      chinese: "应该怎么清洁？",
    },
    answer: {
      english:
        "Wipe the surface with a damp cloth and let it air dry before folding or storing.",
      chinese: "用湿布擦拭表面，晾干后再折叠或收纳即可。",
    },
  },
  {
    question: {
      english: "Can it be used in a car trunk?",
      chinese: "可以放在汽车后备箱使用吗？",
    },
    answer: {
      english:
        "Yes. The fold-flat design makes it useful for trunk organization, groceries, travel items, and emergency supplies.",
      chinese:
        "可以。折叠设计适合后备箱整理、购物用品、旅行物品和应急用品收纳。",
    },
  },
  {
    question: {
      english: "Does it come with a lid?",
      chinese: "这个产品带盖子吗？",
    },
    answer: {
      english:
        "No. This mock listing presents an open-top basket designed for quick access and everyday organization.",
      chinese:
        "不带盖。这个 mock Listing 展示的是开放式收纳篮，适合快速拿取和日常整理。",
    },
  },
];

export const imageSuggestions: ImageSuggestion[] = [
  {
    type: "主图",
    focus: "白底展示完整产品形态，保持边缘清晰。",
    guidance: "不要放杂物或复杂背景，突出折叠篮本体和提手结构。",
  },
  {
    type: "场景图",
    focus: "放在洗衣房、衣柜、车后备箱或宿舍桌边。",
    guidance: "让买家一眼知道这个产品适合哪些真实生活场景。",
  },
  {
    type: "尺寸图",
    focus: "标出展开尺寸和折叠后厚度。",
    guidance: "新手卖家要避免只写数字，最好用衣柜、车厢等参照物帮助理解。",
  },
  {
    type: "细节图",
    focus: "展示提手、边缘、折叠结构和易擦拭表面。",
    guidance: "每张细节图只讲一个卖点，不要把所有文字挤在一张图上。",
  },
  {
    type: "包装图",
    focus: "展示收到货时的折叠状态和包装内容。",
    guidance: "如果包装很简洁，可以强调节省运输和收纳空间。",
  },
];

export const fullListingText = [
  "Collapsible Storage Basket with Handles, Foldable Organizer Bin for Laundry, Closet, Pantry, Car Trunk and Small Spaces, Neutral Home Storage Basket",
  ...bulletPoints.map((item) => item.english),
  "Keep everyday storage simple with a collapsible basket designed for small spaces, busy homes, and flexible routines.",
].join("\n\n");
