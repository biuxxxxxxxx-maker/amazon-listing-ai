# Work UP

Work UP is an Amazon-only AI Listing assistant for beginner sellers. The MVP includes Supabase email auth, project storage, result storage, and a protected DeepSeek generation endpoint with a mock fallback for local development.

## Routes

- `/` Landing page.
- `/login` Supabase email login UI.
- `/register` Supabase email registration UI.
- `/dashboard` Project dashboard. Reads Supabase projects from the browser session.
- `/projects/new` Four-step Listing creation flow. Saves a Draft project to Supabase.
- `/projects/demo/result` AI result page with mock fallback.
- `/product-analysis`, `/competitor-analysis`, `/listing-generator`, `/seo-keywords`, `/image-suggestions` MVP tool pages with front-end mock generation.

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
3. Fill in Supabase values. If you have not purchased DeepSeek API balance yet, leave
   `DEEPSEEK_API_KEY` empty; the app will use the local mock result.

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

When Supabase env vars are missing, mock pages stay viewable for UI preview. When Supabase env vars are present, Dashboard and generation require login.

`DEEPSEEK_API_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_`.

## DeepSeek Generation

The app exposes a server route:

```text
POST /api/generate-listing
```

Behavior:

- Without a usable `DEEPSEEK_API_KEY`, the route returns the structured local mock result.
- With a usable `DEEPSEEK_API_KEY`, the route calls DeepSeek Chat Completions and asks for structured bilingual Amazon Listing JSON.
- `DEEPSEEK_BASE_URL` defaults to `https://api.deepseek.com/chat/completions`.
- Set `DEEPSEEK_MODEL` to `deepseek-chat` or `deepseek-reasoner`.
- If the key is malformed, expired, unauthorized, or the account has no API balance, the route falls back to mock instead of breaking the page.
- The result page can save generated output into `generation_results`.
- When Supabase is configured, this API requires the logged-in user's access token and reads the project through Supabase RLS.

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

Current MVP supports Supabase browser-side auth, real Draft saving, real project reading, result saving, and a protected server-side DeepSeek generation route with mock fallback.

## Production Notes

- Never expose `service_role` in the frontend or Cloudflare variables.
- Keep `DEEPSEEK_API_KEY` server-only.
- In Supabase Auth URL Configuration, set the production Site URL to your Cloudflare domain and add the wildcard redirect URL.
- For real user signups, configure a reliable email provider in Supabase Auth. For development, manual confirmed users are acceptable.
- Run `npm test` and `npm run build` before deployment.
