# Gemini UI Brief for Work UP

本文档用于交给 Gemini 进行 Work UP 的 UI 设计方案产出。Gemini 只负责视觉与交互设计建议，不改变现有业务链路、接口、schema 或生成逻辑。

## 一、项目背景

产品名固定为 Work UP。

Work UP 是面向跨境卖家的 Amazon Listing 策略分析与生成工具。它不是普通 AI Listing 生成器。它的目标是把中文产品资料、竞品信息、买家痛点、合规边界转化为可复制到 Amazon 后台的英文 Listing。

核心价值：

- 更真实
- 更合规
- 更接近运营思维
- 可复制到 Amazon 后台
- 能解释资料质量、策略依据、竞品机会和合规风险

目标用户：

1. 初入跨境电商行业的小白：需要理解 Listing 为什么重要、为什么这样写、缺什么资料、怎么补。
2. 有一定经验的 Amazon 卖家：需要辅助分析竞品、关键词、痛点、合规风险和自己没想到的运营角度。

## 二、整体视觉方向

Work UP 应呈现专业 SaaS 工具感，而不是花哨的 AI 玩具。

视觉关键词：

- 干净
- 可信
- 专业
- 轻量但有结构
- 跨境运营工具风格
- 适合长时间使用的桌面端工作台
- 移动端可读、可点、可完成关键流程

重点突出：

- 可复制的 Amazon Listing
- Listing Strategy
- 资料质量分析
- 竞品机会分析
- Missing Info
- Compliance Notes

避免：

- 夸张渐变和过度装饰
- 巨大的 mock 后台截图
- 像聊天机器人或 AI 娱乐工具
- 大面积单一色调
- 复杂且压迫的表单
- 把风险提示设计得像严重报错

建议使用克制的中性色底、清晰的卡片层级、少量强调色、稳定的表格或列表布局。按钮、表单、标签、状态徽章应具有一致的尺寸和交互状态。

## 三、首页设计目标

### 当前问题

首页右侧 mock preview 太大，像后台截图，视觉重心失衡。首页应该更像 Work UP 的产品入口，而不是展示一张庞大的后台预览图。

### 目标结构

首页第一屏建议使用左右结构，但右侧必须轻量化。

左侧内容：

- Work UP
- 中文资料 -> Amazon Listing 策略与英文文案
- 简短说明：生成 Title、Bullet Points、Description、Search Terms，同时分析资料质量、竞品机会和合规风险。
- 主按钮：开始生成 Listing
- 次按钮：查看示例

右侧内容：

轻量流程预览卡片，不要巨大后台截图。建议表现为四步流程或紧凑信息卡：

```text
中文产品资料
-> Listing Strategy
-> Final Amazon Listing
-> Missing Info / Compliance
```

右侧预览应像一个产品能力摘要，而不是完整后台页面。可以用小型流程卡、字段片段、状态标签和简短示例文本表达。

### 首页设计重点

- 首屏清楚解释 Work UP 做什么。
- 明确它不是普通 AI Listing 生成器，而是 Listing 策略分析和合规辅助工具。
- 主 CTA 要明显。
- 示例入口要存在，但不能抢主 CTA。
- 移动端首页首屏不能拥挤，建议内容垂直堆叠，流程预览可以缩短。

## 四、登录后导航

登录后的主要页面应使用统一导航。

导航包含：

- Work UP logo
- Dashboard
- New Listing
- UserMenu

UserMenu 样式参考：

右上角胶囊按钮：

- 圆形头像首字母
- 用户名或邮箱前缀
- 下拉箭头

下拉菜单：

- 进入控制台
- 个人设置
- 退出

导航设计要求：

- 桌面端横向清晰，页面之间切换明显。
- 移动端 UserMenu 必须容易点击。
- 当前页面状态可以通过轻量 active 样式表达。
- 导航不应占用过高垂直空间。

## 五、Dashboard 设计目标

Dashboard 要像真正的工作台，不像测试页或 demo 页面。

推荐模块：

- 欢迎回来
- 新建 Listing 主按钮
- 最近项目列表
- 项目状态：Draft / Generated
- 项目更新时间
- 项目入口：继续编辑、查看结果或重新生成

空态：

```text
创建你的第一个 Amazon Listing
```

按钮：

```text
新建 Listing
```

Dashboard 设计重点：

- 用户一眼知道下一步能做什么。
- 最近项目应可扫描，状态明确。
- Draft 和 Generated 的视觉状态要不同，但不要刺眼。
- 空态要鼓励行动，不要显得系统为空或损坏。
- 桌面端可以采用列表或紧凑卡片；移动端应一列展示。

## 六、新建 Listing 页设计目标

新建页目标是降低小白压力，同时给资深卖家进阶输入空间。

页面提示：

```text
资料少也可以生成基础版；资料越真实，结果越准确。
```

```text
提供竞品标题、五点和评论痛点后，Work UP 会分析关键词、卖点机会和合规风险。
```

### A. 基础必填

基础必填应放在最前面，视觉上最清晰。

字段：

- 产品中文名
- Amazon 站点
- 产品类目

设计要求：

- 必填字段数量少，降低开始门槛。
- 表单错误要清楚但温和。
- 用户应能快速完成基础版。

### B. 产品事实，可选

字段：

- 英文名
- 颜色
- 材质
- 尺寸
- 重量
- 容量
- 包装数量
- 目标用户
- 使用场景
- 核心卖点
- 供应商描述

设计要求：

