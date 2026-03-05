# Westside Realty — Database Reference

Supabase (PostgreSQL). Service role bypasses RLS. Anon key respects RLS.

---

## Supabase Client Conventions

| File | Use when |
|---|---|
| `src/lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers |
| `src/lib/supabase/serviceClient.ts` | Server-only, needs to bypass RLS (data fetches, crons) |
| `src/lib/supabase/browserClient.ts` | Client Components |
| `src/lib/supabase/buildClient.ts` | `generateStaticParams` at build time |

---

## Core Tables

### `cities`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `city_name` | TEXT | e.g. "Hyderabad" |
| `url_slug` | TEXT | e.g. "hyderabad" |

Hyderabad row: look up with `.eq("url_slug", "hyderabad")`.

---

### `micro_markets`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `micro_market_name` | TEXT | Display name |
| `url_slug` | TEXT | Route slug |
| `city_id` | UUID FK → cities | |
| `status` | TEXT | "published" to be visible |
| `price_per_sqft_min` | NUMERIC | |
| `price_per_sqft_max` | NUMERIC | |
| `annual_appreciation_min` | NUMERIC | |
| `hero_hook` | TEXT | |
| `growth_story` | TEXT | |
| `connectivity_details` | TEXT | |

---

### `developers`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `developer_name` | TEXT | ⚠️ NOT `name` — always use `developer_name` |
| `url_slug` | TEXT | |
| `total_projects` | INTEGER | Used to compute `strong_developer` (>= 5) |
| `tagline` | TEXT | |
| `meta_description` | TEXT | |
| `hero_description` | TEXT | |
| `long_description_seo` | TEXT | |
| `years_in_business` | INTEGER | |
| `logo_url` | TEXT | |
| `notable_projects_json` | JSONB | |

**FK hint required:** Use `developers!developer_id(...)` in Supabase selects to target the correct FK from `projects`.

**Strong developer rule:** `total_projects >= 5` (matches `computeStrongDeveloper()` in `microMarketProjectsService.ts`).

---

### `projects`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `project_name` | TEXT | |
| `url_slug` | TEXT | Route slug |
| `city_id` | UUID FK → cities | Filter by this for city-scoped queries |
| `micro_market_id` | UUID FK → micro_markets | FK name: `projects_micromarket_id_fkey` |
| `developer_id` | UUID FK → developers | |
| `status` | TEXT | "published", "under construction", etc. |
| `page_status` | TEXT | "published" = visible (COALESCE default) |
| `completion_status` | TEXT | RERA completion description string |
| `price_range_text` | TEXT | Display string e.g. "₹1.2–2.8 Cr" |
| `hero_image_url` | TEXT | |
| `main_image_url` | TEXT | Fallback image |
| `gallery_images_json` | JSONB | |
| `total_units` | INTEGER | |
| `min_price` | NUMERIC | |
| `max_price` | NUMERIC | |
| `property_types` | JSONB | |
| `configurations` | JSONB | |
| `unit_size_range` | TEXT | |
| `display_order` | INTEGER | For ordered city page listing |
| `show_on_city_page` | BOOLEAN | Featured on city page — use `getProjectsByCity(id, true)` |
| `is_featured` | BOOLEAN | General featured flag |
| `enable_intelligence` | BOOLEAN | Enables AI intelligence tab |
| `faqs_json` | JSONB | |
| `amenities_json` | JSONB | |
| `floor_plan_images` | JSONB | Array of `{ url, label }` |
| `google_maps_embed_url` | TEXT | |
| `rera_link` | TEXT | |
| `possession_date_text` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

**Active project filter:** `.or('status.ilike.published,status.ilike.%under construction%')`

**Correct select with joins:**
```typescript
supabase
  .from("projects")
  .select(`
    id, project_name, url_slug, hero_image_url, main_image_url,
    price_range_text, status, display_order,
    developer:developers!developer_id(developer_name, url_slug, total_projects),
    micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug)
  `)
  .eq("city_id", cityId)
