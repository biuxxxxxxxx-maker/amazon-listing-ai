# Work UP Codex Handoff

本文用于在 Codex 对话记录清空后，让新的 Codex 会话快速接手 Work UP 后续开发。

## 1. 项目基本信息

- 项目名：Work UP
- 本地路径：`D:\codex\Amazon`
- GitHub：`amazon-listing-ai`
- 部署：Vercel
- 技术栈：Next.js App Router + Tailwind + Supabase Auth/DB + DeepSeek API + Playwright E2E
- 当前主分支：`main`
- 沟通语言：默认中文，见 `AGENTS.md`

## 2. 产品定位

Work UP 是面向跨境卖家的 Amazon Listing 策略分析与生成工具。

它不是普通 AI Listing 生成器。它的目标是把中文产品资料、竞品信息、买家痛点和合规边界，转化为可复制到 Amazon 后台的英文 Listing。

核心价值：更真实、更合规、更接近运营思维，而不是 AI 自己瞎编。

目标用户：

1. 初入跨境电商行业的小白：需要理解 Listing 为什么重要、为什么这样写、缺什么资料、怎么补。
2. 有一定经验的 Amazon 卖家：需要辅助分析竞品、关键词、痛点、合规风险和自己没想到的运营角度。

## 3. 当前已完成内容

按最近主要 commit / 模块总结：

- `f409b7e Build Work UP generation core`
  - 落地 Work UP 核心 schema。
  - 新增 ProductBrief、CompetitorInsights、ListingStrategy、ListingPrompt、GenerationResultValidation 等业务模块。
  - `/api/generate-listing` 接入新业务链路。
  - 结果页适配新版 `GenerationResult`。
  - Copy 模块改为 English-only。
- `423351b Improve Work UP project input flow`
  - `/projects/new` 输入页适配 Product Brief 和 Competitor Input。
  - 只保留产品中文名、Amazon 站点、产品类目三个必填项。
  - Draft payload 保存基础可选资料、竞品资料和原始 `form_data`。
- `36e06b5 Sync Work UP documentation with generation flow`
  - README 和相关文档同步真实生成链路。
  - 明确真实生成失败不 fallback mock。
- `9a72c34 Sync Work UP schema design document`
  - `docs/workup-schema-design.md` 同步 `QualityScore.level`。
  - `FinalListing.bulletPoints[]` 同步 `sourceBasis` 和 `evidenceFields`。
- `e086950 Fix Work UP generation auth and prompt schema`
  - 修复 `/api/generate-listing` 线上 401 鉴权问题。
  - 生成请求改为安全读取 bearer token / cookie。
  - Prompt schema 更稳定，要求 DeepSeek 返回严格 Work UP `GenerationResult`。
- `cc30ea1 Improve Work UP login persistence`
  - 登录页新增“保持登录状态”。
  - `rememberMe=true` 使用持久 Supabase session 和长期 Work UP cookies。
  - `rememberMe=false` 使用 session-only 状态。
  - 退出登录清理 Supabase session、Work UP cookies 和 rememberMe 状态。
- `ecf66f9 Restore Work UP login session automatically`
  - `/login` 加载时调用 `supabase.auth.getSession()`。
  - 已有可恢复 session 时同步 `work_up_access_token` / `work_up_refresh_token` 并自动跳转 `/dashboard`。
  - 无 session 时正常显示登录表单。

## 4. 当前核心链路

```text
用户输入
→ ProductBrief
→ CompetitorInsights
→ ListingStrategy
→ ListingPrompt
→ DeepSeek
→ validateGenerationResult
→ Result Page
→ English-only Copy
```

线上真实生成的服务端链路：

```text
product_projects row / form_data
→ buildProductBrief
→ analyzeCompetitorInput
→ buildListingStrategy
→ buildListingPrompt
→ call DeepSeek
→ parseDeepSeekJsonResponse
→ validateGenerationResult
→ API returns GenerationResult + GenerationInputSnapshot
→ Result page display / save
```

## 5. 关键文件

文档：

- `docs/workup-architecture-blueprint.md`
- `docs/workup-schema-design.md`
- `docs/supabase-schema.md`

核心 schema / 业务模块：

