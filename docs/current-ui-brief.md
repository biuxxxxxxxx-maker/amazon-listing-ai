# Work UP 当前 UI 设计参考资料

这份文档用于交给 Gemini 做新版 UI 设计参考。Gemini 只负责视觉与交互设计建议，不负责修改业务逻辑、接口、数据库、鉴权或测试。

## 1. 当前项目定位

- 项目名：Work UP
- 面向用户：Amazon 新手卖家，尤其是不熟悉英文 Listing 写作的新手。
- 核心目标：把中文产品资料、竞品线索、评论痛点和上新偏好，整理成地道的 Amazon Listing。
- 输出范围：Amazon Listing 专用，包括标题、五点描述、Product Description、Search Terms、FAQ、图片建议和中文参照。
- 产品边界：只做 Amazon Listing，不做多平台 Listing，不做 Shopify、TikTok Shop、独立站等多平台生成。
- 当前 MVP：已包含 Supabase 邮箱登录注册、项目草稿保存、结果保存、受保护的 DeepSeek 生成接口，以及本地 mock fallback。

## 2. 当前页面结构

### 首页 `/`

入口文件：

- `app/page.tsx`
- `components/landing/home-page-content.tsx`
- `components/landing/hero.tsx`
- `components/landing/product-preview.tsx`
- `components/landing/process-strip.tsx`
- `components/landing/feature-grid.tsx`
- `components/landing/final-cta.tsx`

功能结构：

- 顶部导航：左侧品牌 `Work UP`，中间锚点「流程」「功能」和登录入口，右侧「开始生成」按钮。
- Hero 左侧：产品定位徽标、主标题、副文案、三个 proof 文案、主 CTA 和 mock 工作台入口。
- Hero 右侧：静态 Listing preview，用本地 `mockGenerationResult` 展示中文资料、AI 分析摘要、Amazon Listing Output。
- 下方流程区：`ProcessStrip` 展示 6 步流程，从产品资料输入到复制使用。
- 功能区：`FeatureGrid` 按「上新前分析」「Listing 生成」「新手友好」三组展示功能卡片。
- 底部 CTA：`FinalCta` 再次引导开始创建 Listing。

当前行为：

- 首页 CTA 不调用 `/api/generate-listing`。
- 首页点击「开始生成 Listing」会根据 Supabase 环境和 cookie 跳转 `/projects/new` 或 `/login`。
- 首页 preview 是静态 mock 展示，不应表现成真实生成中。

### 登录注册页 `/login` 和 `/register`

入口文件：

- `app/login/page.tsx`
- `app/login/auth-form.tsx`
- `app/register/page.tsx`

功能结构：

- `/login` 是登录主页面，同时提供「注册新账号」按钮。
- `/register` 复用 `AuthForm`，初始模式为注册。
- 页面左侧是说明区：邮箱登录、保存项目、Supabase Auth、数据库保存等信任信息。
- 页面右侧是表单卡片：邮箱、密码、登录或注册按钮、错误提示、成功提示。
- 未配置 Supabase 时，登录表单提供「进入 mock 工作台」入口。

关键业务逻辑：

- `AuthForm` 使用 `getBrowserSupabase()` 调用 Supabase Auth。
- 登录成功后写入 `work_up_access_token` 和 `work_up_refresh_token` cookie。
- 登录或注册后跳转 `/dashboard`。
- UI 可以重做，但不能破坏 Supabase 登录注册流程、cookie 写入和跳转。

### 新建 Listing 页面 `/projects/new`

入口文件：

- `app/projects/new/page.tsx`
- `components/project-form/listing-wizard.tsx`

功能结构：

- 顶部品牌和「返回工作台」按钮。
- 页面标题：创建 Amazon Listing 项目。
- 四步表单：
  1. 基础资料：产品中文名、英文名、Amazon 站点、类目、目标售价、目标用户。
  2. 产品资料：材质、尺寸、颜色、包装内容、使用场景、核心功能、供应商描述、注意事项。
  3. 竞品与评论：竞品标题、竞品链接、竞品卖点、用户差评、差异化。
  4. 输出偏好：英文风格、生成语言、中文解释、图片建议。
