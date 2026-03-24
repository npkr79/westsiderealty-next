# Westside Realty — Project Knowledge

## Tech Stack
- **Framework**: Next.js 16 App Router (Turbopack dev)
- **Database**: Supabase (Postgres) — project ref `imqlfztriragzypplbqa`
- **Hosting**: Vercel
- **Production URL**: https://www.westsiderealty.in
- **Main branch**: `main` (deploys to production automatically)
- **Active feature branch**: `intelligence-main`
- **TypeScript build errors**: intentionally ignored in `next.config.ts` (`ignoreBuildErrors: true`)

---

## Database Tables & Schemas

### Core Listings Tables
| Table | Purpose |
|---|---|
| `rera_projects` | Source-of-truth project data from RERA filings — `url_slug`, `developer_name`, `proposed_completion_date`, etc. |
| `rera_units` | Individual unit records — `unit_type`, `carpet_area_sqm`, `total_units`, `booked_units` |
| `rera_buildings` / `rera_buildings_normalized` | Building-level data within projects |
| `rera_promoters` | Promoter/developer legal entities — use `brand_name` not `organization_name` |
| `rera_project_addresses` | Project location addresses |
| `rera_project_land_summary` | Land parcel summary per project |
| `projects` | Internal project metadata (supplements RERA data) |
| `micro_markets` | Micro-market definitions — `city_slug`, `url_slug`, `price_per_sqft_min/max`, `annual_appreciation_min`, `hero_hook` |
| `developers` | Developer profiles — `years_in_business`, `total_projects`, `hero_description`, `logo_url` |
| `developer_brands` | Brand entities (e.g. "Prestige Group") with `url_slug` |
| `cities` | City master data |

### Views & Materialized Views
| View/MV | Purpose |
|---|---|
| `listing_project_detail_enriched_mv` | Main enriched MV for project detail pages — primary data source |
| `developer_project_brand_map` | Joins `rera_projects → developer_brand_entities → developer_brands` |
| `v_developer_brand_profile` | Aggregated developer brand profile |
| `v_micro_market_project_summary` / `_v2` / `_v3` | Market-level project summaries |
| `v_project_unit_enriched` | Unit data with derived fields |
| `listing_project_comparables_v` | Comparable projects view |
| `project_capital_intelligence_v` | Capital stack intelligence |
| `project_competition_context_v` | Competitive context per project |
| `project_configuration_distribution_v` / `_v2` | Unit configuration breakdown |
| `project_execution_intelligence_v` | Execution/delivery intelligence |
| `project_inventory_intelligence_v` | Inventory availability |
| `project_location_context_v` | Location and connectivity context |
| `project_pricing_proxy_v` | Pricing estimates |
| `project_supply_radius_v` | Supply within radius |

### Intelligence / AI Tables
| Table | Purpose |
|---|---|
| `project_intelligence_queue` | AI enrichment job queue — `priority` (1 = highest), `project_id`, `status` |
| `project_live_intelligence` | AI-generated live intelligence per project |
| `micro_market_page_cache_v2` | Cached micro-market page data (AI-enriched) |
| `micro_market_ai_enrichment` | AI enrichment results for micro-markets |
| `micro_market_metrics` | Quantitative metrics per micro-market |
| `micro_market_supply_timeline` | Supply pipeline timeline |
| `micro_market_featured_projects` | Featured projects per market |
| `project_structural_profile` | Structural analysis per project |
| `project_rera_links` | Cross-links between related RERA entries |
| `project_micro_market_classification` | Project-to-micro-market mappings |
| `project_location_access` | Accessibility data per project |
| `link_health_log` | Weekly URL health check results |

