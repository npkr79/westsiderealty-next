-- Institutional-quality Projects in Market v2
-- Run: psql $DATABASE_URL -f database/v_micro_market_projects_v2_migration.sql
-- Requires: v_micro_market_projects (from v_micro_market_projects.sql)

-- 1. v_micro_market_projects_v2
CREATE OR REPLACE VIEW v_micro_market_projects_v2 AS
SELECT
  base.*,
  CASE
    WHEN base.completion_status ILIKE '%delay%' OR base.status ILIKE '%delay%' THEN 'delayed'
    WHEN base.completion_status ILIKE '%ready%' OR base.completion_status ILIKE '%possession%'
      OR base.completion_status ILIKE '%90%' OR base.completion_status ILIKE '%95%'
      OR base.completion_status ILIKE '%80%' OR base.completion_status ILIKE '%85%'
      OR base.completion_status ILIKE '%70%' OR base.completion_status ILIKE '%75%' THEN 'completion'
    WHEN base.completion_status ILIKE '%under construction%'
      OR (base.completion_status IS NULL AND base.status ILIKE '%construction%') THEN 'under_construction'
    WHEN base.completion_status ILIKE '%launch%' OR base.completion_status ILIKE '%pre-launch%'
      OR base.completion_status ILIKE '%50%' OR base.completion_status ILIKE '%60%' THEN 'early'
    ELSE 'early'
  END AS stage,
  (base.completion_proximity >= 70
    OR base.completion_status ILIKE '%ready%' OR base.completion_status ILIKE '%possession%') AS near_completion,
  (COALESCE(base.developer_project_count, 0) >= 5) AS strong_developer
FROM v_micro_market_projects base;

-- 2. v_micro_market_project_summary_v2
CREATE OR REPLACE VIEW v_micro_market_project_summary_v2 AS
SELECT
  city_slug,
  micro_market,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE stage IN ('under_construction', 'completion', 'early'))::int AS active,
  COUNT(*) FILTER (WHERE stage = 'under_construction')::int AS under_construction,
  COUNT(*) FILTER (WHERE stage = 'early')::int AS early_stage,
  COUNT(*) FILTER (WHERE stage = 'delayed')::int AS delayed
FROM v_micro_market_projects_v2
GROUP BY city_slug, micro_market;
