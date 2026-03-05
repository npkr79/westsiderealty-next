-- v_micro_market_top_picks_v2: Top picks for institutional section
-- Same schema as v_micro_market_projects_v3; query with ORDER + LIMIT 8
-- Run: psql $DATABASE_URL -f database/v_micro_market_top_picks_v2.sql
-- Requires: v_micro_market_projects_v3

CREATE OR REPLACE VIEW v_micro_market_top_picks_v2 AS
SELECT * FROM v_micro_market_projects_v3;
