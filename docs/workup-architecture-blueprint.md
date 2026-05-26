# Work UP Architecture Blueprint

## 一、产品定位

Work UP 是面向跨境卖家的 Amazon Listing 策略分析与生成工具。

它不是普通 AI Listing 生成器。它的目标是把中文产品资料、竞品信息、买家痛点和合规边界，转化为可复制到 Amazon 后台的英文 Listing。

目标用户：

1. 初入跨境电商行业的小白：需要理解 Listing 为什么重要、为什么这样写、缺什么资料、怎么补。
2. 有一定经验的 Amazon 卖家：需要辅助分析竞品、关键词、痛点、合规风险和自己没想到的运营角度。

核心价值：

更真实、更合规、更接近运营思维，而不是 AI 自己瞎编。

## 二、系统模块拆分

### 1. Auth 模块

职责：负责注册、登录、退出、用户状态。

当前实现边界：

- 注册 / 登录 UI 在 `app/login/*`、`app/register/*`。
- 浏览器端 Supabase client 在 `lib/supabase-browser.ts`。
- 服务端读取 access token 与 Supabase client 在 `lib/supabase-server.ts`。
- 退出登录目前在 `app/dashboard/page.tsx` 内处理，同时清理 `work_up_access_token`、`work_up_refresh_token` cookie。

输入：

- email
- password
- Supabase session / access token

输出：

- 登录成功后的 browser session
- 服务端可读取的 access token cookie
- 未登录时跳转 `/login`

### 2. Project / Draft 模块

职责：负责创建项目、编辑项目、保存用户输入资料。

当前实现边界：

- 新建页：`app/projects/new/page.tsx`
- 表单向导：`components/project-form/listing-wizard.tsx`
- Draft payload builder：`lib/project-draft.ts`
- Draft 保存表：`product_projects`

输入：

- 产品基础资料
- 真实产品资料
- 竞品与评论线索
- 输出偏好
- 当前登录用户 id

输出：

- `product_projects` 中的一条 `Draft` 项目
- `form_data` jsonb 输入快照
- 保存后跳转 `/projects/[id]/result?created=1`

### 3. Product Brief 模块

职责：负责把用户输入整理成标准产品资料结构，包括 `confirmedFacts`、`missingFields`、`prohibitedClaims`。

目标边界：

- 建议新增业务逻辑文件：`lib/product-brief.ts`
- 不要把 brief 构建逻辑写在 React 页面里。
- 不要直接依赖 UI label，应依赖稳定字段名，例如 `material`、`dimensions`、`core_features`。

输入：

- `product_projects` row
- `product_projects.form_data`

输出：

- `ProductBrief`
- 已确认事实：`confirmedFacts`
- 缺失字段：`missingFields`
- 禁止或高风险 claim：`prohibitedClaims`

### 4. Competitor Input 模块

职责：负责接收用户手动粘贴的竞品标题、五点、链接、评论痛点。

当前实现边界：

- 输入 UI 在 `components/project-form/listing-wizard.tsx` 的 `CompetitorStep`。
- 原始字段目前保存在 `form_data`：
  - `competitor_title`
  - `competitor_url`
  - `competitor_selling_points`
  - `review_pain_points`
  - `differentiation`

目标边界：

- 建议新增业务逻辑文件：`lib/competitor-insights.ts`
- 第一阶段只做用户手动粘贴，不自动爬取 Amazon 页面。
- 竞品链接只作为用户提供的线索保存，不在前端或 API 中直接抓取。

输入：

- 用户粘贴的竞品标题
- 竞品五点 / 卖点
- 竞品链接
- 评论痛点 / 差评
- 自身差异化

输出：

- `CompetitorInsights`
- 可借鉴关键词
- 常见卖点模式
- 买家痛点
- 可突破点
- 风险表达

### 5. Listing Strategy 模块

职责：负责生成关键词策略、卖点排序、定位方向、风险 claims。

