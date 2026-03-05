-- v_micro_market_projects_v2: Institutional-quality project listing
-- Adds stage classification, near_completion, strong_developer flags.
-- Run: psql $DATABASE_URL -f database/v_micro_market_projects_v2.sql

CREATE OR REPLACE VIEW v_micro_market_projects_v2 AS
SELECT
  base.*,
  -- Stage: early | under_construction | completion | delayed
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
  -- Near completion: 70%+ or ready/possession
  (base.completion_proximity >= 70
    OR base.completion_status ILIKE '%ready%' OR base.completion_status ILIKE '%possession%') AS near_completion,
  -- Strong developer: 5+ projects
  (COALESCE(base.developer_project_count, 0) >= 5) AS strong_developer
FROM v_micro_market_projects base;
