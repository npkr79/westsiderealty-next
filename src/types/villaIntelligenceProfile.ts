export interface VillaIntelligenceProfile {
  project: {
    id: string;
    name: string;
    city: string | null;
    mandal: string | null;
  };
  core_metrics: {
    total_land_acres: number | null;
    total_villas: number | null;
    villas_per_acre: number | null;
    gross_land_per_villa_sqyd: number | null;
    land_per_villa_sqft: number | null;
  };
  horizontal_intensity_index: number | null;
  density_class: string | null;
  land_strength_class: string | null;
  scale_class: string | null;
  compactness_band: string | null;
  project_dna: {
    development_nature: string | null;
    buyer_profile: string | null;
    community_structure: string | null;
    land_architecture: string | null;
    planning_posture: string | null;
    land_posture: string | null;
    lifestyle_signal: string | null;
  };
  planning_model: {
    gross_land_per_villa_sqyd: number | null;
    estimated_net_plot_min: number | null;
    estimated_net_plot_max: number | null;
    infrastructure_overhead_range: string | null;
  };
  market_positioning: {
    density_percentile_city: number | null;
    land_percentile_city: number | null;
    scale_percentile_city: number | null;
    density_percentile_mandal: number | null;
    land_percentile_mandal: number | null;
    scale_percentile_mandal: number | null;
  };
  risk_signals: {
    long_term_congestion_risk: string | null;
    land_insulation_strength: string | null;
    exit_liquidity_profile: string | null;
    community_complexity: string | null;
  };
  ecosystem: {
    scale_class: string | null;
    ecosystem_type: string | null;
    absorption_nature: string | null;
    amenity_dependency: string | null;
    community_depth: string | null;
  };
}