目标边界：

- 建议新增业务逻辑文件：`lib/listing-strategy.ts`
- Strategy 应基于 Product Brief 与 Competitor Insights，不能直接从 UI 字符串拼装。
- Strategy 是 prompt 前的业务判断层，不等同于 AI 生成结果。

输入：

- `ProductBrief`
- `CompetitorInsights`

输出：

- 主关键词 / 长尾关键词建议
- 卖点优先级
- Listing 定位方向
- 禁止写入的 claim
- 可以安全表达的 benefit

### 6. AI Generation 模块

职责：负责调用 DeepSeek，生成结构化 Listing JSON。

当前实现边界：

- API 路由：`app/api/generate-listing/route.ts`
- DeepSeek 调用：`lib/ai-listing.ts`
- Prompt 模板：`lib/prompts/amazon-listing-system-prompt.ts`、`lib/prompts/amazon-listing-user-prompt.ts`
- 当前 normalize：`lib/mock-generation-result.ts`

目标边界：

- `buildListingPrompt` 应收敛到 Product Brief、Competitor Insights、Listing Strategy。
- `validateGenerationResult` 应独立于 mock normalizer。
- 真实项目生成失败时显示真实错误，不 fallback mock。

输入：

- projectId
- Product Brief
- Competitor Insights
- Listing Strategy
- DeepSeek env

输出：

- source 为 `deepseek` 的结构化 JSON
- model 名称
- 可保存的 `generation_results.result_json`

### 7. Result Display 模块

职责：负责展示 Final Listing、资料质量、策略摘要、Missing Info、Competitor Insights。

当前实现边界：

- 结果页：`app/projects/[id]/result/page.tsx`
- 结果卡片：`components/ui/result-block.tsx`
- 复制按钮：`components/ui/copy-button.tsx`

目标展示内容：

- Final Listing
- 资料质量
- 策略摘要
- Missing Info
- Competitor Insights
- 合规风险提示
- loading / error / empty states

输入：

- project data
- latest generation result
- generation status

输出：

- 可阅读、可复制、可保存的结果页
- 真实错误提示
- 非 DeepSeek 结果不保存

### 8. Copy 模块

职责：负责复制英文 Title、Bullet Points、Description、Search Terms。

当前实现边界：

- 通用复制按钮：`components/ui/copy-button.tsx`
- 结果页按模块构造 copy text：`app/projects/[id]/result/page.tsx`

目标边界：

- 建议新增 `lib/final-listing-copy.ts`，集中处理 `copyFinalListing(result)`。
- Copy 模块只能输出英文 Listing 文案。
- 中文解释、风险提示、策略摘要不能进入最终复制文本。

输入：

- validated generation result

输出：

- English only text:
  - Title
  - 5 Bullet Points
  - Description
  - Search Terms

### 9. Persistence 模块

职责：负责把 project draft 和 generation result 保存到 Supabase。

当前实现边界：

- Draft 保存：`components/project-form/listing-wizard.tsx`
- Draft payload：`lib/project-draft.ts`
- Result 保存：`app/projects/[id]/result/page.tsx`
- Supabase schema：`docs/supabase-schema.md`

目标边界：

- 建议把保存规则下沉到更稳定的业务函数，避免结果页承担太多数据库规则。
- `generation_results` 只保存真实 DeepSeek 结果。
- `input_snapshot` 必须保留生成时使用的 brief、competitor insights、strategy 与原始 project snapshot。

输入：

- project draft payload
- generation result
- projectId
- user session

输出：

- `product_projects`
- `generation_results`
- project status 从 `Draft` 更新为 `Generated`

### 10. Landing / Preview 模块

职责：负责首页展示静态 mock，不能触发真实生成。

当前实现边界：

- 首页入口：`app/page.tsx`
- 首页内容：`components/landing/home-page-content.tsx`
- 首页 preview：`components/landing/product-preview.tsx`
- 静态 mock：`lib/mock-generation-result.ts`

