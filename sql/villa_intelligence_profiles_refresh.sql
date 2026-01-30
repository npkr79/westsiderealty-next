-- WVIE: Villa Intelligence Profiles (materialized view)
-- Excludes apartment projects and computes villa intelligence signals.

DROP MATERIALIZED VIEW IF EXISTS villa_intelligence_profiles;

CREATE MATERIALIZED VIEW villa_intelligence_profiles AS
WITH base AS (
  SELECT
    rp.id AS rera_project_id,
    rp.project_name,
    rp.city_slug,
    rp.url_slug,
    psp.total_units AS total_villas,
    psp.physical_typology,
    land.total_land_area,
    land.net_land_area,
    COALESCE(land.total_builtup_area, psp.villa_residential_built_up_area) AS total_builtup_area,
    addr.mandal
  FROM rera_projects rp
  JOIN project_structural_profile psp
    ON psp.rera_project_id = rp.id
  LEFT JOIN rera_project_land_summary land
    ON land.rera_project_id = rp.id
  LEFT JOIN rera_project_addresses addr
    ON addr.rera_project_id = rp.id
  WHERE psp.physical_typology = 'villa_project'
),
metrics AS (
  SELECT
    b.*,
    CASE
      WHEN b.total_land_area IS NOT NULL AND b.total_land_area > 0
      THEN b.total_land_area / 4046.8564224
      ELSE NULL
    END AS total_land_acres,
    CASE
      WHEN b.total_land_area IS NOT NULL AND b.total_land_area > 0
        AND b.total_villas > 0
      THEN b.total_villas / (b.total_land_area / 4046.8564224)
      ELSE NULL
    END AS villas_per_acre,
    CASE
      WHEN b.total_land_area IS NOT NULL AND b.total_land_area > 0
        AND b.total_villas > 0
      THEN ((b.total_land_area / 4046.8564224) / b.total_villas) * 4840
      ELSE NULL
    END AS gross_land_per_villa_sqyd,
    CASE
      WHEN b.total_land_area IS NOT NULL AND b.total_land_area > 0
      THEN ((b.total_villas / (b.total_land_area / 4046.8564224) - 2) / (20 - 2)) * 100
      ELSE NULL
    END AS horizontal_intensity_index,
    CASE
      WHEN b.total_builtup_area IS NOT NULL AND b.total_land_area IS NOT NULL AND b.total_land_area > 0
      THEN b.total_builtup_area / b.total_land_area
      ELSE NULL
    END AS builtup_to_land_ratio
  FROM base b
),
classified AS (
  SELECT
    m.*,
    CASE
      WHEN m.villas_per_acre < 4 THEN 'Estate Density'
      WHEN m.villas_per_acre < 7 THEN 'Low Density'
      WHEN m.villas_per_acre < 11 THEN 'Medium Density'
      WHEN m.villas_per_acre < 15 THEN 'High Density'
      WHEN m.villas_per_acre >= 15 THEN 'Extreme Density'
      ELSE NULL
    END AS density_class,
    CASE
      WHEN m.gross_land_per_villa_sqyd > 800 THEN 'Ultra-abundant'
      WHEN m.gross_land_per_villa_sqyd >= 500 THEN 'Abundant'
      WHEN m.gross_land_per_villa_sqyd >= 300 THEN 'Balanced'
      WHEN m.gross_land_per_villa_sqyd >= 180 THEN 'Stressed'
      WHEN m.gross_land_per_villa_sqyd IS NOT NULL THEN 'Severely stressed'
      ELSE NULL
    END AS land_strength_class,
    CASE
      WHEN m.total_villas < 40 THEN 'Boutique Enclave'
      WHEN m.total_villas < 120 THEN 'Gated Community'
      WHEN m.total_villas < 300 THEN 'Villa Township'
      WHEN m.total_villas < 700 THEN 'Mega Township'
      ELSE 'Urban Villa City'
    END AS scale_class,
    CASE
      WHEN m.horizontal_intensity_index < 20 THEN 'Estate-spread'
      WHEN m.horizontal_intensity_index < 40 THEN 'Low compact'
      WHEN m.horizontal_intensity_index < 60 THEN 'Balanced'
      WHEN m.horizontal_intensity_index < 80 THEN 'Compact'
      WHEN m.horizontal_intensity_index IS NOT NULL THEN 'Hyper-compact'
      ELSE NULL
    END AS compactness_band
  FROM metrics m
),
signals AS (
  SELECT
    c.*,
    CASE
      WHEN c.scale_class = 'Villa Township' AND c.density_class = 'Medium Density' AND c.land_strength_class IN ('Abundant','Ultra-abundant')
      THEN 'Horizontal township ecosystem'
      WHEN c.scale_class = 'Mega Township' THEN 'Large-scale villa township'
      WHEN c.scale_class = 'Urban Villa City' THEN 'City-scale villa system'
      WHEN c.scale_class = 'Gated Community' THEN 'Gated villa community'
      ELSE 'Boutique villa enclave'
    END AS development_nature,
    CASE
      WHEN c.land_strength_class IN ('Ultra-abundant','Abundant') THEN 'Strong land-backed system'
      WHEN c.land_strength_class = 'Balanced' THEN 'Balanced land support'
      ELSE 'Land-constrained system'
    END AS land_posture,
    CASE
      WHEN c.density_class IN ('Estate Density','Low Density') THEN 'Spread-driven planning'
      WHEN c.density_class = 'Extreme Density' THEN 'Compact cluster planning'
      ELSE 'Balanced villa planning'
    END AS planning_style,
    CASE
      WHEN c.scale_class IN ('Mega Township','Urban Villa City') THEN 'End-use and investor mix'
      ELSE 'End-use dominant'
    END AS buyer_profile,
    CASE
      WHEN c.land_strength_class = 'Ultra-abundant' THEN 'Open community living'
      WHEN c.land_strength_class = 'Severely stressed' THEN 'Compact lifestyle living'
      ELSE 'Balanced community living'
    END AS living_psychology
  FROM classified c
),
risks AS (
  SELECT
    s.*,
    CASE
      WHEN s.density_class IN ('High Density','Extreme Density')
        AND s.land_strength_class IN ('Stressed','Severely stressed')
      THEN 'High'
      WHEN s.density_class = 'Medium Density' THEN 'Moderate'
      ELSE 'Low'
    END AS long_term_congestion_risk,
    CASE
      WHEN s.land_strength_class IN ('Ultra-abundant','Abundant') THEN 'Strong'
      WHEN s.land_strength_class = 'Balanced' THEN 'Moderate'
      ELSE 'Weak'
    END AS land_insulation_strength,
    CASE
      WHEN s.scale_class IN ('Mega Township','Urban Villa City') THEN 'High'
      WHEN s.scale_class = 'Villa Township' THEN 'Moderate'
      ELSE 'Low'
    END AS community_complexity,
    CASE
      WHEN s.scale_class IN ('Mega Township','Urban Villa City') THEN 'High'
      WHEN s.scale_class = 'Villa Township' THEN 'Moderate'
      ELSE 'Lower'
    END AS exit_liquidity_profile
  FROM signals s
),
planning AS (
  SELECT
    r.*,
    CASE
      WHEN r.gross_land_per_villa_sqyd IS NOT NULL
      THEN r.gross_land_per_villa_sqyd * 0.45
      ELSE NULL
    END AS estimated_net_plot_min,
    CASE
      WHEN r.gross_land_per_villa_sqyd IS NOT NULL
      THEN r.gross_land_per_villa_sqyd * 0.65
      ELSE NULL
    END AS estimated_net_plot_max,
    '35–55%'::text AS infrastructure_overhead_range
  FROM risks r
),
percentiles AS (
  SELECT
    p.*,
    percent_rank() OVER (PARTITION BY p.city_slug ORDER BY p.villas_per_acre) AS density_percentile_city,
    percent_rank() OVER (PARTITION BY p.city_slug ORDER BY p.gross_land_per_villa_sqyd) AS land_percentile_city,
    percent_rank() OVER (PARTITION BY p.city_slug ORDER BY p.total_villas) AS scale_percentile_city,
    percent_rank() OVER (PARTITION BY p.city_slug, COALESCE(p.mandal, 'unknown') ORDER BY p.villas_per_acre) AS density_percentile_mandal,
    percent_rank() OVER (PARTITION BY p.city_slug, COALESCE(p.mandal, 'unknown') ORDER BY p.gross_land_per_villa_sqyd) AS land_percentile_mandal,
    percent_rank() OVER (PARTITION BY p.city_slug, COALESCE(p.mandal, 'unknown') ORDER BY p.total_villas) AS scale_percentile_mandal
  FROM planning p
)
SELECT
  rera_project_id,
  project_name,
  city_slug,
  url_slug,
  physical_typology,
  total_villas,
  total_land_area,
  net_land_area,
  total_land_acres,
  villas_per_acre,
  gross_land_per_villa_sqyd,
  horizontal_intensity_index,
  density_class,
  land_strength_class,
  scale_class,
  compactness_band,
  development_nature,
  land_posture,
  planning_style,
  buyer_profile,
  living_psychology,
  long_term_congestion_risk,
  land_insulation_strength,
  community_complexity,
  exit_liquidity_profile,
  estimated_net_plot_min,
  estimated_net_plot_max,
  infrastructure_overhead_range,
  density_percentile_city,
  land_percentile_city,
  scale_percentile_city,
  density_percentile_mandal,
  land_percentile_mandal,
  scale_percentile_mandal,
  NOW() AS refreshed_at
FROM percentiles;

CREATE UNIQUE INDEX IF NOT EXISTS villa_intelligence_profiles_project_id_idx
  ON villa_intelligence_profiles (rera_project_id);

-- To refresh:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY villa_intelligence_profiles;
