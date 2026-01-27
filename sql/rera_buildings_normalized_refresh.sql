-- Refresh rera_buildings_normalized with expanded unit counts
-- Uses SUM(COALESCE(rera_units.total_units, 1)) instead of COUNT(*)
-- Excludes clubhouse/amenity rows

WITH building_units AS (
  SELECT
    ru.rera_project_id,
    ru.physical_building_id,
    SUM(COALESCE(ru.total_units, 1)) AS total_units
  FROM rera_units ru
  WHERE ru.physical_building_id IS NOT NULL
    AND COALESCE(ru.raw_apartment_type, '') NOT ILIKE '%club%'
    AND COALESCE(ru.apartment_type, '') NOT ILIKE '%club%'
  GROUP BY ru.rera_project_id, ru.physical_building_id
)
INSERT INTO rera_buildings_normalized (
  rera_project_id,
  physical_building_id,
  total_units,
  updated_at
)
SELECT
  bu.rera_project_id,
  bu.physical_building_id,
  bu.total_units,
  NOW()
FROM building_units bu
ON CONFLICT (rera_project_id, physical_building_id)
DO UPDATE SET
  total_units = EXCLUDED.total_units,
  updated_at = NOW();

-- If your job computes avg_units_per_building or tower load metrics,
-- ensure they use SUM(COALESCE(rera_units.total_units, 1)) instead of COUNT(*).
