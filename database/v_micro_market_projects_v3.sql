-- v_micro_market_projects_v3: Institutional-quality project listing
-- Same schema as v2; v3 can be evolved independently.
-- Run: psql $DATABASE_URL -f database/v_micro_market_projects_v3.sql
-- Requires: v_micro_market_projects

CREATE OR REPLACE VIEW v_micro_market_projects_v3 AS
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