- 右侧 guide panel：当前步骤说明、资料完整度、填写提示。
- 底部操作区：上一步、下一步、保存 Draft。

当前行为：

- 进入页面会检查 Supabase session；未登录时跳转 `/login`。
- 表单过程中不调用 DeepSeek，也不调用 `/api/generate-listing`。
- 点击「保存 Draft」只写入 `product_projects`，成功后跳转 `/projects/[id]/result?created=1`。
- 第四步明确提示：保存 Draft 不会调用 AI；进入结果页点击重新生成才会正式生成。

### 结果页 `/projects/[id]/result`

入口文件：

- `app/projects/[id]/result/page.tsx`
- `components/ui/result-block.tsx`
- `components/ui/copy-button.tsx`

功能结构：

- 顶部品牌和「返回编辑」按钮。
- 页面标题：AI Listing 交付结果。
- 顶部操作：复制英文 Listing、重新生成、保存结果。
- 状态提示：生成失败、保存成功、读取历史结果等。
- 项目信息提示：显示真实项目资料、站点和类目。
- 交付概览卡：产品名、站点、类目、双语解释、模块数量、Bullet 数量、图片建议数量。
- 合规与质量检查：提示避免逐字翻译、竞品品牌词、高风险词。
- 模块导航：桌面左侧 sticky 导航，移动端横向滚动导航。
- 结果模块：Title、Bullets、Description、Search Terms、Compliance、Product Analysis、Competitor Analysis、Review Pain Points、Differentiation、FAQ、Image Suggestions。
- 移动端底部固定操作栏：复制英文 Listing 和保存结果。

当前行为：

- 如果是真实项目，页面先读取 Supabase 项目和最新 DeepSeek 结果。
- 初始状态为 Not Generated，不显示默认 demo 产品为正式结果。
- 点击「重新生成」才调用 `/api/generate-listing`。
- 非 demo 项目如果接口没有返回 DeepSeek 正式结果，会停止保存并提示错误。
- 只有 DeepSeek 正式结果才允许保存到 Supabase。

### Mock 工作台和 Demo 页面

相关入口：

- `/dashboard`：`app/dashboard/page.tsx`
- `/projects/demo/result`：复用 `app/projects/[id]/result/page.tsx`，`id=demo`
- `/product-analysis`：`app/product-analysis/page.tsx`
- `/competitor-analysis`：`app/competitor-analysis/page.tsx`
- `/listing-generator`：`app/listing-generator/page.tsx`
- `/seo-keywords`：`app/seo-keywords/page.tsx`
- `/image-suggestions`：`app/image-suggestions/page.tsx`
- 通用组件：`components/tools/mock-tool-page.tsx`
- mock 配置：`lib/mvp-tools.ts`

功能结构：

- `/dashboard` 是项目工作台：展示 MVP 功能入口、最近项目、工作区状态、真实项目列表。
- 未配置 Supabase 时，Dashboard 使用本地 mock 项目。
- 配置 Supabase 后，Dashboard 会读取当前用户的 `product_projects`。
- MVP 工具页提供输入框、生成按钮、loading 状态和 mock 结果。
- `listing-generator` 工具页当前会调用 `/api/generate-listing`，属于 demo/mock 工具，不是首页 preview。

## 3. 当前首页设计说明

### 左侧 hero 区域

当前 Hero 使用左右分栏布局：

- 左侧是产品主张：`Amazon 新手卖家的 Listing 智能体`。
- 主标题：`从中文产品资料到地道 Amazon Listing，一步完成。`
- 副文案强调：分析卖点、翻译资料、生成标题、五点描述、商品描述和关键词。
- 三个 proof 点：
  - 不做多平台分散功能
  - 不逐字翻译中文资料
  - 每段英文都有中文参照
- 下方还有一个三栏 stats 小卡片：
  - Amazon only / 只做 Amazon Listing
  - Bilingual / 标题、五点、描述双语
  - Guided / 按步骤完成上新资料

