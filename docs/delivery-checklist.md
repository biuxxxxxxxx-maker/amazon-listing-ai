# Work UP MVP Delivery Checklist

Use this checklist before handing the site to a tester or deploying it to Cloudflare.

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
```

Rules:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-visible.
- `DEEPSEEK_API_KEY` must stay server-only.
- Do not use or expose a Supabase `service_role` key in this app.

## Supabase

1. Run `docs/supabase-schema.md` in Supabase SQL Editor.
2. In Authentication URL Configuration, set:

```text
Site URL: https://your-cloudflare-domain.workers.dev
Redirect URL: https://your-cloudflare-domain.workers.dev/**
```

For local development, also allow:

```text
http://127.0.0.1:3000/**
http://localhost:3000/**
```

3. For development, create a confirmed user manually if emails are not arriving.
4. For production, configure a reliable auth email provider before opening public registration.

## Local Verification

```bash
npm install
npm test
npm run build
npm run dev
```

Then test:

```text
Login -> Dashboard -> New Listing -> Save Draft -> Result Page -> Regenerate -> Save Result
```

## Cloudflare Deployment

This project targets Cloudflare Workers through the OpenNext Cloudflare adapter.

1. Install dependencies:

```bash
npm install
```

2. Log in to Cloudflare:

```bash
npx wrangler login
```

3. Set Cloudflare build/runtime variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
AI_PROVIDER
DEEPSEEK_MODEL
```

4. Set the DeepSeek key as a secret:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
```

5. Preview the Cloudflare build:

```bash
npm run preview
```

6. Deploy:

```bash
npm run deploy
```

7. Update Supabase Auth URLs to match the Cloudflare domain.
8. Test the full flow with a confirmed user.

## DeepSeek

- `/api/generate-listing` reads the real project Draft, builds ProductBrief, CompetitorInsights, ListingStrategy, ListingPrompt, calls DeepSeek Chat Completions, and validates the returned Work UP GenerationResult.
- If `DEEPSEEK_API_KEY` is missing, invalid, expired, unauthorized, out of balance, or the network request fails, the app must display the real error.
- If DeepSeek returns non-JSON or a JSON shape that fails validation, the app must display the real validation/parsing error.
- Production must not fallback to mock output.
- `ENABLE_GENERATION_MOCK=true` is only a non-production development placeholder and must not save mock output to real `generation_results`.
- Saved generation rows must have `source: "deepseek"`, must not use `model: "mock-local"`, and must match the Work UP GenerationResult schema.
- Old mock or old schema results must not be displayed as successful results; ask the user to regenerate the Work UP新版 Listing.
- When Supabase is configured, `/api/generate-listing` requires a valid logged-in user token.

## Current Work UP Core Modules

- ProductBrief: standardizes raw project input into confirmed facts, missing info, prohibited claims, and completeness.
- CompetitorInsights: keeps competitor titles, bullets, URLs, review pain points, risky claims, blocked claims, and opportunities separate from our confirmed facts.
- ListingStrategy: chooses primary/secondary keywords, positioning, five selling-point slots, avoidClaims, and safeClaims.
- ListingPrompt: passes ProductBrief, CompetitorInsights, and ListingStrategy into DeepSeek as strict JSON context.
- GenerationResultValidation: rejects mock source, `mock-local`, non-5 bullets, blocked claims, invalid English fields, and malformed schema.
- New result page: shows Final Amazon Listing first, then quality, strategy, missing info, assumptions, compliance, competitor insights, and analysis.
- English-only Copy: copies only `finalListing.*.english` values.