- 可选字段应分组，不要一次性压迫用户。
- 可以使用折叠区域、分区标题或说明文本。
- 字段说明要帮助小白理解为什么要填。
- 不应暗示系统会编造缺失事实。

### C. 竞品资料，可选

字段：

- 竞品标题
- 竞品五点
- 竞品链接
- 评论痛点
- 我方差异化
- 禁止夸大的点

设计要求：

- 明确竞品资料用于分析关键词、卖点机会和风险，不会直接复制成最终 Listing。
- 多行输入要舒适，适合粘贴长文本。
- 竞品链接只是参考资料，不设计成自动抓取入口。
- “禁止夸大的点”应帮助用户主动设置合规边界。

### 新建页整体要求

- 桌面端适合长表单编辑。
- 移动端一列展示。
- 主操作按钮清晰。
- 保存中、失败、成功跳转状态要有明确反馈。
- 不加入 demo 数据。

## 七、结果页设计目标

结果页展示顺序不能变。

### 1. Final Amazon Listing

必须第一屏最突出。

内容：

- Amazon Title
- 5 Bullet Points
- Product Description
- Search Terms

设计要求：

- Copy 按钮清晰。
- 英文内容和中文解释分开。
- 英文 Listing 应像可复制成品，而不是普通分析文本。
- 5 Bullet Points 要清楚编号或分块。
- Search Terms 可以使用紧凑、可复制的文本区域样式。

### 2. Listing Quality & Strategy

内容：

- qualityScore level / score
- primaryKeyword
- secondaryKeywords
- sellingPointOrder
- avoidClaims / safeClaims

设计要求：

- qualityScore 应有清晰等级和分数。
- 关键词和卖点排序适合扫描。
- avoidClaims 和 safeClaims 视觉上要分开。

### 3. Missing Info

设计要求：

- 使用温和提示色。
- 表达为“补充这些资料会让结果更准”，不要像严重错误。
- 不展示空模块。

### 4. Assumptions

设计要求：

- 清楚标记这些是系统保守假设，不是事实。
- 适合引导用户后续补充资料。
- 不展示空模块。

### 5. Compliance Notes

设计要求：

- 使用风险提醒色，但不要吓人。
- 风险等级要清楚。
- 推荐替代表达或处理方式应可读。
- 不展示空模块。

### 6. Competitor Insights

设计要求：

- 展示关键词模式、买家痛点、竞品角度、机会点、被阻止进入最终 Listing 的风险 claim。
- 强调竞品 claim 不能直接进入最终 Listing。
- 不展示空模块。

### 7. Expert Suggestions / Analysis

设计要求：

- 用于总结专家建议和运营解释。
- 信息层级要低于 Final Listing。
- 适合小白理解，也不能太啰嗦。

### 旧 schema / mock 提示

如果结果是旧 schema 或 mock，不应伪装成成功结果。页面应提示用户重新生成。

建议文案方向：

```text
这个结果来自旧版结构，请重新生成以获得 Work UP 最新 Listing 格式。
```

## 八、移动端要求

- 首页首屏不拥挤。
- UserMenu 可点击，触控区域足够大。
- 表单一列展示。
- 表单字段高度和间距适合触摸。
- 结果页卡片清晰可读。
- Copy 按钮容易点击。
- Final Listing 在移动端仍然优先展示。
- 长英文内容要换行良好，不溢出容器。
- 下拉菜单和浮层不能被屏幕边缘截断。

## 九、给 Gemini 的输出要求

请 Gemini 输出以下内容：

1. 首页设计方案。
2. Dashboard 设计方案。
3. 新建 Listing 页设计方案。
4. 结果页设计方案。
5. 组件层级建议。
6. Tailwind 风格建议。
7. 可以给出 React/Tailwind 示例代码，但不要改业务逻辑。
8. 明确哪些是 UI 组件，哪些数据来自现有业务链路。

输出时请区分：

- 纯 UI 组件：例如导航、卡片、状态徽章、复制按钮布局、空态、分区标题。
- 现有业务数据：例如 `GenerationResult.finalListing`、`qualityScore`、`listingStrategy`、`missingInfo`、`assumptions`、`complianceNotes`、`competitorInsights`。
- 不能改动的逻辑：鉴权、Supabase 读写、DeepSeek 生成、schema validation、mock 边界。

## 十、Codex 落地注意事项

Gemini 只负责 UI。后续 Codex 落地时不能改以下文件或边界，除非另有明确开发任务：

- `app/api/generate-listing/route.ts`
- `lib/ai-listing.ts`
- `lib/listing-prompt.ts`
- `lib/generation-result-validation.ts`
- `lib/product-brief.ts`
- `lib/competitor-insights.ts`
- `lib/listing-strategy.ts`
- Supabase schema

Codex 落地 UI 时必须保持：

- 产品名固定为 Work UP。
- `mockGenerationResult` 只能用于首页 preview。
- 真实生成不能 fallback mock。
- Copy 只能复制英文 Listing。
- Final Listing 展示顺序不能变。
- 竞品 claim 不能直接进入 Final Listing。
- 英文内容和中文解释分开。
- 不展示空模块。
- 桌面端和移动端都要检查。

## 十一、参考现有页面

Gemini 可参考当前路由的信息架构，但不应照搬现有视觉：

- `/` 首页
- `/dashboard` Dashboard
- `/projects/new` 新建 Listing
- `/projects/[id]/result` 结果页
- 登录后的 `UserMenu`

设计目标是提升信息层级、专业感和可用性，而不是改变 Work UP 的业务定义。
