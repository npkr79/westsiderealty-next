-- Projects in Market views: Snapshot, Top Projects, Explorer
-- Run: psql $DATABASE_URL -f database/v_micro_market_projects_in_market.sql

-- 1. v_micro_market_project_summary: Total, Active, Completed by city_slug + micro_market
CREATE OR REPLACE VIEW v_micro_market_project_summary AS
SELECT
  city_slug,
  micro_market,
  COUNT(*)::int AS total,
  COUNT(*) FILTER (
    WHERE completion_status ILIKE '%under construction%'
      OR completion_status ILIKE '%launch%'
      OR completion_status ILIKE '%pre-launch%'
      OR (completion_status IS NULL AND status ILIKE '%construction%')
  )::int AS active,
  COUNT(*) FILTER (
    WHERE completion_status ILIKE '%ready%'
      OR completion_status ILIKE '%possession%'
      OR completion_status ILIKE '%completed%'
      OR status ILIKE '%ready%'
      OR status ILIKE '%possession%'
  )::int AS completed
FROM v_micro_market_projects
GROUP BY city_slug, micro_market;

-- 2. v_micro_market_top_projects: Top 8 by completion_proximity, developer presence (institutional picks)
-- Same columns as v_micro_market_projects; use in query with ORDER + LIMIT 8
-- (No separate view - query v_micro_market_projects with limit)

-- 3. v_micro_market_projects_explorer: Same as v_micro_market_projects
-- Use v_micro_market_projects directly with LIMIT 6 OFFSET for pagination