```

---

### `micro_market_page_cache_v2`
Pre-computed cache; primary source for market list pages.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Matches `micro_markets.id` |
| `city_id` | UUID FK → cities | |
| `micro_market_name` | TEXT | |
| `url_slug` | TEXT | |
| `capital_momentum_score` | NUMERIC | Sort descending for "top markets" |
| `annual_appreciation_min` | NUMERIC | |
| `annual_appreciation_max` | NUMERIC | |
| `price_per_sqft_min` | NUMERIC | |
| `price_per_sqft_max` | NUMERIC | |
| `recent_launches` | INTEGER | |
| `completion_ratio` | NUMERIC | 0–1 float — unreliable for established markets |
| `velocity_score` | NUMERIC | 0–100 |
| `developer_strength` | NUMERIC | Percentage |
| `new_developer_entries` | INTEGER | |
| `delay_ratio` | NUMERIC | 0–1 float |

---

### `micro_market_ai_enrichment`
AI-generated intelligence per micro-market. One row per market.

**v1 fields** (original):
| Column | Type |
|---|---|
| `micro_market_id` | UUID PK (FK → micro_markets) |
| `market_maturity` | TEXT — `Emerging\|Growing\|Established\|Peak` |
| `builder_activity` | TEXT — `Low\|Moderate\|High\|Saturated` |
| `buyer_profile` | TEXT — `End-use\|Investment\|Mixed` |
| `rental_yield_min` | NUMERIC |
| `rental_yield_max` | NUMERIC |
| `price_per_sqft_current` | NUMERIC |
| `market_summary` | TEXT |
| `top_developers` | JSONB (array of names) |
| `key_infrastructure_updates` | TEXT |
| `market_risks` | TEXT |
| `confidence` | TEXT — `high\|medium\|low` |
| `fetched_at` | TIMESTAMPTZ |

**v2 fields** (added 2026-03, all nullable):
| Column | Type | Notes |
|---|---|---|
| `zone_type` | TEXT | `Residential\|Commercial\|Mixed-Use\|Township` |
| `market_character` | TEXT | 2-sentence description |
| `price_band_current` | TEXT | e.g. "₹8,000–12,000/sqft (2026)" |
| `buyer_profile_detail` | TEXT | |
| `lifestyle_score` | TEXT | `Low\|Medium\|High\|Premium` |
| `possession_wait` | TEXT | e.g. "2-3 years" |
| `best_for` | TEXT | One-line buyer fit |
| `appreciation_5yr` | TEXT | Narrative with numbers |
| `rental_yield_detail` | TEXT | |
| `entry_timing` | TEXT | `Optimal\|Good\|Wait\|Late` |
| `entry_reasoning` | TEXT | |
| `employment_drivers` | JSONB | Array of strings |
| `infrastructure_pipeline` | JSONB | Array of strings |
| `social_infrastructure` | TEXT | |
| `risk_level` | TEXT | `Low\|Medium\|High` |
| `primary_risk` | TEXT | |
| `secondary_risks` | JSONB | Array of strings |
| `bull_case` | TEXT | |
| `bear_case` | TEXT | |
| `analyst_recommendation` | TEXT | |
| `commercial_rental_yield_min` | NUMERIC | Mixed-use markets only |
| `commercial_rental_yield_max` | NUMERIC | |
| `commercial_rental_yield_detail` | TEXT | |

**Freshness:** `fetched_at < 25 days` → skip re-enrichment (unless `force_refresh: true`).

---

### `market_pulse`
Global market sentiment, refreshed by cron.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `headline` | TEXT | |
| `sentiment` | TEXT | |
| `top_performing_markets` | JSONB or TEXT | Array of market names — may be stored as JSON string, handle both |
| `fetched_at` | TIMESTAMPTZ | Order DESC, limit 1 for latest |

---

### `leads`
Public lead submissions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | |
| `phone` | TEXT | |
| `email` | TEXT | |
| `source` | TEXT | Lead type enum |
| `status` | TEXT | default "new" |
| `stage` | TEXT | default "new" |
| `priority` | TEXT | default "medium" |
| `assigned_to` | TEXT | |
| `assigned_agent_id` | UUID FK → raw_agents | |
| `owner_id` | UUID | |
| `notes` | TEXT | |
| `next_follow_up` | TIMESTAMPTZ | |
| `interest_details` | TEXT | |
| `lead_source` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

Lead types: `PROJECT_INTEREST`, `SELLER_VALUATION`, `BUYER_REQUIREMENT`, `LANDOWNER_SHARE`, `GENERAL_CONTACT`, `GOA_PROPERTY`, `DEVELOPER_INQUIRY`.

---

### `crm_leads`
CRM mirror of `leads` with attribution data.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `lead_id` | UUID FK → leads | |
| `name` | TEXT | |
| `phone` | TEXT | |
| `email` | TEXT | |
| `source_type` | TEXT | |
| `source_name` | TEXT | |
| `utm_source` | TEXT | |
| `utm_medium` | TEXT | |
| `utm_campaign` | TEXT | |
| `utm_term` | TEXT | |
| `utm_content` | TEXT | |
| `gclid` | TEXT | |
| `fbclid` | TEXT | |
| `landing_page_url` | TEXT | |
| `campaign_id` | TEXT | |
| `campaign_name` | TEXT | |
| `micro_market` | TEXT | |
| `assigned_agent_id` | UUID | |
| `stage_id` | UUID | |
| `status` | TEXT | |
| `priority` | TEXT | |
| `assignment_status` | TEXT | |
| `last_activity_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

