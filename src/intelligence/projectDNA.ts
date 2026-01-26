import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

export interface DensityDNA {
  units_per_acre: number | null;
  units_per_tower: number | null;
  avg_units_per_floor: number | null;
  density_class: string | null;
  density_score: number | null;
  explanation: string;
}

export interface VerticalDNA {
  avg_floors_per_tower: number | null;
  vertical_intensity: number | null;
  vertical_class: string | null;
  explanation: string;
}

export interface LandDNA {
  land_per_unit_sqft: number | null;
  builtup_to_land_ratio: number | null;
  land_class: string | null;
  explanation: string;
}

export interface ScaleDNA {
  total_units: number | null;
  total_towers: number | null;
  total_floors: number | null;
  scale_class: string | null;
  explanation: string;
}

export interface ProjectDNA {
  density: DensityDNA;
  vertical: VerticalDNA;
  land: LandDNA;
  scale: ScaleDNA;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const sqmToAcres = (sqm: number): number => sqm / 4046.8564224;
const sqmToSqft = (sqm: number): number => sqm * 10.7639;

const formatNumber = (value: number | null, decimals: number = 2): string => {
  if (value === null) return "N/A";
  const rounded = Number(value.toFixed(decimals));
  return Number.isFinite(rounded) ? String(rounded) : "N/A";
};

// Westside Density Standards v1.0 (lifestyle categories, not quality scores)
const classifyDensity = (unitsPerAcre: number): { label: string; score: number } => {
  if (unitsPerAcre < 50) return { label: "ultra-low", score: 20 };
  if (unitsPerAcre < 75) return { label: "low", score: 40 };
  if (unitsPerAcre < 100) return { label: "medium", score: 60 };
  if (unitsPerAcre <= 130) return { label: "high", score: 80 };
  return { label: "extreme", score: 100 };
};

const classifyVertical = (avgFloorsPerTower: number): string => {
  if (avgFloorsPerTower <= 5) return "low-rise";
  if (avgFloorsPerTower <= 12) return "mid-rise";
  if (avgFloorsPerTower <= 25) return "high-rise";
  return "super high-rise";
};

const classifyLand = (landPerUnitSqft: number): string => {
  if (landPerUnitSqft > 1200) return "land-rich";
  if (landPerUnitSqft >= 700) return "balanced";
  return "asset-heavy";
};

const classifyScale = (totalUnits: number): string => {
  if (totalUnits < 150) return "boutique";
  if (totalUnits < 600) return "mid-scale";
  if (totalUnits <= 1500) return "large";
  return "mega";
};

export function computeProjectDNA(
  intelligence: ProjectIntelligenceResult
): ProjectDNA {
  const scale = intelligence.intelligence_snapshot?.land_and_project_scale;
  const projectDNA = intelligence.project_dna;
  const landSummary =
    intelligence.official_rera?.land_summary ?? projectDNA?.land_summary?.raw ?? null;

  const totalUnits = toNumber(scale?.total_units);
  const totalTowers = toNumber(scale?.total_towers);
  const totalFloors = toNumber(scale?.total_floors);
  const builtupSqft = toNumber(
    intelligence.intelligence_snapshot?.core?.builtup_area_sqft
  );
  const totalLandSqm = toNumber(
    (landSummary as any)?.total_land_area ?? (landSummary as any)?.total_land_area_sqm
  );

  const landAcres = totalLandSqm !== null ? sqmToAcres(totalLandSqm) : null;
  const landSqft = totalLandSqm !== null ? sqmToSqft(totalLandSqm) : null;

  const unitsPerAcre =
    totalUnits !== null && landAcres && landAcres > 0
      ? totalUnits / landAcres
      : null;
  const unitsPerTower =
    totalUnits !== null && totalTowers && totalTowers > 0
      ? totalUnits / totalTowers
      : null;
  const avgUnitsPerFloor =
    totalUnits !== null &&
    totalFloors !== null &&
    totalFloors > 0
      ? totalUnits / totalFloors
      : null;
  const avgFloorsPerTower = totalFloors;
  const verticalIntensity =
    totalFloors !== null && totalTowers !== null
      ? totalFloors * totalTowers
      : null;

  const landPerUnitSqft =
    landSqft !== null && totalUnits && totalUnits > 0
      ? landSqft / totalUnits
      : null;
  const builtupToLandRatio =
    builtupSqft !== null && landSqft !== null && landSqft > 0
      ? builtupSqft / landSqft
      : null;

  const densityClass = unitsPerAcre !== null ? classifyDensity(unitsPerAcre) : null;
  const densityScore =
    unitsPerAcre !== null
      ? Math.min(100, Math.round((unitsPerAcre / 130) * 100))
      : null;
  const verticalClass = avgFloorsPerTower !== null ? classifyVertical(avgFloorsPerTower) : null;
  const landClass = landPerUnitSqft !== null ? classifyLand(landPerUnitSqft) : null;
  const scaleClass = totalUnits !== null ? classifyScale(totalUnits) : null;

  const density: DensityDNA = {
    units_per_acre: unitsPerAcre,
    units_per_tower: unitsPerTower,
    avg_units_per_floor: avgUnitsPerFloor,
    density_class: densityClass?.label ?? null,
    density_score: densityScore,
    explanation:
      unitsPerAcre !== null
        ? `~${formatNumber(unitsPerAcre)} homes per acre. Indicates a ${densityClass?.label}-density gated community with balanced crowd levels.`
        : "Insufficient data to classify density.",
  };

  const vertical: VerticalDNA = {
    avg_floors_per_tower: avgFloorsPerTower,
    vertical_intensity: verticalIntensity,
    vertical_class: verticalClass ?? null,
    explanation:
      avgFloorsPerTower !== null
        ? `${Math.round(avgFloorsPerTower)}-floor towers place this project in the ${verticalClass} category with strong lift dependency. Structural vertical mass reflects the number of stacked floors across all towers.`
        : "Insufficient data to classify vertical intensity.",
  };

  const land: LandDNA = {
    land_per_unit_sqft: landPerUnitSqft,
    builtup_to_land_ratio: builtupToLandRatio,
    land_class: landClass ?? null,
    explanation:
      landPerUnitSqft !== null
        ? `Land backing of ~${formatNumber(landPerUnitSqft)} sq.ft per home suggests a ${landClass} land-to-construction profile.`
        : "Insufficient data to classify land efficiency.",
  };

  const scaleResult: ScaleDNA = {
    total_units: totalUnits,
    total_towers: totalTowers,
    total_floors: totalFloors,
    scale_class: scaleClass ?? null,
    explanation:
      totalUnits !== null
        ? `With ${Math.round(totalUnits)}+ units, this is a ${scaleClass}-scale residential ecosystem.`
        : "Insufficient data to classify project scale.",
  };

  return {
    density,
    vertical,
    land,
    scale: scaleResult,
  };
}