### CTA 按钮

当前首页主要 CTA：

- 顶部导航右侧：「开始生成」
- Hero 主按钮：「开始生成 Listing」
- Hero 次按钮：「查看 mock 工作台」
- 底部 CTA：「开始生成 Listing」

当前 CTA 行为：

- 主 CTA 只负责路由跳转。
- 有 Supabase 配置且没有登录 cookie 时跳转 `/login`。
- 没有 Supabase 配置或已有登录 cookie 时跳转 `/projects/new`。
- 不能在首页点击 CTA 时调用 `/api/generate-listing`。

### 三个卖点卡片

当前首页并不只有 3 个功能卖点，而是有两层卡片：

- Hero 内部的 3 个 stats 小卡片，强调 Amazon Only、Bilingual、Guided。
- `FeatureGrid` 内有 3 大组卡片，每组 4 个能力点，合计 12 个功能点。

新版 UI 可以把首页信息压缩成更克制的 3 个核心卖点：

- Amazon Only：只为 Amazon Listing 优化。
- 中文资料到地道英文：不是逐字翻译。
- 新手可检查：每段英文带中文参照和风险提示。

### 右侧 mock preview

当前 `ProductPreview` 结构较重：

- 外层 Card 里模拟浏览器窗口。
- 左列展示「中文产品资料」和「AI 分析摘要」。
- 右列展示 Amazon Listing Output、复制按钮、Title、中文参照、3 条 Bullet、Search Terms、小白提示。
- Badge 当前显示 `Generated`，容易让用户误以为已经真实生成。
- 内部文案包含 `Amazon Listing Output`、`AI 分析摘要`、`复制`、`小白提示` 等。

### 当前首页存在的问题

- Hero 右侧 preview 信息密度太高，视觉重量超过左侧产品主张。
- Preview 过大，桌面端容易形成右侧压迫感；移动端可能造成页面很长。
- 首页同时有静态 mock preview、流程、功能组、底部 CTA，整体内容偏满。
- `ProductPreview` badge 显示 `Generated`，容易混淆「静态展示」和「真实生成」。
- `FinalCta` 文案仍写着「第一阶段为 mock 流程，后续会接入 Supabase 保存项目，并用 DeepSeek 生成真实结果」，但项目实际已经有 Supabase 和 DeepSeek 生成接口，文案过时。
- `FeatureGrid` 内也有「暂不接 Supabase 和 DeepSeek」的过时说明。
- 首页需要更明确地告诉用户：这只是产品输出样例，不是在首页真实生成。
- 页面视觉风格已有黑白灰和暖色基础，但仍偏普通 SaaS 卡片堆叠，缺少更高级、克制的留白和层次。

## 4. 当前 UI 技术栈

- Next.js App Router：`app/` 目录。
- React 19。
- Tailwind CSS：`tailwind.config.ts`、`app/globals.css`。
- 图标库：`lucide-react`。
- UI 基础组件：自定义轻量组件，不是 shadcn/ui。