- `lib/workup-schema.ts`
- `lib/product-brief.ts`
- `lib/competitor-insights.ts`
- `lib/listing-strategy.ts`
- `lib/listing-prompt.ts`
- `lib/generation-result-validation.ts`
- `lib/final-listing-copy.ts`
- `lib/ai-listing.ts`

API / 页面：

- `app/api/generate-listing/route.ts`
- `app/projects/[id]/result/page.tsx`
- `app/projects/new/page.tsx`
- `components/project-form/listing-wizard.tsx`
- `app/login/auth-form.tsx`
- `app/dashboard/page.tsx`

Auth / Supabase / Draft：

- `lib/supabase-browser.ts`
- `lib/supabase-server.ts`
- `lib/generation-auth.ts`
- `lib/project-draft.ts`

测试：

- `tests/e2e/listing-flow.spec.mjs`
- `tests/e2e/auth.spec.mjs`
- `tests/e2e/helpers.mjs`
- `scripts/test-workup-schema.mjs`
- `scripts/test-product-brief.mjs`
- `scripts/test-competitor-insights.mjs`
- `scripts/test-listing-strategy.mjs`
- `scripts/test-listing-prompt.mjs`
- `scripts/test-generation-result-validation.mjs`
- `scripts/test-ai-listing.mjs`
- `scripts/test-generate-listing-route.mjs`
- `scripts/test-generation-auth.mjs`
- `scripts/test-supabase-server.mjs`
- `scripts/test-final-listing-copy.mjs`
- `scripts/test-project-draft.mjs`

## 6. 不可破坏规则

- 产品名固定为 Work UP。
- `mockGenerationResult` 只能用于首页 preview。
- 首页 preview 可以展示静态 mock，但不能调用 `/api/generate-listing`。
- 真实项目页、真实生成页、真实结果页不能使用 `mockGenerationResult`。
- Production 中 `/api/generate-listing` 不能 fallback mock。
- DeepSeek key 缺失、余额不足、网络错误、JSON 解析失败、校验失败，都必须显示真实错误。
- `ENABLE_GENERATION_MOCK=true` 只允许非 production 开发占位，且不能保存到真实 `generation_results`。
- 保存到 Supabase 的 generation result 必须是 `source: "deepseek"`。
- `model` 不能是 `"mock-local"`。
- `FinalListing` 必须有 `title`、exactly 5 `bulletPoints`、`description`、`searchTerms`。
- 每个最终英文 Listing 字段必须和中文解释分离。
- Copy 只能复制英文，不能复制中文解释、策略、缺失信息、假设、竞品洞察或分析。
- 竞品 claim 不能直接进入 `finalListing`。
- 未确认的 `TSA lock`、`spinner wheels`、`airline approved`、`waterproof`、`scratch-proof`、`unbreakable` 等不能写进最终 Listing。
- Search Terms 不能包含竞品品牌词或 blocked claims。
- 不要用 `service_role` 绕过用户权限。
- 不要在前端暴露 server-only secret。
- 不要打印 access token、refresh token、DeepSeek key 或 Supabase secret。

## 7. 当前待验证问题

这些是新 Codex 接手后应优先确认的线上状态：

1. 最新登录持久化相关 commit 是否已经 push / redeploy：
   - `cc30ea1 Improve Work UP login persistence`
   - `ecf66f9 Restore Work UP login session automatically`
2. 线上 `/login` 是否能在已有 Supabase browser session 时自动跳 `/dashboard`。
3. 线上 result 页点击重新生成时，`POST /api/generate-listing` 是否还会 401。
4. 如果不再 401，是否进入 DeepSeek JSON / validation 阶段。
5. 如果生成失败，需要查看 Vercel Logs 的 `POST /api/generate-listing`。
6. 重点看日志字段：
   - auth failure reason
   - hasAccessToken / hasRefreshToken
   - getUserSuccess
   - projectId
   - projectOwnerId exists
   - promptVersion
   - DeepSeek HTTP status
   - JSON parse error
   - `validateGenerationResult` failure reason
   - blocked claim
   - `schemaVersion`
   - `source`
   - `bulletPoints`
7. 不要在日志中打印完整 token 或 secret。

## 8. 新 Codex 开始时必须执行

先读：