### CRM Tables
| Table | Purpose |
|---|---|
| `crm_leads` | **Universal lead table — ONLY table for lead capture** |
| `crm_lead_sources` | Lead source lookup (UUID FK) — Website, Meta Ads, Google Ads, Referral, Walk-in |
| `crm_lead_stages` | Pipeline stage definitions |
| `crm_lead_activities` | Activity log per lead |
| `crm_lead_assignments` | Lead-to-agent assignment records |
| `crm_users` | CRM user accounts |
| `crm_tasks` | Task management |
| `crm_conversations` | Conversation threads |
| `crm_messages` | Message log (view over `crm_whatsapp_messages`) |
| `crm_whatsapp_messages` | WhatsApp messages — columns: `id, lead_id, phone, message, direction, status, provider_response, created_at` |
| `crm_whatsapp_conversations` | WhatsApp conversation threads |
| `crm_whatsapp_delivery_logs` | Delivery status logs |
| `crm_activity_log` | General CRM activity audit log |
| `crm_automation_config` | Automation configuration — controls WhatsApp journey automation and task SLA monitoring (`enabled`, `metadata` jsonb) |
| `crm_automation_logs` | Automation execution logs |
| `crm_journey_queue` | Journey execution queue |
| `crm_journey_steps` | Journey step definitions |
| `crm_campaigns` | Marketing campaigns |
| `crm_campaign_performance` | Campaign metrics |
| `crm_source_ownership` | Source-to-agent ownership routing |
| `crm_notifications` | In-app notifications |
| `crm_outbound_notifications` | Outbound notification queue |
| `crm_behavior_events` | User behavior events (linked to leads by phone) |
| `crm_meta_raw_leads` | Raw Meta Lead Ads webhook data — columns: `id, crm_lead_id, payload, ad_id, campaign_id` |
| `crm_deals` | Deal/opportunity records |
| `crm_investor_preferences` | Investor preference profiles |
| `crm_shortlist_projects` | Projects shortlisted by leads |
| `crm_listing_interactions` | Listing page interaction events |
| `crm_agent_alerts` | Agent alert records |
| `crm_creative_performance` | Ad creative performance |
| `crm_call_briefs` | AI-generated pre-call briefs per lead — `lead_id` (FK), `ai_summary` (text), `phone_intelligence` (jsonb), `raw_data` (jsonb), `generated_by`, `generated_at` |
| `crm_push_dedup` | Deduplication table for push/new-lead webhook — `dedup_key` (unique), `created_at`; rows auto-purged after 5 min |
| `crm_sla_log` | Task SLA breach log — stores overdue task notifications and SLA violation events |

### Key `crm_leads` Columns (selected)
| Column | Type | Notes |
|---|---|---|
| `status` | text | Pipeline status: `new`, `contacted`, `qualified`, `site_visit`, `negotiation`, `converted`, `lost`, `won` |
| `lead_status` | text | Secondary status field — distinct from `status`, tracks additional qualification states |
| `priority` | text | Buyer intent: `serious_buyer` / `evaluating` / `early_stage` |
| `first_contact_at` | timestamptz | Timestamp when lead was first contacted — null until first contact logged |
| `first_contact_minutes` | integer | Minutes between lead creation and first contact (computed/stored on contact) |
| `is_bulk_upload` | boolean | True for CSV imports / bulk migrations — suppresses push alerts and journey triggers |
| `last_activity_at` | timestamptz | Updated on every activity — used for cold lead detection (> 7 days = cold) |
| `attribution_metadata` | jsonb | UTM params, `fb_form_name`, `field_data` (Meta form answers), gclid, fbclid, landing page |

### Key Source UUIDs (`crm_lead_sources`)
| UUID | Name |
|---|---|
| `c3b72f38-171b-4ce6-a060-f40beed8bdb4` | Website (primary) |
| `192bf7e8-8be9-46e5-bb8f-dfe9298e3598` | Meta Ads |
| `27215444-e232-427c-acbb-2b17bcb92613` | Google Ads |
| `07aa12cf-9ed8-4401-8150-fefa040f52b8` | Referral |
| `bdc6de8f-5637-45eb-aaa9-ac30676af23e` | Walk-in |

### Other Tables
| Table | Purpose |
|---|---|
| `hyderabad_properties` / `dubai_properties` / `goa_holiday_properties` | City-specific property listings |
| `agents_profile` / `agent_profile_photos` | Agent profiles |
| `blog_articles` | Blog content |
| `homepage_banners` | Homepage banner CMS |
| `landing_pages` | Custom landing page configs |
| `testimonials` | Customer testimonials |
| `villa_intelligence_profiles` | Villa market intelligence |

---

## Site Architecture