---

### `crm_meta_raw_leads`
Facebook Lead Ads webhook payloads.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `leadgen_id` | TEXT | Facebook lead gen ID (indexed) |
| `page_id` | TEXT | |
| `form_id` | TEXT | |
| `ad_id` | TEXT | |
| `adset_id` | TEXT | |
| `campaign_id` | TEXT | |
| `crm_lead_id` | UUID FK → crm_leads | |
| `payload` | JSONB | Raw webhook body |
| `graph_response` | JSONB | Graph API fetch response |
| `created_at` | TIMESTAMPTZ | |

### `crm_meta_lead_answers`
Custom field answers from Meta lead forms.

| Column | Type |
|---|---|
| `id` | UUID PK |
| `raw_lead_id` | UUID FK → crm_meta_raw_leads |
| `field_name` | TEXT |
| `field_value` | TEXT |
| `created_at` | TIMESTAMPTZ |

---

### `user_roles`
Maps Supabase auth users to CRM roles.

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID (unique) | FK → auth.users |
| `role` | TEXT | `admin\|sales_head\|team_lead\|agent\|marketing\|channel_partner\|analyst` |
| `phone` | TEXT (unique) | |
| `email` | TEXT (unique) | |

---

### `raw_agents`
Agent registry.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | |
| `email` | TEXT (unique) | |
| `phone` | TEXT (unique) | |
| `category` | ENUM `agent_category` | `The Commander\|The Strategist\|The Advisor\|The Partner\|The Corporate Executive\|The Mandate Director` |
| `is_active` | BOOLEAN | |
| `created_by` | UUID FK → auth.users | |
| `created_at` | TIMESTAMPTZ | |

Trigger: inserting into `raw_agents` auto-creates an `agents_profile` row.

### `agents_profile`
| Column | Type |
|---|---|
| `agent_id` | UUID PK (FK → raw_agents) |
| `name` | TEXT |
| `email` | TEXT |
| `phone` | TEXT |
| `bio` | TEXT |
| `photo` | TEXT |
| `specialization` | TEXT |
| `experience` | TEXT |
| `social_links` | JSONB |
| `profile_completed` | BOOLEAN |

---

### `landowner_share_projects`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `project_id` | UUID FK → projects | |
| `project_name` | TEXT | |
| `developer_name` | TEXT | |
| `micro_market` | TEXT | |
| `share_type` | TEXT | `landowner\|investor\|both` |
| `available_units` | INTEGER | |
| `price_range_text` | TEXT | |
| `discount_percentage` | DECIMAL | |
| `bhk_configurations` | TEXT[] | |
| `hero_image_url` | TEXT | |
| `is_active` | BOOLEAN | |
| `display_order` | INTEGER | |

### `landowner_page_content`
| Column | Type |
|---|---|
| `id` | UUID PK |
| `city_slug` | TEXT |
| `seo_title` | TEXT |
| `meta_description` | TEXT |
| `h1_title` | TEXT |
| `hero_description` | TEXT |
| `what_is_landowner_share` | TEXT |
| `what_is_investor_share` | TEXT |
| `why_buy_content` | TEXT |
| `benefits_json` | JSONB |
| `faqs_json` | JSONB |
| `schema_markup_json` | JSONB |

---

### `hero_banner_offers`
Homepage hero carousel (max 3 slides).

| Column | Type |
|---|---|
| `id` | UUID PK |
| `title` | TEXT |
| `offer_headline` | TEXT |
| `rera_number` | TEXT |
| `rera_link` | TEXT |
| `location_text` | TEXT |
| `location_highlight` | TEXT |
| `configurations` | JSONB — `[{ bhk, sqft, sqm, price, location }]` |
| `cta_text` | TEXT |
| `cta_link` | TEXT |
| `background_image_url` | TEXT |
| `display_order` | INTEGER |
| `is_active` | BOOLEAN |

---

### `ai_enrichment_job_log`
Tracks runs of the ai-enrichment Edge Function.

| Column | Type | Notes |
|---|---|---|
| `job_type` | TEXT | `micro_market\|project\|developer\|market_pulse` |
| `entity_id` | UUID | |
| `status` | TEXT | `success\|error\|skipped` |
| `message` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

## Views

### `v_micro_market_projects`
Base view. All published projects with city/market/developer joins.

Key computed columns:
- `city_slug` — from `cities.url_slug`
- `micro_market` — from `micro_markets.url_slug`
- `micro_market_name` — from `micro_markets.micro_market_name`
- `developer_name` — from `developers.developer_name`
- `completion_proximity` — integer 20–100, derived from `completion_status` string
- `developer_project_count` — `developers.total_projects`

