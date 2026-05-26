# Work UP

Work UP is an Amazon-only AI Listing assistant for beginner sellers. The current core flow includes Supabase email auth, project Draft storage, Work UP Product Brief / Competitor Insights / Listing Strategy modules, a protected DeepSeek generation endpoint, GenerationResult validation, the new result page, and English-only copy helpers.

## Routes

- `/` Landing page.
- `/login` Supabase email login UI.
- `/register` Supabase email registration UI.
- `/dashboard` Project dashboard. Reads Supabase projects from the browser session.
- `/projects/new` Four-step Listing creation flow. Saves a Draft project to Supabase.
- `/projects/[id]/result` Work UP result page. Shows Final Amazon Listing first, then quality, strategy, missing info, assumptions, competitor insights, compliance notes, and analysis.
- `/product-analysis`, `/competitor-analysis`, `/listing-generator`, `/seo-keywords`, `/image-suggestions` MVP tool preview pages.

## Local Run

Install dependencies, copy env values, and start the development server:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

```text
http://127.0.0.1:3000
```

Local development and production build use the standard Next.js output:

- `npm run dev` uses `.next`
- `npm run build` and `npm run start` use `.next`
- `npm run preview` builds and previews the Cloudflare Worker output through OpenNext.
- `npm run deploy` builds and deploys to Cloudflare.

This keeps the project compatible with the Cloudflare OpenNext adapter.

If the browser says the site cannot be reached, the development server is not running in that moment. Keep a PowerShell window open at `D:\codex\Amazon` and run `npm run dev` again, then refresh `http://127.0.0.1:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in Supabase values. For real generation, configure a valid `DEEPSEEK_API_KEY`.
   If the key is missing or invalid, real generation returns a visible error instead of using mock output.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

4. Run the SQL in `docs/supabase-schema.md` from the Supabase SQL Editor.
5. In Supabase Auth, either disable email confirmation for development or create a confirmed user manually.
6. Open `/login`, log in, then create a Listing project.

When Supabase env vars are missing, static preview pages can still be viewed. When Supabase env vars are present, Dashboard and generation require login.

`DEEPSEEK_API_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_`.

## DeepSeek Generation

The app exposes a server route:

```text
POST /api/generate-listing
```

Behavior:

- The route reads the real project row and `form_data`.
- The route builds `ProductBrief`, `CompetitorInsights`, `ListingStrategy`, and a Work UP listing prompt.
- With a usable `DEEPSEEK_API_KEY`, the route calls DeepSeek Chat Completions and asks for strict Work UP `GenerationResult` JSON.
- DeepSeek output must pass `validateGenerationResult` before it can be returned as a successful result.
- `DEEPSEEK_BASE_URL` defaults to `https://api.deepseek.com/chat/completions`.
- Set `DEEPSEEK_MODEL` to `deepseek-chat` or `deepseek-reasoner`.
- If the key is missing, malformed, expired, unauthorized, out of balance, times out, returns non-JSON, or fails validation, the route returns the real error. It does not fallback to mock.
- `ENABLE_GENERATION_MOCK=true` is only a non-production development placeholder. It must not be used in production and must not save mock output to real `generation_results`.
- Successful generated output can be saved into `generation_results` only when `source === "deepseek"`, `model !== "mock-local"`, and the result matches the Work UP `GenerationResult` schema.
- When Supabase is configured, this API requires the logged-in user's access token and reads the project through Supabase RLS.

## Mock Boundary

- `mockGenerationResult` is landing-page preview data only.
- The landing preview may show static mock content, but it must not call `/api/generate-listing`.
- Real project pages, generation routes, result pages, and Supabase saved results must not use `mockGenerationResult`.
- Old mock or old schema results are not treated as successful Work UP results; users should regenerate to get the new Listing format.

## Cloudflare Deployment Checklist

This project is configured for Cloudflare Workers using the OpenNext Cloudflare adapter.

1. Run `npm install` after cloning or after this deployment config change.
2. Log in to Cloudflare locally:

```bash
npx wrangler login
```

3. Set build-time variables in your Cloudflare project settings or local shell:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AI_PROVIDER=deepseek
DEEPSEEK_BASE_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

4. Set the DeepSeek key as a Cloudflare secret:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

5. In Supabase, run the SQL from `docs/supabase-schema.md`.
6. In Supabase Auth settings, configure the production site URL and redirect URL:

```text
https://your-cloudflare-domain.workers.dev
https://your-cloudflare-domain.workers.dev/**
```

7. Preview locally:

```bash
npm run preview
```

8. Deploy:

```bash
npm run deploy
```

9. Test the production flow:

```text
Register/Login -> Dashboard -> New Listing -> Result Page -> Generate -> Save Result
```

## Environment Variables

| Name | Browser Visible | Required For | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Auth and database | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Auth and database | Public anon key only |
| `AI_PROVIDER` | No | AI provider selection | Set to `deepseek` |
| `DEEPSEEK_API_KEY` | No | Real AI generation | Never add `NEXT_PUBLIC_` |
| `DEEPSEEK_BASE_URL` | No | Real AI generation | Defaults to DeepSeek Chat Completions URL |
| `DEEPSEEK_MODEL` | No | Real AI generation | Defaults to `deepseek-chat`; can use `deepseek-reasoner` |

## Current Scope

Current scope supports Supabase browser-side auth, real Draft saving, real project reading, ProductBrief, CompetitorInsights, ListingStrategy, ListingPrompt, GenerationResultValidation, result saving, the new result page, and English-only copy. Real generation does not fallback to mock.

## Production Notes

- Never expose `service_role` in the frontend or Cloudflare variables.
- Keep `DEEPSEEK_API_KEY` server-only.
- In Supabase Auth URL Configuration, set the production Site URL to your Cloudflare domain and add the wildcard redirect URL.
- For real user signups, configure a reliable email provider in Supabase Auth. For development, manual confirmed users are acceptable.
- Run `npm test` and `npm run build` before deployment.