输入：

- 静态 `mockGenerationResult`

输出：

- 首页可视化 preview
- 点击 CTA 进入 `/projects/new` 或 `/login`
- 不调用 `/api/generate-listing`

## 三、三层架构

### 1. 数据层

职责：定义稳定数据结构、Supabase 存储结构、Draft 与 Result schema。

当前文件：

- `lib/types.ts`
- `lib/project-draft.ts`
- `docs/supabase-schema.md`
- `lib/mock-generation-result.ts`

核心数据：

- TypeScript types
- Supabase tables / jsonb
- project draft
- generation result schema

建议目标类型：

```ts
type ProductBrief = {
  product: {
    nameCn: string;
    nameEn?: string;
    marketplace: "US" | "UK" | "CA" | "AU";
    category: string;
    targetPrice?: string;
    targetCustomer?: string;
  };
  confirmedFacts: Array<{
    field: string;
    value: string;
    source: "user_input" | "supplier_description" | "competitor_input";
  }>;
  missingFields: Array<{
    field: string;
    reason: string;
    impact: "title" | "bullets" | "description" | "compliance" | "images";
  }>;
  prohibitedClaims: Array<{
    claim: string;
    reason: string;
  }>;
};

type CompetitorInsights = {
  rawInputs: {
    titles: string[];
    urls: string[];
    sellingPoints: string[];
    reviewPainPoints: string[];
  };
  keywordPatterns: string[];
  buyerPainPoints: string[];
  competitorAngles: string[];
  differentiationOpportunities: string[];
  riskyClaims: string[];
};

type GenerationResult = {
  source: "deepseek";
  product: {
    nameCn: string;
    marketplace: string;
    category: string;
  };
  finalListing: {
    title: string;
    bulletPoints: string[];
    description: string;
    searchTerms: string;
  };
  chineseReference: {
    title: string;
    bulletPoints: string[];
    description: string;
    searchTerms: string;
  };
  strategySummary: {
    keywords: string[];
    sellingPointOrder: string[];
    positioning: string;
    riskClaims: string[];
  };
  missingInfo: ProductBrief["missingFields"];
  competitorInsights: CompetitorInsights;
};
```

Supabase 当前表：

- `users`
- `product_projects`
- `generation_results`

`product_projects.form_data` 应保存原始输入，不要覆盖成 AI 改写后的内容。

`generation_results.result_json` 应保存验证通过的结构化结果，不要保存纯文本大段内容作为唯一来源。

`generation_results.input_snapshot` 建议保存：

- 原始 project row
- `ProductBrief`
- `CompetitorInsights`
- `ListingStrategy`
- prompt version
- model

### 2. 业务逻辑层

职责：把原始输入变成可生成、可校验、可保存的业务对象。

目标文件建议：

- `lib/product-brief.ts`
- `lib/competitor-insights.ts`
- `lib/listing-strategy.ts`
- `lib/listing-prompt.ts`
- `lib/generation-result-validation.ts`
- `lib/final-listing-copy.ts`

核心能力：

- product brief builder
- missing info detection
- competitor insight extraction
- prompt builder
- AI result validation
- save rules

规则：

- 业务逻辑层不依赖 React state。
- 业务逻辑层不读取 DOM。
- 业务逻辑层不使用 landing mock。
- 业务逻辑层可以被脚本测试和 E2E 测试共同覆盖。

### 3. 展示层

职责：负责页面、交互、状态反馈与复制体验。

当前页面：

- `/projects/new`
- `/projects/[id]/result`
- landing page `/`
- `/dashboard`
- `/login`
- `/register`

核心展示：

- copy buttons
- loading / error / empty states
- Draft 保存中
- DeepSeek 生成中
- DeepSeek 失败真实错误
- 未生成结果空态
- 资料质量与 Missing Info

展示层约束：

