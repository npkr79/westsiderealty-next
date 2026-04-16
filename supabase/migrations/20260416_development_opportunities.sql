-- =============================================================================
-- Development Opportunities (B2B deal flow)
-- =============================================================================
-- Public-facing listings of redevelopment / land / joint-development opportunities
-- aimed at builders, investors, and family offices. Distinct from /portfolio
-- (consumer-facing) — never shows raw cost/profit numbers, only indicative ranges.
-- Detailed feasibility is gated behind NDA + lead capture.

CREATE TABLE IF NOT EXISTS development_opportunities (
  id                              BIGSERIAL PRIMARY KEY,
  slug                            TEXT NOT NULL UNIQUE,

  -- Public identity (note: exact owner / address stays internal)
  title                           TEXT NOT NULL,
  city                            TEXT NOT NULL,
  city_slug                       TEXT NOT NULL,
  micro_market                    TEXT,
  micro_market_slug               TEXT,

  -- Asset basics
  asset_type                      TEXT,            -- e.g. "MHADA Cessed Building Redevelopment"
  asset_subtype                   TEXT,            -- "residential" | "commercial" | "mixed_use"

  -- Sanitised numbers
  plot_area_sqm                   NUMERIC,
  plot_area_acres                 NUMERIC,
  saleable_potential_sqft         NUMERIC,

  -- Indicative financials (PUBLIC ranges only — never the full feasibility)
  indicative_project_cost_cr      NUMERIC,
  indicative_revenue_cr           NUMERIC,
  indicative_gross_margin_pct_min NUMERIC,
  indicative_gross_margin_pct_max NUMERIC,
  indicative_sale_rate_per_sqft   NUMERIC,
  indicative_timeline_months      INTEGER,

  -- Lifecycle
  stage                           TEXT,            -- "feasibility" | "approvals_in_progress" | "ready_to_launch"
  rera_status                     TEXT,            -- "not_registered" | "in_progress" | "registered"
  approvals_status                TEXT,

  -- Deal structure (open to one or more)
  deal_structures                 TEXT[],          -- {'Joint Development','Outright Acquisition','Development Management'}

  -- Marketing
  hero_image_url                  TEXT,
  headline                        TEXT,
  summary                         TEXT,
  highlights                      JSONB,           -- [{label, value}]
  why_attractive                  JSONB,           -- [{title, description}]
  risks_disclosed                 JSONB,           -- [{title, description}]

  -- Confidentiality flags
  is_published                    BOOLEAN NOT NULL DEFAULT false,
  nda_required_for_details        BOOLEAN NOT NULL DEFAULT true,
  owner_visibility                TEXT NOT NULL DEFAULT 'gated', -- 'gated' | 'public'

  -- Internal-only (never read in public components)
  internal_notes                  TEXT,
  internal_owner_name             TEXT,
  internal_full_address           TEXT,
  internal_feasibility_doc_url    TEXT,            -- redacted PDF stored privately

  -- Display ordering
  display_order                   INTEGER NOT NULL DEFAULT 0,

  -- Meta
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_opps_published_city
  ON development_opportunities(is_published, city_slug);
CREATE INDEX IF NOT EXISTS idx_dev_opps_slug
  ON development_opportunities(slug);

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Public can read only published rows. All write access goes via service role.

ALTER TABLE development_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published" ON development_opportunities;
CREATE POLICY "public_read_published"
  ON development_opportunities
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- =============================================================================
-- Hide internal columns from PostgREST exposure for non-service roles
-- =============================================================================
-- Anon/authenticated never see internal_* columns even if they hit the table.
-- Service role bypasses this via createServiceClient.

REVOKE ALL ON development_opportunities FROM anon, authenticated;
GRANT SELECT (
  id, slug, title, city, city_slug, micro_market, micro_market_slug,
  asset_type, asset_subtype,
  plot_area_sqm, plot_area_acres, saleable_potential_sqft,
  indicative_project_cost_cr, indicative_revenue_cr,
  indicative_gross_margin_pct_min, indicative_gross_margin_pct_max,
  indicative_sale_rate_per_sqft, indicative_timeline_months,
  stage, rera_status, approvals_status, deal_structures,
  hero_image_url, headline, summary, highlights, why_attractive, risks_disclosed,
  is_published, nda_required_for_details, owner_visibility,
  display_order, created_at, updated_at
) ON development_opportunities TO anon, authenticated;

-- =============================================================================
-- Seed: Mazgaon Redevelopment Opportunity
-- =============================================================================
-- Sanitised from the internal feasibility report dated 10-Mar-2026.
-- All cost/profit details remain in internal columns or off-record.

INSERT INTO development_opportunities (
  slug, title, city, city_slug, micro_market, micro_market_slug,
  asset_type, asset_subtype,
  plot_area_sqm, plot_area_acres, saleable_potential_sqft,
  indicative_project_cost_cr, indicative_revenue_cr,
  indicative_gross_margin_pct_min, indicative_gross_margin_pct_max,
  indicative_sale_rate_per_sqft, indicative_timeline_months,
  stage, rera_status, approvals_status, deal_structures,
  headline, summary,
  highlights, why_attractive, risks_disclosed,
  is_published, nda_required_for_details, owner_visibility,
  display_order
) VALUES (
  'mazgaon-mumbai-redevelopment',
  'Mazgaon Redevelopment Opportunity',
  'Mumbai', 'mumbai',
  'Mazgaon', 'mazgaon',
  'MHADA Cessed Building Redevelopment',
  'residential',
  7531.83, 1.86, 265484,
  550, 1360,
  50, 60,
  50000, 42,
  'feasibility', 'not_registered', 'Tentative feasibility complete; approvals to be initiated post DA signing',
  ARRAY['Joint Development', 'Outright Acquisition', 'Development Management'],
  'Prime South Mumbai redevelopment — ~2.65 lakh sq.ft. saleable potential, ~50–60% indicative gross margin.',
  'A consolidated MHADA cessed-building redevelopment opportunity in Mazgaon, South Mumbai. Tentative feasibility prepared by qualified consultants. Open to JD with reputed developers, outright acquisition, or development management arrangement. Detailed feasibility, title chain, and tenant data shared under NDA.',
  '[
    {"label":"Plot Size","value":"~1.86 acres (7,532 sq.m.)"},
    {"label":"Saleable Potential","value":"~2.65 lakh sq.ft. RERA carpet"},
    {"label":"Indicative Project Cost","value":"~₹550 Cr"},
    {"label":"Indicative Revenue","value":"~₹1,360 Cr"},
    {"label":"Indicative Gross Margin","value":"~50–60%"},
    {"label":"Indicative Timeline","value":"~36–42 months"},
    {"label":"Asset Type","value":"MHADA Cessed Redevelopment"},
    {"label":"Stage","value":"Feasibility complete"}
  ]'::jsonb,
  '[
    {"title":"South Mumbai Micro-Market","description":"Mazgaon is among the few South Mumbai pockets with redevelopment density and end-use demand. Strong absorption history at ₹45–55K/sq.ft. for new launches in surrounding pockets."},
    {"title":"Consolidated Plot","description":"Single ~7,532 sq.m. plot — no assemblage risk, no fragmentation across multiple owners."},
    {"title":"MHADA Framework Clarity","description":"Cessed building redevelopment under DCPR rules with defined incentive FSI (~3.0+ achievable) and well-understood premium structure."},
    {"title":"Multiple Deal Structures","description":"Owner is open to JD, outright purchase, or DM — flexibility to match developer''s capital strategy."}
  ]'::jsonb,
  '[
    {"title":"Pre-RERA Stage","description":"Project is at feasibility stage; RERA registration and IOD/CC to be obtained post developer onboarding. Standard for redevelopment deals."},
    {"title":"Tenant Rehab Obligation","description":"Existing tenants must be rehoused per MHADA norms with transit rent during construction. Numbers built into the feasibility."},
    {"title":"Premium Sensitivity","description":"BMC fungible, open-space deficiency, and contravening structure premiums constitute a meaningful share of project cost. Detailed breakup under NDA."},
    {"title":"Sale Rate Assumption","description":"Indicative margin assumes ₹50,000/sq.ft. realisation. Stress-tested down to ₹40,000/sq.ft. retains >40% gross margin per feasibility."}
  ]'::jsonb,
  true, true, 'gated',
  10
)
ON CONFLICT (slug) DO NOTHING;