```text
AGENTS.md
README.md
docs/workup-architecture-blueprint.md
docs/workup-schema-design.md
docs/codex-handoff.md
```

再执行：

```bash
git status
git log --oneline -10
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

如果任务涉及线上问题，还应确认：

```bash
vercel --version
vercel env pull .env.vercel.local
```

注意：不要打印任何 secret。若 Vercel CLI 未登录，让用户执行 `vercel login`。

## 9. 推荐下一步

按优先级：

### P0：push 当前登录持久化修复并部署

确认本地 `main` 包含：

- `cc30ea1 Improve Work UP login persistence`
- `ecf66f9 Restore Work UP login session automatically`

然后由用户确认后 push / 等待 Vercel redeploy。

### P1：线上测试登录保持状态

验证：

- 勾选“保持登录状态”登录。
- 关闭或刷新浏览器后访问 `/login` 自动跳 `/dashboard`。
- 退出登录后访问 `/login` 不自动跳走。
- 不勾选时只保持当前会话。

### P2：线上测试 result 页重新生成

验证：

- 已登录用户进入真实项目 result 页。
- 点击重新生成。
- 请求携带 Authorization 或可读 Work UP auth cookie。
- API 不再返回 401。

### P3：如果 `/api/generate-listing` 报错，查 Vercel Logs

优先定位：

- 鉴权失败。
- Supabase project read 失败。
- DeepSeek 401 / 403 / 429 / timeout。
- DeepSeek 返回非 JSON。
- `validateGenerationResult` 校验失败。

### P4：修 DeepSeek JSON / validation 问题

若 DeepSeek 输出不符合 schema：

- 优先修 prompt 稳定性。
- 不要放宽 mock、安全、source、blocked claim 等核心规则。
- 可修正明显误判或错误解析。

### P5：最后再做 Gemini UI 落地

业务链路稳定前不要大改 UI。UI 落地时必须保持：

- mock 边界。
- English-only Copy。
- 竞品 claim 不直入最终 Listing。
- 真实生成失败显示真实错误。

## 10. 给新 Codex 的启动提示词

可以直接复制到新对话：

```text
请接手 Work UP 项目开发。

项目路径：D:\codex\Amazon
项目名固定为 Work UP。
请默认用中文沟通。

请先阅读：
1. AGENTS.md
2. README.md
3. docs/workup-architecture-blueprint.md
4. docs/workup-schema-design.md
5. docs/codex-handoff.md

然后先执行：
git status
git log --oneline -10
npm run lint
npm run typecheck
npm run build
npm run test:e2e

关键规则：
- 不要大范围重构，优先最小可行修改。
- mockGenerationResult 只能用于首页 preview。
- 真实生成不能 fallback mock，Production 不能 fallback mock。
- 保存到 Supabase 的 generation result 必须 source: "deepseek"，model 不能是 "mock-local"。
- FinalListing 必须包含 title、exactly 5 bulletPoints、description、searchTerms。
- Copy 只能复制英文。
- 竞品 claim 不能直接进入 finalListing。
- 未确认的 TSA lock、spinner wheels、airline approved、waterproof 等不能写进最终 Listing。
- 不要用 service_role 绕过用户权限。
- 不要打印 token、secret、DeepSeek key。

当前建议优先级：
P0：确认最新登录持久化修复是否已 push / redeploy。
P1：线上测试 /login 自动恢复 session。
P2：线上测试 result 页重新生成是否还会 401。
P3：如果 /api/generate-listing 报错，查看 Vercel Logs。
P4：如果进入 DeepSeek JSON / validation 阶段失败，优先修 prompt 稳定性或明显校验误判。
P5：业务链路稳定后再做 Gemini UI 落地。

请在动手前说明计划，完成后说明修改文件、测试结果和剩余风险。
```

## 11. 最后提醒

- 当前文档是交接索引，不替代架构蓝图和 schema 设计。
- 新任务开始前必须根据最新 `git status` 和 `git log` 判断本地是否已有未 push commit。
- 若用户要求排查线上问题，优先看 Vercel Logs，不要凭猜测改代码。
- 若需要改代码，先最小范围定位，再补脚本测试或 E2E。
- 若只做文档任务，不要修改 `app/*`、`components/*`、`lib/*`、`scripts/*`、`tests/*`。
