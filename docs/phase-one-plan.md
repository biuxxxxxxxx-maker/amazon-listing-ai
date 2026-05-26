# Work UP Phase One Plan

Status: historical phase-one UI plan. Work UP has since moved beyond this mock-only phase into real Supabase Draft storage, Work UP schema modules, DeepSeek generation, GenerationResult validation, and the new result page. Keep this document as background for the original UI direction, not as the current generation contract.

## Goal

Build a polished, responsive preview UI for Work UP, an Amazon-only AI Listing assistant for new sellers. Phase one focused on visual quality, guided flow, and static preview data before Supabase and DeepSeek were connected.

## Product Direction

Work UP should feel like a refined SaaS product first, with a guided beginner workflow second, and a dashboard as supporting project management. The visual direction combines Linear-style product polish with Stripe Dashboard-style business credibility.

## In Scope

- Landing page with strong first impression and mixed input/result product preview.
- Login/register UI using email-oriented layout.
- Dashboard preview with project history.
- Four-step Listing creation flow.
- Static preview result page with bilingual Amazon Listing output.
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
- `/login` Login/register preview UI.
- `/dashboard` Project dashboard preview.
- `/projects/new` Four-step project wizard.
- `/projects/demo/result` Historical static preview route, not the current real result route.

## Implementation Order

1. Create Next.js, TypeScript, and Tailwind project structure.
2. Add design tokens and global styles.
3. Build shared UI components.
4. Build landing page.
5. Build login and dashboard pages.
6. Build project creation wizard.
7. Build static result preview page.
8. Add responsive polish and copy interactions.
9. Run local verification.

## Current Mock Boundary

- `mockGenerationResult` is only for the landing-page preview.
- The landing preview can show static mock content, but it must not call `/api/generate-listing`.
- Real project pages, real generation pages, real result pages, and `/api/generate-listing` must not use the landing preview mock.
- Production DeepSeek failures must display real errors, not static fallback output.
