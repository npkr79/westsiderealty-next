-- v_micro_market_top_picks: Top picks for institutional section
-- Same schema as v_micro_market_projects_v3; query with ORDER + LIMIT 8
-- Run: psql $DATABASE_URL -f database/v_micro_market_top_picks.sql
-- Requires: v_micro_market_projects_v3 (fallback: v2 if v3 missing)

CREATE OR REPLACE VIEW v_micro_market_top_picks AS
SELECT * FROM v_micro_market_projects_v3;