### Public Routes (consumer-facing)
| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Homepage |
| `/hyderabad/projects` | `src/app/hyderabad/projects/page.tsx` | Hyderabad projects index |
| `/hyderabad/projects/[projectSlug]` | `src/app/hyderabad/projects/[projectSlug]/page.tsx` | Project detail (Hyderabad shortcut) |
| `/hyderabad/markets` | `src/app/hyderabad/markets/page.tsx` | Markets hub |
| `/hyderabad/[slug]/[category]` | `src/app/hyderabad/[slug]/[category]/page.tsx` | Market category pages |
| `/[citySlug]/projects/[projectSlug]` | `src/app/[citySlug]/projects/[projectSlug]/page.tsx` | **Canonical project detail page** |
| `/[citySlug]/[microMarketSlug]` | `src/app/[citySlug]/[microMarketSlug]/page.tsx` | Micro-market intelligence page |
| `/[citySlug]/[microMarketSlug]/[category]` | `src/app/[citySlug]/[microMarketSlug]/[category]/page.tsx` | Market category sub-page |
| `/[citySlug]/[microMarketSlug]/projects/[projectSlug]` | `src/app/[citySlug]/[microMarketSlug]/projects/[projectSlug]/page.tsx` | Project in market context |
| `/[citySlug]/projects` | `src/app/[citySlug]/projects/page.tsx` | City projects index |
| `/[citySlug]/micro-markets` | `src/app/[citySlug]/micro-markets/page.tsx` | Micro-market hub |
| `/[citySlug]/buy/[listingSlug]` | `src/app/[citySlug]/buy/[listingSlug]/page.tsx` | Property listing detail |
| `/developers` | `src/app/developers/page.tsx` | Developer directory |
| `/developers/[slug]` | `src/app/developers/[slug]/page.tsx` | Developer profile |
| `/insights` | `src/app/insights/page.tsx` | Insights hub |
| `/insights/[slug]` | `src/app/insights/[slug]/page.tsx` | Insight article |
| `/insights/gcc-hyderabad` | `src/app/insights/gcc-hyderabad/page.tsx` | GCC Hyderabad report |
| `/insights/institutional-investors` | `src/app/insights/institutional-investors/page.tsx` | Institutional investor report |
| `/institutional-investment-commercial` | `src/app/institutional-investment-commercial/page.tsx` | Institutional investment landing |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Blog post |
| `/contact` | `src/app/contact/page.tsx` | Contact page |
| `/buying-requirement` | `src/app/buying-requirement/page.tsx` | Buyer requirement form |
| `/sell-property` | `src/app/sell-property/page.tsx` | Seller form |

### CRM Dashboard Routes (auth-protected)
| Role | Path |
|---|---|
| admin | `/dashboard/admin` |
| sales_head | `/dashboard/sales` |
| team_lead | `/dashboard/team` |
| agent | `/dashboard/agent` |
| marketing | `/dashboard/marketing` |
| channel_partner | `/dashboard/partner` |
| analyst | `/dashboard/analytics` |

Other protected routes: `/leads`, `/pipeline`, `/routing`, `/tasks`, `/whatsapp`, `/crm/*`, `/journeys`, `/settings`

### API Routes
| Route | Purpose |
|---|---|
| `/api/crm/leads` | CRM lead ingestion |
| `/api/crm/leads/[id]` | Get/update individual lead |
| `/api/crm/leads/[id]/call-brief` | POST — generate or return cached AI call brief (AI summary + Serper phone intelligence) |
| `/api/crm/leads/website` | Website lead submission endpoint |
| `/api/crm/whatsapp/webhook` | WhatsApp Cloud API webhook |
| `/api/crm/whatsapp/send-template` | Send WhatsApp template |
| `/api/crm/whatsapp/send-text` | Send plain WhatsApp text |
| `/api/crm/whatsapp/inbox/send` | Send from inbox UI |
| `/api/crm/whatsapp/automation/run` | Trigger automation run |
| `/api/crm/whatsapp/automation/config` | Get/update automation config |
| `/api/crm/routing/assign` | Lead routing assignment |
| `/api/crm/routing/bulk-assign` | Bulk lead assignment |
| `/api/crm/routing/reconcile` | Reconcile unassigned leads |
| `/api/crm/pipeline/update-stage` | Move lead through pipeline |
| `/api/crm/push/new-lead` | Supabase DB webhook — sends WhatsApp alerts on new lead INSERT or assigned_to UPDATE; deduped via `crm_push_dedup`; skips bulk imports and silent sources |
| `/api/crm/push/register` | Register push notification token |
| `/api/crm/tasks/sla` | Task SLA summary and monitoring |
| `/api/crm/alerts/escalate` | Escalate overdue alerts |
| `/api/crm/campaigns` | Campaign management |
| `/api/crm/journeys/monitor` | Journey execution monitoring |
| `/api/crm/simulation` | Lead/routing simulation |
| `/api/crm/auth/me` | Current CRM user session |
| `/api/cron/journey-worker` | WhatsApp journey execution (every 2 min) |
| `/api/cron/link-checker` | Weekly URL health check (Mon 3am UTC) |
| `/api/sitemap/regenerate` | Daily sitemap rebuild (2am UTC) |
| `/api/admin/scraper/run` | Daily scraper run (6am UTC) |
| `/api/meta/webhook` | Meta Lead Ads webhook |
| `/api/analytics/behavior-events` | Behavior event tracking |
| `/api/search` | Site search |

