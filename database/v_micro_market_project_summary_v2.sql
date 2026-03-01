-- v_micro_market_project_summary_v2: Institutional snapshot
-- Total, Active (in progress), Under construction, Early stage, Delayed
-- Run: psql $DATABASE_URL -f database/v_micro_market_project_summary_v2.sql

CREATE OR REPLACE VIEW v_micro_market_project_summary_v2 AS
SELECT
  city_slug,
  micro_market,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (
    WHERE stage IN ('under_construction', 'completion', 'early')
  )::int AS active,
  COUNT(*) FILTER (WHERE stage = 'under_construction')::int AS under_construction,
  COUNT(*) FILTER (WHERE stage = 'early')::int AS early_stage,
  COUNT(*) FILTER (WHERE stage = 'delayed')::int AS delayed
FROM v_micro_market_projects_v2
GROUP BY city_slug, micro_market;
