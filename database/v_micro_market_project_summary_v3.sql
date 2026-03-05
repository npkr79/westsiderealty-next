-- v_micro_market_project_summary_v3: Institutional snapshot
-- Same schema as v2; v3 can be evolved independently.
-- Run: psql $DATABASE_URL -f database/v_micro_market_project_summary_v3.sql
-- Requires: v_micro_market_projects_v3

CREATE OR REPLACE VIEW v_micro_market_project_summary_v3 AS
SELECT
  city_slug,
  micro_market,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE stage IN ('under_construction', 'completion', 'early'))::int AS active,
  COUNT(*) FILTER (WHERE stage = 'under_construction')::int AS under_construction,
  COUNT(*) FILTER (WHERE stage = 'early')::int AS early_stage,
  COUNT(*) FILTER (WHERE stage = 'delayed')::int AS delayed
FROM v_micro_market_projects_v3
GROUP BY city_slug, micro_market;