- 页面不要直接拼复杂 prompt。
- 页面不要决定 claim 是否可写。
- 页面不要保存 mock 结果到 Supabase。
- 页面可以展示中文解释，但最终复制必须英文 only。

## 四、模块接口规范

### 1. `buildProductBrief(input) -> ProductBrief`

职责：

- 把 `product_projects` row 与 `form_data` 转成标准产品资料结构。
- 区分已确认事实、缺失信息、高风险 claim。
- 为新手说明缺什么资料，以及缺失会影响 Listing 哪一部分。

输入：

- `product_projects` row
- `form_data`

输出：

- `ProductBrief`

关键规则：

- 用户没填的参数不能补默认假数据。
- 尺寸、材质、承重、认证、防水、医疗功效等必须来自 confirmed facts。
- 如果用户写了高风险词，应进入 `prohibitedClaims` 或 risk list，而不是直接进入最终 Listing。

### 2. `analyzeCompetitorInput(input) -> CompetitorInsights`

职责：

- 分析用户手动粘贴的竞品标题、五点、链接、评论痛点。
- 提取关键词模式、买家痛点、竞品常见角度、差异化机会。

输入：

- `competitor_title`
- `competitor_url`
- `competitor_selling_points`
- `review_pain_points`
- `differentiation`

输出：

- `CompetitorInsights`

关键规则：

- 竞品品牌词不能直接进入 Search Terms。
- Amazon 链接不做自动抓取，只作为原始参考保存。
- 评论痛点可以转化成 buyer concerns，但不能编造不存在的产品能力来回应。

### 3. `buildListingPrompt(productBrief, competitorInsights) -> prompt`

职责：

- 生成 DeepSeek 可执行的结构化 prompt。
- 明确输入事实、禁止 claims、缺失字段、竞品洞察和输出 JSON schema。

输入：

- `ProductBrief`
- `CompetitorInsights`
- 可选 `ListingStrategy`

输出：

- prompt string 或 `{ systemPrompt, userPrompt }`

关键规则：

- prompt 必须要求 strict JSON。
- prompt 必须要求英文 Listing 可复制到 Amazon 后台。
- prompt 必须要求中文解释与英文最终文案分离。
- prompt 必须强调“未确认信息不能编造”。

### 4. `validateGenerationResult(result) -> valid result or error`

职责：

- 校验 DeepSeek 返回是否为可保存、可展示、可复制的正式结果。

输入：

- DeepSeek 原始 JSON
- 可选 Product Brief / Strategy，用于交叉校验

输出：

- valid result
- 或明确错误

最低校验：

- `source` 必须是 `deepseek` 或调用方明确标记为 DeepSeek 结果。
- Final Listing 核心字段非空。
- Bullet Points 正好 5 条。
- Title、Bullet Points、Description、Search Terms 为英文。
- 中文解释不能混入 `copyFinalListing`。
- 不能包含 prohibited claims。
- Search Terms 不能包含竞品品牌词。

### 5. `saveGenerationResult(projectId, result) -> saved result`

职责：

- 把验证后的 DeepSeek 结果保存到 Supabase。
- 更新项目状态为 `Generated`。

输入：

- projectId
- validated generation result
- input snapshot
- model
- current user session

输出：

- saved generation row
- updated project status

关键规则：

- `projectId === "demo"` 不保存。
- `source !== "deepseek"` 不保存。
- `model === "mock-local"` 不保存。
- 保存失败必须显示真实错误。

### 6. `copyFinalListing(result) -> english only text`

职责：

- 从 validated result 中生成可复制到 Amazon 后台的英文文案。

输入：

- validated generation result

输出：

- English only text

输出格式建议：

```text
Title:
...

Bullet Points:
1. ...
2. ...
3. ...
4. ...
5. ...

Description:
...

Search Terms:
...
```

关键规则：

- 只复制英文。
- 不复制中文解释。
- 不复制策略摘要。
- 不复制 Missing Info。
- 不复制竞品原文。

