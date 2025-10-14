# Mindful AI Agent

## Overview
Mindful AI Agent is a Next.js 15 application that guides users through multimodal mental-health check-ins, persists their onboarding history in Supabase, and surfaces personalised analytics, recommendations, and goals. The project is production-ready for Vercel deployments and aligns with Supabase's row-level security policies.

## Core Capabilities
- Conversational onboarding with text, voice, emoji, and image inputs (`app/onboarding/page.tsx`).
- Transactional persistence of onboarding responses, mood entries, and insights through the `process_onboarding_check_in` RPC (`app/api/onboarding/check-in/route.ts`).
- Personalised wellness dashboard with trend visualisations, energy heatmaps, trigger clouds, and wellbeing score cards.
- Goal management dialog for creating, updating, archiving, and deleting Supabase-backed wellness goals (`components/dashboard/goal-manager.tsx`).
- Mood-entry history inspector with inline editing and deletion controls (`components/dashboard/mood-entry-history.tsx`).
- AI insights centre with dismiss (mark-as-read) workflow and badge summaries.

## Architecture Highlights
- **Frontend**: Next.js App Router, React 19, Tailwind CSS v4, shadcn/ui, Recharts.
- **Backend**: Supabase (PostgreSQL + Auth) accessed via Next.js API routes; service-role operations are isolated to server contexts.
- **Authentication**: NextAuth credentials provider backed by Supabase Auth (`lib/auth.ts`).
- **Data Layer**: Supabase RPCs and views deliver aggregated trigger, coping, and energy metrics (`supabase/schema.sql`).
- **Analytics Utilities**: Shared helpers in `lib/analytics.ts` normalise data for UI consumption and are covered by automated tests.

## Environment Configuration
| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client/server | Public anon key for client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Service role key for transactional writes (never expose to the browser) |
| `NEXTAUTH_SECRET` | server | Session signing secret |
| `NEXTAUTH_URL` | server | Base URL for NextAuth callbacks |
| `OPENAI_API_KEY` | server | Empathy and content generation |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | server | Music recommendations |
| `FOURSQUARE_API_KEY` | server (optional) | Place recommendations |

## Local Development
```bash
pnpm install
pnpm dev
```
1. Provision a Supabase project and apply `supabase/schema.sql` via the SQL Editor or CLI.
2. Populate `.env.local` with the variables above.
3. Launch `pnpm dev` and complete the onboarding flow at `http://localhost:3000/onboarding`.

## Quality Gates
```bash
pnpm lint        # Next.js + ESLint checks
pnpm test        # Node test runner covering analytics helpers
pnpm build       # Production build used in CI/CD and Vercel
```

## Key Modules & Directories
- `app/onboarding/page.tsx` – conversational wizard, dashboard, insights, and empathy tabs.
- `app/api/wellness-snapshot/route.ts` – consolidated data feed for dashboards.
- `app/api/mood-entries/[id]/route.ts` – edit/delete API for historic check-ins.
- `app/api/wellness-goals(/[id])/route.ts` – CRUD endpoints powering goal management.
- `app/api/ai-insights/[id]/route.ts` – mark-as-read endpoint for insights.
- `components/dashboard/*` – reusable dashboard visualisations and management dialogs.
- `lib/analytics.ts` – deterministic data transforms reused by both API layer and client components.
- `supabase/schema.sql` – canonical database schema, RLS policies, RPC, and reporting views.
- `tests/analytics.test.ts` – Node-based smoke tests validating analytics helpers.

## HTTP Surface
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/onboarding/check-in` | Persists onboarding responses and mood entry via RPC transaction. |
| `GET` | `/api/wellness-snapshot` | Returns per-user mood entries, goals, triggers, coping insights, and energy buckets. |
| `PATCH` `DELETE` | `/api/mood-entries/:id` | Update or remove a mood entry. |
| `GET` `POST` | `/api/wellness-goals` | List or create wellness goals. |
| `PATCH` `DELETE` | `/api/wellness-goals/:id` | Update progress / archive / remove a goal. |
| `PATCH` | `/api/ai-insights/:id` | Mark an AI insight as read. |
| `POST` | `/api/empathy-recommendations` | Generates empathy response and personalised content via OpenAI + partner APIs. |
| `POST` | `/api/{music,book,quote,place}-recommendation` | Fetches supplemental content from external providers. |

## Deployment Notes
- The project is optimised for Vercel. Ensure all environment variables are defined in the Vercel dashboard, and restrict `SUPABASE_SERVICE_ROLE_KEY` to server-only contexts (functions, edge middleware).
- Apply `supabase/schema.sql` to production Supabase before first deploy to guarantee required tables, policies, RPCs, and views exist.
- Vercel builds run `pnpm build`; keep the tree clean by committing generated API route files (`app/api/**/route.ts`) and sources referenced above.
- Observability is available through Vercel Analytics (`Analytics` component in `app/layout.tsx`). Consider layering Sentry or Logflare if deeper instrumentation is required.

## Support
For schema or deployment adjustments, edit `supabase/schema.sql` and re-run migrations. For UI or UX extensions, prioritise colocating view logic within `components/dashboard` and preserve analytics contracts defined in `lib/analytics.ts`.
