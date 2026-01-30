import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";

export const mapVillaIntelligenceProfile = (
  profileRow: Record<string, unknown> | null
): VillaIntelligenceProfile | null => {
  if (!profileRow) return null;

  const totalVillas = Number(profileRow.total_villas ?? 0);
  const grossSqyd =
    profileRow.gross_land_per_villa_sqyd !== null &&
    profileRow.gross_land_per_villa_sqyd !== undefined
      ? Number(profileRow.gross_land_per_villa_sqyd)
      : null;
  const landPerVillaSqft = grossSqyd !== null ? grossSqyd * 9 : null;

  const scaleClass = (profileRow.scale_class as string | null) ?? null;
  const densityClass = (profileRow.density_class as string | null) ?? null;
  const landClass = (profileRow.land_strength_class as string | null) ?? null;

  const ecosystemType =
    (profileRow.development_nature as string | null) ?? "Horizontal villa system";
  const absorptionNature =
    scaleClass === "Urban Villa City" || scaleClass === "Mega Township"
      ? "Multi-phase absorption"
      : scaleClass === "Villa Township"
      ? "Phased absorption cycle"
      : "Single-cycle absorption";
  const amenityDependency =
    densityClass === "High Density" || densityClass === "Extreme Density"
      ? "High amenity dependency"
      : densityClass === "Medium Density"
      ? "Moderate amenity dependency"
      : "Low amenity dependency";
  const communityDepth =
    totalVillas >= 700
      ? "City-scale community depth"
      : totalVillas >= 300
      ? "Township community depth"
      : totalVillas >= 120
      ? "Community-scale depth"
      : "Intimate community depth";

  return {
    project: {
      id: String(profileRow.rera_project_id ?? ""),
      name: String(profileRow.project_name ?? "Villa Project"),
      city: (profileRow.city_slug as string | null) ?? null,
      mandal: (profileRow.mandal as string | null) ?? null,
    },
    core_metrics: {
      total_land_acres:
        profileRow.total_land_acres !== null && profileRow.total_land_acres !== undefined
          ? Number(profileRow.total_land_acres)
          : null,
      total_villas: Number(profileRow.total_villas ?? 0) || null,
      villas_per_acre:
        profileRow.villas_per_acre !== null && profileRow.villas_per_acre !== undefined
          ? Number(profileRow.villas_per_acre)
          : null,
      gross_land_per_villa_sqyd: grossSqyd,
      land_per_villa_sqft: landPerVillaSqft,
    },
    horizontal_intensity_index:
      profileRow.horizontal_intensity_index !== null &&
      profileRow.horizontal_intensity_index !== undefined
        ? Number(profileRow.horizontal_intensity_index)
        : null,
    density_class: densityClass,
    land_strength_class: landClass,
    scale_class: scaleClass,
    compactness_band: (profileRow.compactness_band as string | null) ?? null,
    project_dna: {
      development_nature: (profileRow.development_nature as string | null) ?? null,
      buyer_profile: (profileRow.buyer_profile as string | null) ?? null,
      community_structure: (profileRow.planning_style as string | null) ?? null,
      land_architecture: (profileRow.land_posture as string | null) ?? null,
      planning_posture: (profileRow.planning_style as string | null) ?? null,
      land_posture: (profileRow.land_posture as string | null) ?? null,
      lifestyle_signal: (profileRow.living_psychology as string | null) ?? null,
    },
    planning_model: {
      gross_land_per_villa_sqyd: grossSqyd,
      estimated_net_plot_min:
        profileRow.estimated_net_plot_min !== null &&
        profileRow.estimated_net_plot_min !== undefined
          ? Number(profileRow.estimated_net_plot_min)
          : null,
      estimated_net_plot_max:
        profileRow.estimated_net_plot_max !== null &&
        profileRow.estimated_net_plot_max !== undefined
          ? Number(profileRow.estimated_net_plot_max)
          : null,
      infrastructure_overhead_range:
        (profileRow.infrastructure_overhead_range as string | null) ?? null,
    },
    market_positioning: {
      density_percentile_city:
        profileRow.density_percentile_city !== null &&
        profileRow.density_percentile_city !== undefined
          ? Number(profileRow.density_percentile_city)
          : null,
      land_percentile_city:
        profileRow.land_percentile_city !== null &&
        profileRow.land_percentile_city !== undefined
          ? Number(profileRow.land_percentile_city)
          : null,
      scale_percentile_city:
        profileRow.scale_percentile_city !== null &&
        profileRow.scale_percentile_city !== undefined
          ? Number(profileRow.scale_percentile_city)
          : null,
      density_percentile_mandal:
        profileRow.density_percentile_mandal !== null &&
        profileRow.density_percentile_mandal !== undefined
          ? Number(profileRow.density_percentile_mandal)
          : null,
      land_percentile_mandal:
        profileRow.land_percentile_mandal !== null &&
        profileRow.land_percentile_mandal !== undefined
          ? Number(profileRow.land_percentile_mandal)
          : null,
      scale_percentile_mandal:
        profileRow.scale_percentile_mandal !== null &&
        profileRow.scale_percentile_mandal !== undefined
          ? Number(profileRow.scale_percentile_mandal)
          : null,
    },
    risk_signals: {
      long_term_congestion_risk:
        (profileRow.long_term_congestion_risk as string | null) ?? null,
      land_insulation_strength:
        (profileRow.land_insulation_strength as string | null) ?? null,
      exit_liquidity_profile:
        (profileRow.exit_liquidity_profile as string | null) ?? null,
      community_complexity:
        (profileRow.community_complexity as string | null) ?? null,
    },
    ecosystem: {
      scale_class: scaleClass,
      ecosystem_type: ecosystemType,
      absorption_nature: absorptionNature,
      amenity_dependency: amenityDependency,
      community_depth: communityDepth,
    },
  };
};