## 五、核心数据流

文字版流程：

```text
用户输入资料
→ 保存 Draft
→ buildProductBrief
→ analyzeCompetitorInput
→ buildListingPrompt
→ call DeepSeek
→ validateGenerationResult
→ saveGenerationResult
→ result page display
→ copy English Listing
```

当前项目对应关系：

```text
/projects/new
→ components/project-form/listing-wizard.tsx
→ lib/project-draft.ts
→ product_projects.form_data
→ /projects/[id]/result
→ /api/generate-listing
→ lib/ai-listing.ts
→ generation_results.result_json
→ Result Page
→ CopyButton
```

目标演进关系：

```text
product_projects row
→ ProductBrief
→ CompetitorInsights
→ ListingStrategy
→ ListingPrompt
→ DeepSeek JSON
→ ValidatedGenerationResult
→ Supabase generation_results
→ Result Display
→ English-only Copy
```

## 六、Mock 使用边界

必须明确执行以下边界：

1. `mockGenerationResult` 只能用于首页 preview。
2. 真实项目页、真实生成页、真实结果页、`/api/generate-listing` 都不能使用 `mockGenerationResult`。
3. `ENABLE_GENERATION_MOCK=true` 时才允许开发环境 fallback mock。
4. Production 默认必须 false。
5. DeepSeek 失败显示真实错误，不 fallback mock。

当前相关文件：

- `lib/mock-generation-result.ts`
- `components/landing/home-page-content.tsx`
- `components/landing/product-preview.tsx`
- `app/api/generate-listing/route.ts`
- `lib/ai-listing.ts`
- `app/projects/[id]/result/page.tsx`

后续开发要求：

- 首页可以 import `mockGenerationResult`。
- landing preview 可以展示 mock。
- `/dashboard` 若需要空态示例，可以使用独立 dashboard mock，但不能伪装成用户真实项目。
- `/projects/new` 不出现 demo 数据。
- `/projects/[id]/result` 初始状态应该是 empty / pending，不展示 demo Listing。
- `/api/generate-listing` production 中不能因为 key 缺失、余额不足、网络错误、JSON 解析失败而返回 mock。

## 七、开发顺序建议

### P0 文档与 schema

- 固化本蓝图。
- 更新 `docs/supabase-schema.md`，明确 result JSON 目标结构。
- 明确 env：`ENABLE_GENERATION_MOCK` production 默认 false。

### P1 Product Brief 模块

- 新增 `lib/product-brief.ts`。
- 实现 `buildProductBrief(input)`。
- 输出 `confirmedFacts`、`missingFields`、`prohibitedClaims`。
- 增加脚本测试。

### P2 DeepSeek prompt 和 result validation

- 新增 `lib/listing-prompt.ts`。
- 新增 `lib/generation-result-validation.ts`。
- 把 strict JSON schema、5 bullets、英文 only copy 等规则变成测试。

### P3 输入页改造

- 保持现有 UI 简洁，不大改视觉。
- 确保竞品资料进入 Draft。
- 确保新建页不出现 demo 数据。

### P4 结果页改造

- 结果页展示 Product Brief、Missing Info、Strategy Summary、Competitor Insights。
- DeepSeek 失败显示真实错误。
- 未生成时展示 empty state，不展示 mock。

### P5 竞品资料模块

- 新增 `lib/competitor-insights.ts`。
- 提取关键词模式、痛点、风险 claims。
- 确保竞品资料进入 request body 或服务端读取项目后进入 prompt。

### P6 复制功能

- 新增 `lib/final-listing-copy.ts`。
- 统一 Title、Bullet Points、Description、Search Terms 的复制输出。
- 确保 copy 英文 only。

### P7 E2E 回归

- 覆盖新建、保存 Draft、真实生成、失败错误、复制、首页 preview 不调用 API。
- 检查桌面端与手机端关键路径。

### P8 UI 交给 Gemini 设计后再落地