主要 UI 组件路径：

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/stepper.tsx`
- `components/ui/copy-button.tsx`
- `components/ui/result-block.tsx`
- `components/layout/brand-link.tsx`
- `components/layout/page-header.tsx`

首页相关文件：

- `app/page.tsx`
- `components/landing/home-page-content.tsx`
- `components/landing/hero.tsx`
- `components/landing/product-preview.tsx`
- `components/landing/process-strip.tsx`
- `components/landing/feature-grid.tsx`
- `components/landing/final-cta.tsx`
- `lib/mock-generation-result.ts`

登录注册页相关文件：

- `app/login/page.tsx`
- `app/login/auth-form.tsx`
- `app/register/page.tsx`
- `lib/supabase-browser.ts`

Listing 表单相关文件：

- `app/projects/new/page.tsx`
- `components/project-form/listing-wizard.tsx`
- `lib/project-draft.ts`
- `lib/mock-data.ts`
- `lib/supabase-browser.ts`

结果页相关文件：

- `app/projects/[id]/result/page.tsx`
- `components/ui/result-block.tsx`
- `components/ui/copy-button.tsx`
- `lib/mock-generation-result.ts`
- `lib/supabase-browser.ts`

Mock 工具页相关文件：

- `app/dashboard/page.tsx`
- `components/tools/mock-tool-page.tsx`
- `lib/mvp-tools.ts`
- `app/product-analysis/page.tsx`
- `app/competitor-analysis/page.tsx`
- `app/listing-generator/page.tsx`
- `app/seo-keywords/page.tsx`
- `app/image-suggestions/page.tsx`

## 5. 不允许 Gemini 改的业务逻辑

Gemini 做新版 UI 时必须明确保留以下规则：

- 首页不能调用 `/api/generate-listing`。
- 首页 mock preview 必须是静态展示。
- 首页不能出现「正在调用 DeepSeek」「生成中」这类真实生成状态。
- 只有用户正式填写资料并提交 Draft 后，进入结果页点击「重新生成」才允许调用 DeepSeek。
- `DEEPSEEK_API_KEY` 只能在服务端使用，不能进入任何 `NEXT_PUBLIC_` 环境变量，也不能出现在前端代码。
- Supabase 登录注册逻辑不能被 UI 改坏。
- 登录成功后的 access token / refresh token cookie 写入不能被破坏。
- `/projects/new` 的 session 检查、Draft 保存、跳转结果页逻辑不能被破坏。
- `/projects/[id]/result` 的生成、保存、只保存 DeepSeek 正式结果的逻辑不能被破坏。
- E2E 测试必须保留，尤其是首页不调用生成接口、Listing flow 只在结果页调用生成接口的测试。
- 不要改数据库 schema、RLS、Supabase 表字段。
- 不要改 `app/api/generate-listing/route.ts`、`lib/ai-listing.ts`、`lib/supabase-server.ts` 等服务端生成和鉴权逻辑。

## 6. 新 UI 设计目标

整体方向：

- 极简、高级、克制。
- 黑白灰为主，少量暖色点缀。
- 参考 Linear / Vercel / Notion / Raycast 的干净感。
- 更像专业工作工具，而不是普通营销 SaaS 模板。
- 信息密度要被控制，优先清晰、可信、可操作。

视觉要求：

- 不要花哨渐变。
- 不要大面积紫色、蓝紫色、彩色光斑或普通 AI SaaS 视觉。
- 不要过多玻璃拟态、过重阴影或漂浮卡片。
- 不要让首页像正在真实生成。
- 首页 preview 应是「静态样例」或「输出样张」，不是 live generator。
- 移动端必须适配，避免 preview 过长、按钮溢出、文字挤压。
- 表单页和结果页要更像生产力工具：清晰、安静、可反复使用。

内容策略：

- 首页聚焦一个主张：中文产品资料生成地道 Amazon Listing。
- 明确 Amazon-only，不强调多平台。
- 重点解释新手价值：不懂英文也能看懂、能复制、能避免风险。
- 减少过时的「第一阶段 mock」文案，改成清楚区分：样例展示、正式生成、项目保存。

## 7. Gemini 页面改造范围

Gemini 只负责设计这些页面：

- 首页 UI：`/`
- 登录注册页 UI：`/login`、`/register`
- Listing 填写页 UI：`/projects/new`
- Result 结果页 UI：`/projects/[id]/result`

Gemini 不负责：

- Supabase 登录注册逻辑
- Supabase session、cookie、鉴权和 RLS
- DeepSeek API
- `/api/generate-listing`
- 数据库 schema
- 路由鉴权
- Draft 保存和结果保存逻辑
- E2E 测试
- Cloudflare / OpenNext 部署配置
- package 依赖升级

## 8. 给 Gemini 的文件参考和限制

### Gemini 应该参考的文件

产品定位和当前行为：

- `README.md`
- `docs/supabase-schema.md`
- `docs/ai-prompt-design.md`
- `docs/QA.md`

首页设计参考：

- `app/page.tsx`
- `components/landing/home-page-content.tsx`
- `components/landing/hero.tsx`
- `components/landing/product-preview.tsx`
- `components/landing/process-strip.tsx`
- `components/landing/feature-grid.tsx`
- `components/landing/final-cta.tsx`
- `lib/mock-generation-result.ts`

登录注册页设计参考：

- `app/login/page.tsx`
- `app/login/auth-form.tsx`
- `app/register/page.tsx`

Listing 填写页设计参考：

- `app/projects/new/page.tsx`
- `components/project-form/listing-wizard.tsx`
- `lib/mock-data.ts`

结果页设计参考：

- `app/projects/[id]/result/page.tsx`
- `components/ui/result-block.tsx`
- `components/ui/copy-button.tsx`

UI 基础组件和样式参考：

- `app/globals.css`
- `tailwind.config.ts`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/stepper.tsx`
- `components/layout/brand-link.tsx`
- `components/layout/page-header.tsx`

