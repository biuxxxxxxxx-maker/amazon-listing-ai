# Work UP Phase One Plan

## Goal

Build a polished, responsive mock UI for Work UP, an Amazon-only AI Listing assistant for new sellers. Phase one focuses on visual quality, guided flow, and complete mock data. It does not connect Supabase or DeepSeek.

## Product Direction

Work UP should feel like a refined SaaS product first, with a guided beginner workflow second, and a dashboard as supporting project management. The visual direction combines Linear-style product polish with Stripe Dashboard-style business credibility.

## In Scope

- Landing page with strong first impression and mixed input/result product preview.
- Login/register UI using email-oriented layout.
- Dashboard mock with project history.
- Four-step Listing creation flow.
- Mock result page with bilingual Amazon Listing output.
- Copy, save, regenerate, and edit UI states.
- Responsive desktop, tablet, and mobile layouts.

## Out of Scope

- Supabase auth and database connection.
- DeepSeek API calls.
- Real project persistence.
- Amazon data scraping.
- Multi-platform support.
- Admin or billing features.

## Core Capabilities Represented

1. Product selection analysis.
2. Competitor analysis.
3. Review pain point analysis.
4. Differentiated selling point extraction.
5. Native English translation.
6. Amazon Listing generation.
7. SEO tags, Search Terms, and keyword generation.
8. Image suggestions.
9. Chinese reference explanations.
10. Beginner-friendly guidance.
11. Save project.
12. Copy results.

## Bilingual Output Rule

Every final Listing item must show English first and Chinese support beneath it. Titles, bullets, FAQ, Search Terms, and descriptions must be bilingual. English should be native, Amazon-appropriate, and not feel like generic AI copy.

## First Phase Routes

- `/` Landing page.
- `/login` Login/register mock UI.
- `/dashboard` Project dashboard mock.
- `/projects/new` Four-step project wizard.
- `/projects/demo/result` Mock generation result.

## Implementation Order

1. Create Next.js, TypeScript, and Tailwind project structure.
2. Add design tokens and global styles.
3. Build shared UI components.
4. Build landing page.
5. Build login and dashboard pages.
6. Build project creation wizard.
7. Build mock result page.
8. Add responsive polish and copy interactions.
9. Run local verification.