- 在业务逻辑稳定后再让 Gemini 做 UI 设计。
- UI 落地时不得改变数据流和 mock 边界。

## 八、测试策略

### Auth 模块

- 登录成功后进入 `/dashboard`。
- 注册成功但无 session 时提示检查邮箱。
- 未登录访问 `/projects/new` 时跳转登录。
- 退出登录清理 cookie 并回到 `/login`。

### Project / Draft 模块

- 新建页不出现 demo 数据。
- 必填项缺失时不保存。
- 低信息输入也能保存 Draft。
- Draft 保存后 `form_data` 包含所有用户输入字段。

### Product Brief 模块

- 低信息输入也能生成 `ProductBrief`。
- 空尺寸、空材质、空包装进入 `missingFields`。
- 高风险词进入 `prohibitedClaims`。
- confirmed facts 只来自用户输入或已知项目字段。

### Competitor Input 模块

- 竞品资料能进入 request body 或服务端 prompt input。
- 多个竞品标题能拆成数组或稳定结构。
- 竞品链接原样保存但不自动抓取。
- 竞品品牌词不进入 Search Terms。

### Listing Strategy 模块

- 关键词策略来自产品事实和竞品洞察。
- 卖点排序稳定可解释。
- 风险 claims 不进入最终英文 Listing。

### AI Generation 模块

- DeepSeek 失败不 fallback mock。
- `ENABLE_GENERATION_MOCK=true` 时仅开发环境允许 fallback mock。
- JSON 解析失败显示真实错误。
- Final Listing 核心字段非空。
- Bullet Points 正好 5 条。
- 不保存 `mock-local` 结果。

### Result Display 模块

- 未生成项目显示 empty / pending state。
- 生成失败显示可见错误，按钮恢复可点击。
- 已保存结果刷新后可读取。
- 结果页不显示首页 demo Listing。

### Copy 模块

- Copy 只复制英文。
- Title copy 不包含中文。
- Bullet copy 正好 5 条。
- Full listing copy 包含 Title、Bullets、Description、Search Terms。
- Full listing copy 不包含 Missing Info、中文解释、策略摘要。

### Landing / Preview 模块

- 首页 preview 不调用 `/api/generate-listing`。
- 首页可以展示 `mockGenerationResult`。
- 首页 CTA 只跳转到 `/projects/new` 或 `/login`。

当前重点测试清单：

1. 新建页不出现 demo 数据。
2. 低信息输入也能生成。
3. 竞品资料能进入 request body。
4. DeepSeek 失败不 fallback mock。
5. Final Listing 核心字段非空。
6. Bullet Points 正好 5 条。
7. Copy 只复制英文。
8. 首页 preview 不调用 `/api/generate-listing`。

## 九、文件边界

### Auth

可以动：

- `app/login/page.tsx`
- `app/login/auth-form.tsx`
- `app/register/page.tsx`
- `lib/supabase-browser.ts`
- `lib/supabase-server.ts`
- `lib/supabase-config.ts`
- `lib/generation-auth.ts`

谨慎动：

- `app/dashboard/page.tsx` 中退出登录和未登录跳转逻辑。
- cookie 名称 `work_up_access_token`、`work_up_refresh_token`，改动会影响服务端生成鉴权。

不要乱动：

- Supabase anon key / service role 暴露规则。
- RLS 相关假设。

### Draft

可以动：

- `app/projects/new/page.tsx`
- `components/project-form/listing-wizard.tsx`
- `lib/project-draft.ts`
- `lib/types.ts`

建议新增：

- `lib/product-brief.ts`
- `lib/competitor-insights.ts`

谨慎动：

- `draftDefaults` 字段名。
- `buildProjectDraftPayload` 输出字段。
- `product_projects.form_data` 的原始输入快照。

不要乱动：

- 已进入 Supabase 的字段语义。
- Draft 保存后跳转结果页的基本流程。

### AI Generation

可以动：