---

## Key Business Logic

### Unit Size Conversion
- Area `>= 1000` → treat as **sqft** directly
- Area `< 1000` → treat as **sqm**, multiply by `10.764` to get sqft

### Project Status
- Use `proposed_completion_date` from `rera_projects` to derive status — **not** `current_status`
- Derive: if date is in future → "Under Construction", if past → "Ready to Move", etc.

### Unit Counts
- Always use `SUM(total_units)` — **never** `COUNT(*)`
- Exclude amenity rows and floor-plan rows from unit counts (filter by `unit_type`)

### Lead Capture (CRITICAL)
- **Only table**: `crm_leads` — never use or reference the `leads` table
- `source_id` is a **UUID FK** to `crm_lead_sources` — never pass a string, always pass a UUID or null
- Website `source_id` = `c3b72f38-171b-4ce6-a060-f40beed8bdb4`
- All web form submissions go through `src/app/actions/submit-lead.ts` (`submitLead()`)

### Lead Priority Values
`priority` column stores buyer intent level — three valid values:
| Value | Display | Meaning |
|---|---|---|
| `serious_buyer` | Serious Buyer | High intent, ready to transact |
| `evaluating` | Evaluating | Active consideration, not yet committed |
| `early_stage` | Early Stage | Research phase, low urgency |

`priority` is **not** the same as `lead_status`. `lead_status` is a separate column for additional qualification tracking (e.g. warm/cold state), while `priority` reflects buyer readiness. `status` is the pipeline stage (new/contacted/qualified/etc.).

### Cold Leads Detection
A lead is "cold" when: `last_activity_at < 7 days ago` AND `status NOT IN ('lost', 'won', 'converted')`.
Shown in the "Gone Cold" metric card on the dashboard, filterable via `?filter=cold_leads` in `/leads`.

### Call Brief Caching Logic
`crm_call_briefs` stores two independently cached components:
- **AI summary** (`ai_summary`): regenerated every **6 hours** — Claude Haiku generates a 1-2 sentence brief from structured lead data (meta form answers, budget, location, timeline, recent calls)
- **Phone intelligence** (`phone_intelligence` jsonb): cached **permanently** — Serper runs 3 parallel searches by phone number, parses results by priority domains, then Claude Haiku writes a 2-3 line `ai_profile`. Re-run only when `ai_profile` is null in the cached record (i.e. old records without the AI profile get refreshed)

### WhatsApp Alert Flow
`/api/crm/push/new-lead` is called via Supabase Database Webhook on `crm_leads` INSERT or `assigned_to` UPDATE.
- Makes a **direct Meta Graph API call** (`https://graph.facebook.com/v18.0/{phoneNumberId}/messages`) — no conversation record required
- Skips alerts for: `is_bulk_upload = true`, or `source_type` in `{bulk_import, csv_import, migration, simulation, test, seed}`
- Uses `crm_push_dedup` table (unique `dedup_key`) for serverless deduplication; stale entries (> 5 min) are purged before each check
- INSERT: alerts assigned agent + admin (or admin only if unassigned)
- UPDATE: alerts agent only when `assigned_to` transitions from null → a value