E2E 行为约束参考：

- `tests/e2e/landing.spec.mjs`
- `tests/e2e/listing-flow.spec.mjs`
- `tests/e2e/auth.spec.mjs`

### Gemini 不应该碰的文件

服务端 AI 和鉴权：

- `app/api/generate-listing/route.ts`
- `lib/ai-listing.ts`
- `lib/generation-auth.ts`
- `lib/cloudflare-env.ts`
- `lib/supabase-server.ts`
- `lib/prompts/amazon-listing-system-prompt.ts`
- `lib/prompts/amazon-listing-user-prompt.ts`

Supabase 数据与保存逻辑：

- `lib/supabase-browser.ts`
- `lib/supabase-config.ts`
- `lib/project-draft.ts`
- `docs/supabase-schema.md`

测试与脚本：

- `tests/e2e/*`
- `scripts/test-*.mjs`
- `scripts/run-e2e.mjs`

配置和部署：

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `open-next.config.ts`
- `wrangler.jsonc`
- `playwright.config.mjs`
- `tsconfig.json`
- `eslint.config.mjs`

### Codex 后续实现时应该优先改的组件

优先级 1：首页核心视觉

- `components/landing/hero.tsx`
- `components/landing/product-preview.tsx`
- `components/landing/home-page-content.tsx`

目标：

- 降低 preview 视觉重量。
- 把 preview 明确标记为静态样例。
- 精简 CTA 和卖点。
- 删除或改写过时的 mock 阶段文案。

优先级 2：首页信息区

- `components/landing/process-strip.tsx`
- `components/landing/feature-grid.tsx`
- `components/landing/final-cta.tsx`

目标：

- 压缩功能展示，不再堆 12 个功能点。
- 保留 Amazon-only、新手友好、双语可检查、风险提醒。
- 让页面更像高级产品介绍，而不是普通 SaaS 长页。

优先级 3：登录注册页

- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/login/auth-form.tsx`

目标：

- 保留表单字段、按钮、错误提示和 Supabase 调用。
- 视觉上更简洁可信，减少说明卡片堆叠。
- 移动端保持输入和按钮清晰可点。

优先级 4：Listing 填写页

- `components/project-form/listing-wizard.tsx`
- `app/projects/new/page.tsx`

目标：

- 保留四步流程和所有字段 name。
- 优化 stepper、右侧提示、底部操作栏。
- 让长表单更像专业工作台，减少卡片嵌套感。

优先级 5：Result 结果页

- `app/projects/[id]/result/page.tsx`
- `components/ui/result-block.tsx`
- `components/ui/copy-button.tsx`

目标：

- 保留「重新生成」「保存结果」「复制」的行为。
- 优化模块导航和结果阅读体验。
- 强化 Not Generated / DeepSeek Result 状态区别。
- 移动端底部操作栏保持可用。

## 9. 设计交付提醒

Gemini 输出设计时，建议只给：

- 页面结构建议
- 视觉层级建议
- 组件拆分建议
- 文案精简建议
- Tailwind class 方向或局部 JSX 示例

不要让 Gemini 直接重写：

- API 调用
- Supabase 调用
- 保存逻辑
- 登录逻辑
- E2E 测试
- 环境变量读取