Filter: `page_status = 'published'` AND `mm.status = 'published'`

### `v_micro_market_projects_v2` / `v3`
Extends base view with:
- `stage` — `early|under_construction|completion|delayed`
- `near_completion` — boolean (`completion_proximity >= 70` or ready/possession string)
- `strong_developer` — boolean (`developer_project_count >= 5`)
- v3 also adds `micro_market_slug` alias column

### `v_micro_market_project_summary_v2` / `v3`
Aggregate counts per `(city_slug, micro_market)`:
- `total`, `active`, `under_construction`, `early_stage`, `delayed`

### `v_micro_market_top_picks` / `v2` / `v3`
Aliases for `v_micro_market_projects_v3`. Use with `ORDER BY strong_developer DESC, near_completion DESC, completion_proximity DESC LIMIT 8`.

### `v_micro_market_project_summary`
Older summary with `completed` count instead of `early_stage` breakdown.

---

## Edge Function: `ai-enrichment`

**Invoke:** `POST /functions/v1/ai-enrichment`

```json
{
  "job_type": "micro_market",
  "entity_id": "<uuid>",
  "force_refresh": false,
  "offset": 0,
  "market_names": ["Gachibowli"]
}
```

**Freshness logic (micro_market job):**
- If `force_refresh: false` and existing row's `fetched_at < 25 days` → **skip**
- Otherwise → call Claude (`claude-sonnet-4-6`, 4096 tokens) → **full upsert** on `micro_market_id`

Model used: `claude-sonnet-4-6`

---

## Common Query Patterns

### Top markets for homepage ticker
```typescript
supabase
  .from("micro_market_page_cache_v2")
  .select("id,micro_market_name,url_slug,capital_momentum_score,price_per_sqft_min")
  .eq("city_id", cityId)
  .order("capital_momentum_score", { ascending: false, nullsFirst: false })
  .limit(16)
```

### AI enrichment for a set of market IDs
```typescript
supabase
  .from("micro_market_ai_enrichment")
  .select("micro_market_id,market_maturity,entry_timing,zone_type,price_per_sqft_current,best_for,primary_risk,appreciation_5yr")
  .in("micro_market_id", ids)
```

### Projects for a city (correct join syntax)
```typescript
supabase
  .from("projects")
  .select(`
    id, project_name, url_slug, hero_image_url, main_image_url,
    price_range_text, status,
    developers!developer_id(developer_name, url_slug, total_projects),
    micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug)
  `)
  .eq("city_id", cityId)
  .not("url_slug", "is", null)
  .order("created_at", { ascending: false })
  .limit(20)
```

### Featured projects for city page
```typescript
// show_on_city_page = true, ordered by display_order
supabase
  .from("projects")
  .select("...")
  .eq("city_id", cityId)
  .eq("show_on_city_page", true)
  .order("display_order", { ascending: true })
```

### Latest market pulse
```typescript
supabase
  .from("market_pulse")
  .select("headline,sentiment,top_performing_markets,fetched_at")
  .order("fetched_at", { ascending: false })
  .limit(1)
  .maybeSingle()
```

---

## Known Gotchas

1. **`developers.name` does not exist** — the column is `developer_name`. Using `developers(name,tier)` silently returns 0 rows from the entire query (PostgREST error). Always use `developers!developer_id(developer_name,...)`.

2. **`micro_markets` FK hint** — use `micro_markets!projects_micromarket_id_fkey(...)` when joining from `projects`, otherwise PostgREST may pick the wrong FK.

3. **`top_performing_markets` in `market_pulse`** — can be stored as a JSON string or a real array. Handle both:
   ```typescript
   const raw = row.top_performing_markets;
   if (Array.isArray(raw)) return raw[0];
   if (typeof raw === "string") return JSON.parse(raw)?.[0];
   ```

4. **`completion_ratio` in cache** — unreliable for Established/Peak markets (RERA only captures post-2017). Don't display raw as "X% complete".

5. **Supabase FK objects returned as arrays** — when using `select("...,developers(...)")`, Supabase may return the relation as an array even for many-to-one. Always handle:
   ```typescript
   const dev = Array.isArray(r.developers) ? r.developers[0] : r.developers;
   ```

6. **`strong_developer` threshold** — `total_projects >= 5`. Do not use a `tier` column (doesn't exist on `developers`).

7. **City lookup** — always look up Hyderabad city ID dynamically: `.from("cities").select("id").eq("url_slug","hyderabad").maybeSingle()`. Do not hardcode the UUID.

8. **`page_status` vs `status`** — `page_status` controls CMS visibility ("published"). `status` is the construction status string. Both exist on `projects`.
