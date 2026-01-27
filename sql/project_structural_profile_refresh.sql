-- Refresh project_structural_profile using normalized building typology
-- Residential metrics are computed ONLY from apartment_tower buildings.

WITH residential_agg AS (
  SELECT
    rp.id AS rera_project_id,
    COUNT(
      DISTINCT CASE
        WHEN rbn.derived_building_type = 'apartment_tower'
        THEN rbn.physical_building_id
      END
    ) AS apartment_tower_count,
    SUM(
      CASE
        WHEN rbn.derived_building_type = 'apartment_tower'
        THEN COALESCE(ru.total_units, 0)
        ELSE 0
      END
    ) AS total_units,
    MIN(
      CASE
        WHEN rbn.derived_building_type = 'apartment_tower'
        THEN rbn.derived_total_floors
      END
    ) AS min_floors,
    MAX(
      CASE
        WHEN rbn.derived_building_type = 'apartment_tower'
        THEN rbn.derived_total_floors
      END
    ) AS max_floors,
    AVG(
      CASE
        WHEN rbn.derived_building_type = 'apartment_tower'
        THEN rbn.derived_total_floors
      END
    ) AS avg_floors,
    COUNT(
      DISTINCT CASE
        WHEN rbn.derived_building_type = 'commercial_block'
        THEN rbn.physical_building_id
      END
    ) AS commercial_block_count,
    COUNT(
      DISTINCT CASE
        WHEN rbn.derived_building_type = 'unknown'
        THEN rbn.physical_building_id
      END
    ) AS unknown_block_count
  FROM rera_projects rp
  JOIN rera_buildings rb
    ON rb.rera_project_id = rp.id
  JOIN rera_buildings_normalized rbn
    ON rbn.physical_building_id = rb.physical_building_id
  LEFT JOIN rera_units ru
    ON ru.rera_building_id = rb.id
  GROUP BY rp.id
)
UPDATE project_structural_profile psp
SET
  total_units = ra.total_units,
  apartment_tower_count = ra.apartment_tower_count,
  residential_structures = ra.apartment_tower_count,
  min_floors = ra.min_floors,
  max_floors = ra.max_floors,
  avg_floors = ra.avg_floors,
  commercial_block_count = ra.commercial_block_count,
  unknown_block_count = ra.unknown_block_count,
  updated_at = NOW()
FROM residential_agg ra
WHERE psp.rera_project_id = ra.rera_project_id;