### IST Timestamp Conversion
Supabase returns timestamps without timezone suffix in some contexts. Pattern used throughout CRM:
```ts
// Append Z if no timezone indicator — treats bare timestamp as UTC
const normalized = ts.includes('Z') || ts.includes('+') ? ts : ts + 'Z';
// Manual IST offset (+5:30) instead of relying on browser locale
const ist = new Date(new Date(normalized).getTime() + 5.5 * 60 * 60 * 1000);
```
This avoids inconsistent browser timezone rendering and ensures IST display in all environments.

### Developer Brand Mapping
- Brands live in `developer_brands` table with `url_slug`
- Map via `developer_project_brand_map` view (joins through `developer_brand_entities`)
- **Never** show raw `organization_name` from `rera_promoters` — always use `brand_name`

### AI Enrichment Priority
- Jobs in `project_intelligence_queue` — process `priority=1` first, then `priority=2`
- AI-enriched data cached in `micro_market_page_cache_v2` and `project_live_intelligence`

### URL Construction
- **Always** use helpers from `src/lib/routes.ts` — never construct project URLs with template literals
  - `buildProjectUrl(citySlug, projectSlug)` — relative links
  - `buildProjectAbsoluteUrl(citySlug, projectSlug)` — canonical/metadata/schema/sitemap
  - `buildProjectsIndexUrl(citySlug)` — city projects index

---

## Key Files

### Data & Services
| File | Purpose |
|---|---|
| `src/services/projectService.ts` | Project data fetching — `getCityLevelProjectBySlug()` |
| `src/services/projectInsightsService.ts` | Derived signals (density, livability, stage risk, buyer segments) |
| `src/services/microMarketViewModel.ts` | Micro-market view model — single source of truth for UI data |
| `src/services/crmLeadRoutingService.ts` | Lead routing and assignment logic |
| `src/services/whatsappCloudService.ts` | WhatsApp Cloud API integration |
| `src/services/journeyExecutionService.ts` | WhatsApp journey execution engine |
| `src/services/taskSlaMonitoringService.ts` | Task SLA monitoring — overdue detection, agent responsiveness stats |
| `src/app/actions/submit-lead.ts` | **Master lead submission server action** |
| `src/lib/routes.ts` | URL builder helpers (MUST use for project URLs) |
| `src/lib/crm/types.ts` | CRM type definitions (`CrmRole`, `CrmLead`, `CrmTask`, etc.) |
| `src/lib/crm/leadAttribution.ts` | UTM/attribution extraction |
| `src/lib/crm/budget.ts` | Budget number normalization |
| `src/lib/crm/leadPriority.ts` | Priority label/badge helpers — maps `serious_buyer / evaluating / early_stage` |
| `src/lib/crm/sanitizeLeadPayload.ts` | Allowlist of valid `crm_leads` column names for safe updates |
| `src/lib/project-utils.ts` | Project utility helpers |

### Supabase Clients
| File | Use when |
|---|---|
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers (cookies) |
| `src/lib/supabase/serviceClient.ts` | Server-only, service role (bypasses RLS) |
| `src/lib/supabase/browserClient.ts` | Client Components |
| `src/lib/supabase/buildClient.ts` | `generateStaticParams` at build time |

### UI Components
| File | Purpose |
|---|---|
| `src/components/layout/Header.tsx` | Site header / navigation |
| `src/components/project-details/ProjectPageV2.tsx` | Project detail page (client component, all 10 sections) |
| `src/components/micro-market/` | Micro-market page section components |
| `src/components/homepage/HomepageContent.tsx` | Homepage client content |
| `src/components/institutional-investment-commercial/InstitutionalLeadForm.tsx` | Institutional investor lead form |
| `src/components/crm/leads/CallBriefPanel.tsx` | Bottom-sheet panel showing AI summary + Serper phone intelligence for a lead; opened from LeadDetailView quick actions bar |
| `src/components/crm/dashboard/DashboardMetricCards.tsx` | Dashboard snapshot cards — Total, New, Contacted, SiteVisit, Gone Cold; links to filtered `/leads` views |
| `src/components/crm/settings/RoutingTab.tsx` | Settings: lead routing rules |
| `src/components/crm/settings/AutomationsTab.tsx` | Settings: WhatsApp automation config |
| `src/components/crm/settings/PipelineTab.tsx` | Settings: pipeline stage management |
| `src/components/crm/settings/WhatsAppTab.tsx` | Settings: WhatsApp credentials and webhook status display |
| `src/components/crm/settings/TeamTab.tsx` | Settings: team member management |

