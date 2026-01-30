-- Refresh rera_buildings_normalized with expanded unit counts
-- Uses SUM(COALESCE(rera_units.total_units, 1)) instead of COUNT(*)
-- Excludes clubhouse/amenity rows

WITH building_units AS (
  SELECT
    ru.rera_project_id,
    ru.physical_building_id,
    SUM(COALESCE(ru.total_units, 1)) AS total_units,
    SUM(COALESCE(ru.builtup_area, 0)) AS total_residential_built_up_area,
    SUM(
      CASE
        WHEN lower(COALESCE(ru.unit_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%villament%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villament%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%independent%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%independent%'
        THEN COALESCE(ru.total_units, 1)
        ELSE 0
      END
    ) AS villa_unit_count,
    SUM(
      CASE
        WHEN lower(COALESCE(ru.unit_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%villament%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villament%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%independent%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%independent%'
        THEN COALESCE(ru.builtup_area, 0)
        ELSE 0
      END
    ) AS villa_residential_built_up_area,
    MAX(
      CASE
        WHEN lower(COALESCE(ru.unit_type, '')) LIKE '%row house%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%row house%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%rowhouse%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%rowhouse%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%row-house%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%row-house%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%townhouse%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%townhouse%'
        THEN 1
        ELSE 0
      END
    ) AS has_row_house,
    MAX(
      CASE
        WHEN lower(COALESCE(ru.unit_type, '')) LIKE '%villament%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villament%'
        THEN 1
        ELSE 0
      END
    ) AS has_villament,
    MAX(
      CASE
        WHEN lower(COALESCE(ru.unit_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.apartment_type, '')) LIKE '%villa%'
          OR lower(COALESCE(ru.unit_type, '')) LIKE '%independent%'
          OR lower(COALESCE(ru.raw_apartment_type, '')) LIKE '%independent%'
        THEN 1
        ELSE 0
      END
    ) AS has_villa
  FROM rera_units ru
  WHERE ru.physical_building_id IS NOT NULL
    AND COALESCE(ru.raw_apartment_type, '') NOT ILIKE '%club%'
    AND COALESCE(ru.apartment_type, '') NOT ILIKE '%club%'
  GROUP BY ru.rera_project_id, ru.physical_building_id
),
building_classification AS (
  SELECT
    bu.*,
    CASE
      WHEN bu.has_row_house = 1 THEN 'row_house'
      WHEN bu.has_villament = 1 THEN 'villa_block'
      WHEN bu.has_villa = 1 AND bu.total_units > 1 THEN 'villa_block'
      WHEN bu.has_villa = 1 THEN 'villa_unit'
      WHEN bu.total_units > 0 THEN 'apartment_tower'
      ELSE NULL
    END AS derived_building_type
  FROM building_units bu
),
building_merge AS (
  SELECT
    bc.*,
    COALESCE(rbn.derived_building_type, bc.derived_building_type) AS derived_building_type_final
  FROM building_classification bc
  LEFT JOIN rera_buildings_normalized rbn
    ON rbn.rera_project_id = bc.rera_project_id
   AND rbn.physical_building_id = bc.physical_building_id
)
INSERT INTO rera_buildings_normalized (
  rera_project_id,
  physical_building_id,
  total_units,
  total_residential_built_up_area,
  villa_unit_count,
  villa_residential_built_up_area,
  derived_building_type,
  updated_at
)
SELECT
  bm.rera_project_id,
  bm.physical_building_id,
  bm.total_units,
  bm.total_residential_built_up_area,
  bm.villa_unit_count,
  bm.villa_residential_built_up_area,
  bm.derived_building_type_final,
  NOW()
FROM building_merge bm
ON CONFLICT (rera_project_id, physical_building_id)
DO UPDATE SET
  total_units = EXCLUDED.total_units,
  total_residential_built_up_area = EXCLUDED.total_residential_built_up_area,
  villa_unit_count = EXCLUDED.villa_unit_count,
  villa_residential_built_up_area = EXCLUDED.villa_residential_built_up_area,
  derived_building_type = COALESCE(
    rera_buildings_normalized.derived_building_type,
    EXCLUDED.derived_building_type
  ),
  updated_at = NOW();

-- If your job computes avg_units_per_building or tower load metrics,
-- ensure they use SUM(COALESCE(rera_units.total_units, 1)) instead of COUNT(*).
