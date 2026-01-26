import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

export interface WestsideLivabilityIndex {
  index: number;
  band: string;
  band_meaning: string;
  crowd_score: number;
  tower_score: number;
  vertical_score: number;
  land_stress_score: number;
  metrics: {
    total_units: number | null;
    total_towers: number | null;
    total_floors: number | null;
    total_land_area_sqm: number | null;
    builtup_area_sqft: number | null;
    units_per_acre: number | null;
    units_per_tower: number | null;
    floors_per_tower: number | null;
    land_per_unit_sqft: number | null;
  };
  explanations: {
    crowding: string;
    tower_load: string;
    vertical: string;
    land_stress: string;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

const roundScore = (value: number | null): number =>
  value === null ? 0 : Math.round(value);

const bandForIndex = (index: number): { label: string; meaning: string } => {
  if (index <= 20) {
    return {
      label: "Estate Living",
      meaning: "Low crowding, wide-open spaces, and estate-style residential comfort.",
    };
  }
  if (index <= 40) {
    return {
      label: "Low Density Community",
      meaning: "Calm community density with moderate shared-infrastructure demand.",
    };
  }
  if (index <= 60) {
    return {
      label: "Balanced Society",
      meaning: "Balanced density with healthy spacing and manageable vertical load.",
    };
  }
  if (index <= 80) {
    return {
      label: "Urban High-Density",
      meaning: "High-density urban living with elevated shared amenity usage.",
    };
  }
  return {
    label: "Vertical Ecosystem",
    meaning: "Extreme vertical living with intense shared-infrastructure reliance.",
  };
};

export function computeWestsideLivabilityIndex(
  intelligence: ProjectIntelligenceResult
): WestsideLivabilityIndex {
  const scale = intelligence.intelligence_snapshot?.land_and_project_scale;
  const core = intelligence.intelligence_snapshot?.core;

  const totalUnits = toNumber(scale?.total_units);
  const totalTowers = toNumber(scale?.total_towers);
  const totalFloors = toNumber(scale?.total_floors);
  const totalLandSqm = toNumber(
    core?.land_area_sqm ??
      intelligence.official_rera?.land_summary?.total_land_area ??
      intelligence.project_dna?.land_summary?.raw?.total_land_area
  );
  const builtupAreaSqft = toNumber(core?.builtup_area_sqft);

  const landAcres = totalLandSqm !== null ? sqmToAcres(totalLandSqm) : null;

  const unitsPerAcre =
    totalUnits !== null && landAcres && landAcres > 0
      ? totalUnits / landAcres
      : null;
  const unitsPerTower =
    totalUnits !== null && totalTowers && totalTowers > 0
      ? totalUnits / totalTowers
      : null;
  const floorsPerTower =
    totalFloors !== null && totalTowers && totalTowers > 0
      ? totalFloors / totalTowers
      : null;
  const landPerUnitSqft =
    totalLandSqm !== null && totalUnits && totalUnits > 0
      ? (totalLandSqm * 10.7639) / totalUnits
      : null;

  const crowdScore =
    unitsPerAcre !== null
      ? clamp((unitsPerAcre / 130) * 100, 0, 100)
      : null;
  const towerScore =
    unitsPerTower !== null
      ? clamp((unitsPerTower / 400) * 100, 0, 100)
      : null;
  const verticalScore =
    floorsPerTower !== null
      ? clamp((floorsPerTower / 35) * 100, 0, 100)
      : null;
  const landStress =
    landPerUnitSqft !== null
      ? clamp(100 - (landPerUnitSqft / 1200) * 100, 0, 100)
      : null;

  const finalIndex =
    0.3 * (crowdScore ?? 0) +
    0.3 * (towerScore ?? 0) +
    0.2 * (verticalScore ?? 0) +
    0.2 * (landStress ?? 0);

  const index = Math.round(finalIndex);
  const band = bandForIndex(index);

  return {
    index,
    band: band.label,
    band_meaning: band.meaning,
    crowd_score: roundScore(crowdScore),
    tower_score: roundScore(towerScore),
    vertical_score: roundScore(verticalScore),
    land_stress_score: roundScore(landStress),
    metrics: {
      total_units: totalUnits,
      total_towers: totalTowers,
      total_floors: totalFloors,
      total_land_area_sqm: totalLandSqm,
      builtup_area_sqft: builtupAreaSqft,
      units_per_acre: unitsPerAcre,
      units_per_tower: unitsPerTower,
      floors_per_tower: floorsPerTower,
      land_per_unit_sqft: landPerUnitSqft,
    },
    explanations: {
      crowding:
        unitsPerAcre !== null
          ? `~${Math.round(unitsPerAcre)} homes per acre influences crowding pressure.`
          : "Crowding score unavailable due to missing land or unit data.",
      tower_load:
        unitsPerTower !== null
          ? `~${Math.round(unitsPerTower)} homes per tower indicates shared load distribution.`
          : "Tower load score unavailable due to missing tower or unit data.",
      vertical:
        floorsPerTower !== null
          ? `~${floorsPerTower.toFixed(1)} floors per tower shapes vertical circulation load.`
          : "Vertical stress score unavailable due to missing tower or floor data.",
      land_stress:
        landPerUnitSqft !== null
          ? `~${Math.round(landPerUnitSqft)} sq.ft land per home reflects land stress.`
          : "Land stress score unavailable due to missing land or unit data.",
    },
  };
}
