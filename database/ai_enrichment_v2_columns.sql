-- Migration: Add v2 analyst intelligence columns to micro_market_ai_enrichment
-- Run once in Supabase SQL editor or via migration tool
-- Safe to run multiple times (IF NOT EXISTS guards on each column)

ALTER TABLE micro_market_ai_enrichment
  ADD COLUMN IF NOT EXISTS zone_type              TEXT,
  ADD COLUMN IF NOT EXISTS market_character       TEXT,
  ADD COLUMN IF NOT EXISTS price_band_current     TEXT,
  ADD COLUMN IF NOT EXISTS buyer_profile_detail   TEXT,
  ADD COLUMN IF NOT EXISTS lifestyle_score        TEXT,
  ADD COLUMN IF NOT EXISTS possession_wait        TEXT,
  ADD COLUMN IF NOT EXISTS best_for               TEXT,
  ADD COLUMN IF NOT EXISTS appreciation_5yr       TEXT,
  ADD COLUMN IF NOT EXISTS rental_yield_detail    TEXT,
  ADD COLUMN IF NOT EXISTS entry_timing           TEXT,
  ADD COLUMN IF NOT EXISTS entry_reasoning        TEXT,
  ADD COLUMN IF NOT EXISTS employment_drivers     JSONB,
  ADD COLUMN IF NOT EXISTS infrastructure_pipeline JSONB,
  ADD COLUMN IF NOT EXISTS social_infrastructure  TEXT,
  ADD COLUMN IF NOT EXISTS risk_level             TEXT,
  ADD COLUMN IF NOT EXISTS primary_risk           TEXT,
  ADD COLUMN IF NOT EXISTS secondary_risks        JSONB,
  ADD COLUMN IF NOT EXISTS bull_case              TEXT,
  ADD COLUMN IF NOT EXISTS bear_case              TEXT,
  ADD COLUMN IF NOT EXISTS analyst_recommendation TEXT;

-- Optional: add a comment documenting the enrichment version
COMMENT ON TABLE micro_market_ai_enrichment IS
  'AI-generated market intelligence per micro-market. '
  'v1 fields: market_maturity, builder_activity, buyer_profile, rental_yield_min/max, price_per_sqft_current, market_summary, top_developers, market_risks, confidence. '
  'v2 fields (added 2026-03): zone_type, market_character, price_band_current, buyer_profile_detail, lifestyle_score, possession_wait, best_for, appreciation_5yr, rental_yield_detail, entry_timing, entry_reasoning, employment_drivers, infrastructure_pipeline, social_infrastructure, risk_level, primary_risk, secondary_risks, bull_case, bear_case, analyst_recommendation.';
