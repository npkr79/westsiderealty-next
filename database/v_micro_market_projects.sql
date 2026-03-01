-- v_micro_market_projects: RERA-driven project listing view
-- Single source of truth for project listings across micro-markets.
-- Filter by city_slug and micro_market (url_slug).
-- Ranking: completion_proximity, status, developer presence, project scale.
--
-- Run this migration before using the new project listing system:
--   psql $DATABASE_URL -f database/v_micro_market_projects.sql

CREATE OR REPLACE VIEW v_micro_market_projects AS
SELECT
  p.id,
  p.project_name,
  p.url_slug,
  p.price_range_text,
  p.status,
  p.completion_status,
  p.total_units,
  p.min_price,
  p.max_price,
  p.hero_image_url,
  p.main_image_url,
  p.gallery_images_json,
  p.property_types,
  p.configurations,
  p.unit_size_range,
  p.display_order,
  p.micro_market_id,
  p.developer_id,
  c.url_slug AS city_slug,
  mm.url_slug AS micro_market,
  mm.micro_market_name,
  d.developer_name,
  d.url_slug AS developer_url_slug,
  -- Completion proximity: higher = closer to delivery (for ranking)
  COALESCE(
    CASE
      WHEN p.completion_status ILIKE '%ready%' OR p.completion_status ILIKE '%possession%' THEN 100
      WHEN p.completion_status ILIKE '%90%' OR p.completion_status ILIKE '%95%' THEN 95
      WHEN p.completion_status ILIKE '%80%' OR p.completion_status ILIKE '%85%' THEN 85
      WHEN p.completion_status ILIKE '%70%' OR p.completion_status ILIKE '%75%' THEN 75
      WHEN p.completion_status ILIKE '%50%' OR p.completion_status ILIKE '%60%' THEN 60
      WHEN p.completion_status ILIKE '%under construction%' THEN 40
      WHEN p.completion_status ILIKE '%launch%' OR p.completion_status ILIKE '%pre-launch%' THEN 20
      ELSE 30
    END,
    30
  ) AS completion_proximity,
  -- Developer presence: total_projects as proxy (nullable)
  COALESCE((d.total_projects)::int, 0) AS developer_project_count
FROM projects p
JOIN cities c ON c.id = p.city_id
JOIN micro_markets mm ON mm.id = p.micro_market_id
LEFT JOIN developers d ON d.id = p.developer_id
WHERE COALESCE(p.page_status, 'published') = 'published'
  AND mm.status = 'published';