- `app/api/generate-listing/route.ts`
- `lib/ai-listing.ts`
- `lib/prompts/amazon-listing-system-prompt.ts`
- `lib/prompts/amazon-listing-user-prompt.ts`
- `lib/cloudflare-env.ts`

建议新增：

- `lib/listing-prompt.ts`
- `lib/listing-strategy.ts`
- `lib/generation-result-validation.ts`

谨慎动：

- DeepSeek env 名称：
  - `AI_PROVIDER`
  - `DEEPSEEK_API_KEY`
  - `DEEPSEEK_BASE_URL`
  - `DEEPSEEK_MODEL`
  - `ENABLE_GENERATION_MOCK`
- API response shape，E2E 和结果页依赖它。

不要乱动：

- 真实项目鉴权。
- Production mock 禁用规则。
- 失败 fallback mock 禁止规则。

### Result Page

可以动：

- `app/projects/[id]/result/page.tsx`
- `components/ui/result-block.tsx`
- `components/ui/copy-button.tsx`

建议新增：

- `lib/final-listing-copy.ts`

谨慎动：

- 保存 DeepSeek 结果到 `generation_results` 的规则。
- `source !== "deepseek"` 不保存。
- `model === "mock-local"` 不保存。

不要乱动：

- demo / mock 与真实结果的隔离。
- 用户无权访问项目时的错误处理。

### Landing Preview

可以动：

- `app/page.tsx`
- `components/landing/home-page-content.tsx`
- `components/landing/hero.tsx`
- `components/landing/product-preview.tsx`
- `components/landing/feature-grid.tsx`
- `components/landing/process-strip.tsx`
- `components/landing/final-cta.tsx`

谨慎动：

- `mockGenerationResult` 只用于 preview 的边界。
- CTA 跳转逻辑。

不要乱动：

- landing 触发真实生成。
- landing 保存任何 generation result。

### Tests

可以动：

- `tests/e2e/*.spec.mjs`
- `tests/e2e/helpers.mjs`
- `scripts/test-project-draft.mjs`
- `scripts/test-generation-result.mjs`
- `scripts/test-ai-listing.mjs`
- `scripts/test-generation-auth.mjs`
- `scripts/test-generate-listing-route.mjs`
- `scripts/test-supabase-server.mjs`
- `scripts/test-mvp-tools.mjs`

建议新增：

- `scripts/test-product-brief.mjs`
- `scripts/test-competitor-insights.mjs`
- `scripts/test-generation-result-validation.mjs`
- `scripts/test-final-listing-copy.mjs`

不要乱动：

- E2E 中对“新建页不出现 demo 数据”的保护。
- E2E 中对“DeepSeek 失败不 fallback mock”的保护。

### Docs

可以动：

- `docs/workup-architecture-blueprint.md`
- `docs/supabase-schema.md`
- `docs/ai-prompt-design.md`
- `docs/phase-one-plan.md`
- `docs/QA.md`
- `docs/delivery-checklist.md`

谨慎动：

- README 中面向真实运行的命令和 env 说明。

不要乱动：

- 与当前代码不一致的文档不能继续扩大误导；如果发现旧文档写着生产可 fallback mock，应在后续文档任务中修正。

## 十、输出要求

本文件是后续拆分多个 Codex 对话开发 Work UP 的架构蓝图。后续每个对话开始前，应先阅读：

1. `AGENTS.md`
2. `README.md`
3. `docs/workup-architecture-blueprint.md`
4. 当前任务相关源码

每个后续任务都应遵守：

- 产品名固定为 Work UP。
- 只做当前阶段需要的最小可行修改。
- 不跨模块大范围重构。
- 不把 mock 数据带进真实项目流。
- 不在前端暴露 server-only secret。
- 修改业务逻辑后必须补测试。
- 修改 UI 后必须检查桌面端和手机端。
- 完成后说明修改文件、完成内容、运行测试和剩余风险。
