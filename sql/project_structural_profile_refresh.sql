-- Refresh project_structural_profile unit aggregates
-- Replace COUNT(*)/COUNT(id) with SUM(COALESCE(rbn.total_units, 0))

WITH project_unit_totals AS (
  SELECT
    rbn.rera_project_id,
    SUM(COALESCE(rbn.total_units, 0)) AS total_units,
    COUNT(DISTINCT rbn.physical_building_id) AS residential_structures
  FROM rera_buildings_normalized rbn
  GROUP BY rbn.rera_project_id
)
UPDATE project_structural_profile psp
SET
  total_units = put.total_units,
  residential_structures = put.residential_structures,
  updated_at = NOW()
FROM project_unit_totals put
WHERE psp.rera_project_id = put.rera_project_id;

-- If density_applicable or derived ratios use unit counts,
-- ensure they reference psp.total_units (SUM-based) instead of COUNT(*).
