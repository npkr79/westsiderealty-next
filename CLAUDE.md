# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server (Turbopack enabled)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint

# Navigation & route auditing
npm run check:routes                    # Validate route integrity
npm run audit:investor-journey          # Playwright nav audit (requires dev server on :3000)
npm run audit:investor-journey:debug    # Same, with visible browser
```

TypeScript build errors are intentionally ignored in `next.config.ts` (`ignoreBuildErrors: true`) while legacy route typing is stabilized. Run `tsc --noEmit` separately to see type errors.

## Architecture Overview

This is a **Next.js 16 App Router** project with two distinct product surfaces sharing one codebase:

### 1. Public Listings Platform (consumer-facing)

URL structure follows the pattern `/{citySlug}/projects/{projectSlug}` for project detail pages. **Do not construct these URLs with template literals** — ESLint enforces use of helpers from `src/lib/routes.ts`:

- `buildProjectUrl(citySlug, projectSlug)` — relative links
- `buildProjectAbsoluteUrl(citySlug, projectSlug)` — canonical/metadata/schema/sitemap URLs
- `buildProjectsIndexUrl(citySlug)` — city projects index

Key public routes:
- `/{citySlug}/{microMarketSlug}` — micro-market intelligence pages
- `/{citySlug}/projects/{projectSlug}` — project detail pages
- `/{citySlug}/micro-markets` — micro-market hub
- `/developers/{slug}` — developer profiles

### 2. CRM / Internal Dashboard

Protected behind middleware (`middleware.ts`) that validates Supabase auth and CRM role. Roles map to dashboard paths via `src/lib/crm/roles.ts`:

| Role | Path |
|---|---|
| admin | /dashboard/admin |
| sales_head | /dashboard/sales |
| team_lead | /dashboard/team |
| agent | /dashboard/agent |
| marketing | /dashboard/marketing |
| channel_partner | /dashboard/partner |
| analyst | /dashboard/analytics |

Protected prefixes: `/dashboard`, `/leads`, `/pipeline`, `/routing`, `/tasks`, `/whatsapp`, `/crm/whatsapp`, `/crm/automation-monitor`, `/crm/revenue-dashboard`, `/journeys`, `/settings`.

CRM types are centralized in `src/lib/crm/types.ts` (`CrmRole`, `CrmLead`, `CrmTask`, `CrmActivity`, etc.).

## Supabase Client Pattern

Three client variants — use the correct one for context:

| File | Use when |
|---|---|
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers (uses cookies) |
| `src/lib/supabase/serviceClient.ts` | Server-only code needing service role (bypasses RLS) |
| `src/lib/supabase/browserClient.ts` | Client Components |
| `src/lib/supabase/buildClient.ts` | `generateStaticParams` at build time |

The service client requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. It falls back to RLS-protected anon client when permission errors (code `42501`) occur — see the lead submission pattern in `src/app/actions/submit-lead.ts`.

## Lead Submission Flow

All leads go through the server action `src/app/actions/submit-lead.ts` (`submitLead()`):

1. Inserts into `leads` table (falls back to service client on RLS permission errors)
2. Mirrors to `crm_leads` with attribution data (UTM, gclid, fbclid, landing page)
3. Calls `mapBehaviorToLead()` to link behavioral events by phone
4. Calls `routeLeadByOwnership()` for automatic CRM assignment

Lead types: `PROJECT_INTEREST`, `SELLER_VALUATION`, `BUYER_REQUIREMENT`, `LANDOWNER_SHARE`, `GENERAL_CONTACT`, `GOA_PROPERTY`, `DEVELOPER_INQUIRY`.

## Micro-Market Intelligence Pages

Data flow for `/{citySlug}/{microMarketSlug}`:

1. `getMicroMarketFromCache()` — reads from `micro_market_page_cache_v2` Supabase table
2. `buildMicroMarketViewModel()` — transforms raw cache row into typed `MicroMarketViewModel`
3. `MicroMarketPageContent` renders section components from `src/components/micro-market/`

The view model (`src/services/microMarketViewModel.ts`) is the single source of truth for micro-market UI data. Do not read raw cache fields in components.

## Project Detail Pages

Data flow for `/{citySlug}/projects/{projectSlug}`:

1. `projectService.getCityLevelProjectBySlug()` — fetches project with relations (city, micro_market, developer)
2. `projectInsightsService` — computes derived signals (density, livability, stage risk, buyer segments)
3. `ProjectDetailsPageContent` — renders modular sections from `src/components/project-details/modules/`

Advisory sections (`LocationInsights`, `DensityInsights`, `ComparisonInsights`, `RiskFactors`) are reordered at runtime based on `ListingIntent` (investment / end-use / upgrade / nri).

## Product Scope Guardrail

This listings experience is **advisory-led and conversion-first**. From `.cursor/rules/listings-intelligence-scope.mdc`:

- **Do build:** buyer fit signals, corridor positioning, livability clarity, risk/upside signals, micro-market context
- **Do not build in listings:** numeric scoring models as institutional analytics, institutional dashboards, forecasting UI, heavy quantitative frameworks

The institutional intelligence layer is a separate system. Listings consume only decision-friendly summary signals.

## Scheduled Jobs (Vercel Crons)

Defined in `vercel.json`:
- `/api/cron/journey-worker` — every 2 minutes (WhatsApp journey execution)
- `/api/sitemap/regenerate` — daily at 2am
- `/api/admin/scraper/run` — daily at 6am

## Analytics & Tracking

- Vercel Analytics and Google Analytics (`G-GYG41B6D00`) via root layout
- Facebook Pixel (`1174059124805172`) inline in root layout `<head>`
- `BehaviorTracker` client component (in `ClientProviders`) tracks user behavior events linked to CRM leads by phone
