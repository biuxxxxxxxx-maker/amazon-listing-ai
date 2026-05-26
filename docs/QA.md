# QA and E2E Checklist

This project uses lint, TypeScript, production build, and Playwright E2E tests as the release gate.

## Local Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Standard Checks

Run these before deploying or after any fix:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

Or run the combined gate:

```bash
npm run check
```

For a visible browser run:

```bash
npm run test:e2e:headed
```

## Test Account

Most E2E tests mock Supabase Auth and do not need a real account. To run the optional real login smoke test, set:

```powershell
$env:E2E_TEST_EMAIL="your-test-user@example.com"
$env:E2E_TEST_PASSWORD="your-test-password"
npm run test:e2e
```

Do not commit real test credentials.

## DeepSeek Safety

E2E tests intercept `/api/generate-listing` and return a controlled test fixture. Tests must not call DeepSeek directly. This fixture is not an application fallback and must not be saved as a production generation result. The homepage CTA is covered by a network assertion that fails if it calls `/api/generate-listing`.

Real DeepSeek generation should only happen after a user has entered project data, saved a Draft, reached the result page, and clicked the generate action.

Real generation safety rules:

- `mockGenerationResult` is only for the landing-page preview.
- The landing preview can show static mock content, but it must not call `/api/generate-listing`.
- Real project pages, result pages, and `/api/generate-listing` must not use `mockGenerationResult`.
- Production must not fallback to mock when the DeepSeek key is missing, balance is insufficient, the network fails, JSON parsing fails, or schema validation fails.
- `ENABLE_GENERATION_MOCK=true` is only allowed as a non-production development placeholder and must not save to real `generation_results`.
- Supabase generation results must be `source: "deepseek"`, must not be `model: "mock-local"`, and must match the Work UP `GenerationResult` schema.
- Old mock or old schema results must prompt the user to regenerate the Work UP新版 Listing.

## Supabase Setup Required For Full Production QA

In Supabase SQL Editor, run the SQL block in:

```text
docs/supabase-schema.md
```

This creates:

- `public.users`
- `public.product_projects`
- `public.generation_results`
- RLS policies
- `handle_new_user()`
- `set_updated_at()`

In Supabase Auth URL Configuration:

```text
Site URL: https://your-vercel-domain.vercel.app
Redirect URLs: https://your-vercel-domain.vercel.app/**
```

Enable Email Auth. For quick testing, either disable email confirmation or manually create a confirmed test user.

## Pre-Launch Manual Smoke

After automated checks pass, manually confirm:

- `/` renders and CTA navigates to login or project creation without generating.
- `/login` shows visible success or error feedback.
- `/dashboard` requires login when Supabase is configured.
- `/projects/new` requires login when Supabase is configured.
- Draft save reaches `/projects/:id/result`.
- Result page generation shows either a valid DeepSeek result or a visible real error.
- Saved result copy actions output English-only Title, Bullet Points, Description, and Search Terms.
- `/api/health` reports expected Supabase and DeepSeek environment status.
