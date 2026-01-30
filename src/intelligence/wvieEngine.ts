export interface WVIEInputs {
  reraProjectId: string;
  totalVillas: number;
  totalLandAcres: number | null;
  totalLandSqm: number | null;
  mandal?: string | null;
  zone?: string | null;
}

export interface WVIEMetrics {
  villas_per_acre: number | null;
  gross_land_per_villa_sqyd: number | null;
  horizontal_intensity_index: number | null;
}

export interface WVIEClasses {
  density_class: string | null;
  land_strength_class: string | null;
  scale_class: string | null;
  compactness_band: string | null;
}

export interface WVIESignals {
  development_nature: string | null;
  land_posture: string | null;
  planning_style: string | null;
  buyer_profile: string | null;
  living_psychology: string | null;
}

export interface WVIERisks {
  long_term_congestion_risk: string | null;
  land_insulation_strength: string | null;
  community_complexity: string | null;
  exit_liquidity_profile: string | null;
}

export interface WVIEPlanningReality {
  estimated_net_plot_min_sqyd: number | null;
  estimated_net_plot_max_sqyd: number | null;
  infrastructure_overhead_range: string;
}

export interface WVIEOutput {
  metrics: WVIEMetrics;
  classes: WVIEClasses;
  signals: WVIESignals;
  risks: WVIERisks;
  planning_reality: WVIEPlanningReality;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const computeWVIE = (input: WVIEInputs): WVIEOutput => {
  const vpa =
    input.totalLandAcres !== null && input.totalLandAcres > 0
      ? input.totalVillas / input.totalLandAcres
      : null;
  const glpvSqyd =
    input.totalLandAcres !== null && input.totalLandAcres > 0 && input.totalVillas > 0
      ? (input.totalLandAcres / input.totalVillas) * 4840
      : null;
  const hii =
    vpa !== null ? clamp(((vpa - 2) / (20 - 2)) * 100) : null;

  const densityClass =
    vpa === null
      ? null
      : vpa < 4
      ? "Estate Density"
      : vpa < 7
      ? "Low Density"
      : vpa < 11
      ? "Medium Density"
      : vpa < 15
      ? "High Density"
      : "Extreme Density";

  const landStrengthClass =
    glpvSqyd === null
      ? null
      : glpvSqyd > 800
      ? "Ultra-abundant"
      : glpvSqyd >= 500
      ? "Abundant"
      : glpvSqyd >= 300
      ? "Balanced"
      : glpvSqyd >= 180
      ? "Stressed"
      : "Severely stressed";

  const scaleClass =
    input.totalVillas < 40
      ? "Boutique Enclave"
      : input.totalVillas < 120
      ? "Gated Community"
      : input.totalVillas < 300
      ? "Villa Township"
      : input.totalVillas < 700
      ? "Mega Township"
      : "Urban Villa City";

  const compactnessBand =
    hii === null
      ? null
      : hii < 20
      ? "Estate-spread"
      : hii < 40
      ? "Low compact"
      : hii < 60
      ? "Balanced"
      : hii < 80
      ? "Compact"
      : "Hyper-compact";

  const signals: WVIESignals = {
    development_nature:
      scaleClass === "Villa Township" && densityClass === "Medium Density" && landStrengthClass === "Abundant"
        ? "Horizontal township ecosystem"
        : scaleClass === "Mega Township"
        ? "Large-scale villa township"
        : scaleClass === "Urban Villa City"
        ? "City-scale villa system"
        : scaleClass === "Gated Community"
        ? "Gated villa community"
        : "Boutique villa enclave",
    land_posture:
      landStrengthClass === "Ultra-abundant" || landStrengthClass === "Abundant"
        ? "Strong land-backed system"
        : landStrengthClass === "Balanced"
        ? "Balanced land support"
        : "Land-constrained system",
    planning_style:
      densityClass === "Low Density" || densityClass === "Estate Density"
        ? "Spread-driven planning"
        : densityClass === "Extreme Density"
        ? "Compact cluster planning"
        : "Balanced villa planning",
    buyer_profile:
      scaleClass === "Urban Villa City" || scaleClass === "Mega Township"
        ? "End-use and investor mix"
        : "End-use dominant",
    living_psychology:
      landStrengthClass === "Ultra-abundant"
        ? "Open community living"
        : landStrengthClass === "Severely stressed"
        ? "Compact lifestyle living"
        : "Balanced community living",
  };

  const risks: WVIERisks = {
    long_term_congestion_risk:
      (densityClass === "High Density" || densityClass === "Extreme Density") &&
      (landStrengthClass === "Stressed" || landStrengthClass === "Severely stressed")
        ? "High"
        : densityClass === "Medium Density"
        ? "Moderate"
        : "Low",
    land_insulation_strength:
      landStrengthClass === "Ultra-abundant" || landStrengthClass === "Abundant"
        ? "Strong"
        : landStrengthClass === "Balanced"
        ? "Moderate"
        : "Weak",
    community_complexity:
      scaleClass === "Mega Township" || scaleClass === "Urban Villa City"
        ? "High"
        : scaleClass === "Villa Township"
        ? "Moderate"
        : "Low",
    exit_liquidity_profile:
      scaleClass === "Mega Township" || scaleClass === "Urban Villa City"
        ? "High"
        : scaleClass === "Villa Township"
        ? "Moderate"
        : "Lower",
  };

  const planningReality: WVIEPlanningReality = {
    estimated_net_plot_min_sqyd: glpvSqyd !== null ? glpvSqyd * 0.45 : null,
    estimated_net_plot_max_sqyd: glpvSqyd !== null ? glpvSqyd * 0.65 : null,
    infrastructure_overhead_range: "35–55%",
  };

  return {
    metrics: {
      villas_per_acre: vpa,
      gross_land_per_villa_sqyd: glpvSqyd,
      horizontal_intensity_index: hii,
    },
    classes: {
      density_class: densityClass,
      land_strength_class: landStrengthClass,
      scale_class: scaleClass,
      compactness_band: compactnessBand,
    },
    signals,
    risks,
    planning_reality: planningReality,
  };
};
