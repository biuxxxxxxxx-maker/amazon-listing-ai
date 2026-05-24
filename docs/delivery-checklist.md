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

- If `DEEPSEEK_API_KEY` is missing, the app returns mock Listing output.
- If `DEEPSEEK_API_KEY` is present, `/api/generate-listing` calls DeepSeek Chat Completions.
- When Supabase is configured, `/api/generate-listing` requires a valid logged-in user token.