### API Route Handlers (CRM)
| File | Purpose |
|---|---|
| `src/app/api/crm/leads/[id]/call-brief/route.ts` | Call brief generation — Claude Haiku summary + Serper phone intelligence, split caching |
| `src/app/api/crm/push/new-lead/route.ts` | DB webhook handler — WhatsApp alerts for new/assigned leads, dedup via `crm_push_dedup` |

### Pages
| File | Purpose |
|---|---|
| `src/app/[citySlug]/projects/[projectSlug]/page.tsx` | Canonical project detail page |
| `src/app/[citySlug]/[microMarketSlug]/page.tsx` | Micro-market intelligence page |
| `src/app/developers/[slug]/page.tsx` | Developer profile page |
| `src/app/developers/page.tsx` | Developer directory |
| `src/app/page.tsx` | Homepage |

### Infrastructure
| File | Purpose |
|---|---|
| `vercel.json` | Cron job definitions |
| `middleware.ts` | Auth guard for CRM dashboard routes |
| `next.config.ts` | Next.js config (`ignoreBuildErrors: true`) |
| `supabase/functions/ai-enrichment/index.ts` | Supabase Edge Function for AI enrichment |

---

## CRM Lead Fields Mapping

When mapping form fields to `crm_leads` columns:

| Form field | `crm_leads` column |
|---|---|
| `source_name` | `source_channel` |
| `page_url` | `landing_page` |
| `message` | `notes` |
| `lead_type` | `source_type` |
| `preferred_location` | `location_preference` |
| `institution` | → `notes` (as "Institution: X") or `attribution_metadata.institution` |
| `ticketSize` | → `notes` and `attribution_metadata.ticket_size_inr_crore` |
| `investorType` | `investor_type` |
| `budgetRange` / `budgetBand` | `budget` (text), `budget_min` / `budget_max` (numeric) |

**Never use**: `source_name`, `project_id`, `lead_type` as column names — these do not exist in `crm_leads`.

Use `src/lib/crm/sanitizeLeadPayload.ts` as the authoritative allowlist when building dynamic update payloads.

---

## Developer Brand Logic

Brands are in the `developer_brands` table.

Mapping chain:
```
rera_projects.id
  → developer_brand_entities.rera_project_id
    → developer_brand_entities.brand_id
      → developer_brands.id (has url_slug, brand_name, logo_url)
```

Use `developer_project_brand_map` view which wraps this join.
Use `v_developer_brand_profile` for aggregated brand stats.

**Never** show `rera_promoters.organization_name` directly — always resolve to `developer_brands.brand_name`.

---

## Scheduled Jobs (Vercel Crons)

| Schedule | Route | Purpose |
|---|---|---|
| Every 2 min | `/api/cron/journey-worker` | WhatsApp journey execution |
| Daily 2am UTC | `/api/sitemap/regenerate` | Sitemap rebuild |
| Daily 6am UTC | `/api/admin/scraper/run` | RERA data scraper |
| Mon 3am UTC (8:30am IST) | `/api/cron/link-checker` | Link health check |

All cron routes require `Authorization: Bearer {CRON_SECRET}` header.

---

## Environment Variables

### Supabase
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — bypasses RLS (server-only) |

### WhatsApp / Meta
| Variable | Purpose |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API phone number ID — used for sending messages |
| `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API access token — used in `Authorization: Bearer` header |
| `NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID` | Client-visible version for settings display in `WhatsAppTab` |

### AI / Search
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key — used by `@anthropic-ai/sdk` in call-brief route (Claude Haiku) |
| `SERPER_API_KEY` | Serper.dev API key — used for phone number intelligence searches in call-brief route |

### Infrastructure
| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Bearer token for authenticating cron jobs and DB webhook calls |
| `NEXT_PUBLIC_SITE_URL` | Full production URL (e.g. `https://www.westsiderealty.in`) — used in alert messages and link-checker |

---

## Analytics & Tracking

- **Vercel Analytics** — in root layout
- **Google Analytics** — `G-GYG41B6D00` in root layout
- **Facebook Pixel** — `1174059124805172` inline in root layout `<head>`
- **BehaviorTracker** — client component in `ClientProviders`, tracks events linked to CRM leads by phone
