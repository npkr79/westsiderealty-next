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

const smartRound = (value: number): number => {
  const decimal = value - Math.floor(value);
  if (decimal >= 0.8) return Math.ceil(value);
  return Number(value.toFixed(1));
};

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
  const structural = (intelligence as any)?.structural_intelligence?.profile;
  console.log("[STRUCTURAL PROFILE]", structural);
  console.log("[DNA STRUCTURAL SOURCE]", structural);
  console.log("[DNA] Called for project:", intelligence?.intelligence_snapshot?.project?.name);
  console.log("[DNA] Structural input:", (intelligence as any)?.structural_intelligence);
  console.log("DNA STRUCTURAL INPUT \u2192", structural);

  console.log("[DNA] density_applicable:", (structural as any)?.density_applicable);
  console.log("[DNA] vertical_applicable:", (structural as any)?.vertical_applicable);
  if (!structural) {
    return {
      density: {
        units_per_acre: null,
        units_per_tower: null,
        avg_units_per_floor: null,
        density_class: null,
        density_score: null,
        explanation: "Residential density intelligence not applicable for this project type.",
      },
      vertical: {
        avg_floors_per_tower: null,
        vertical_intensity: null,
        vertical_class: null,
        explanation: "Vertical intelligence not applicable for this project type.",
      },
      land: {
        land_per_unit_sqft: null,
        builtup_to_land_ratio: null,
        land_class: null,
        explanation: "Land intelligence not applicable for this project type.",
      },
      scale: {
        total_units: null,
        total_towers: null,
        total_floors: null,
        scale_class: null,
        explanation: "Scale intelligence not applicable for this project type.",
      },
    };
  }

  const densityNotApplicable = structural.density_applicable === false;
  const totalUnits = toNumber((structural as any)?.total_units);
  const totalStructures = toNumber(
    (structural as any)?.residential_structures ??
      (structural as any)?.apartment_tower_count
  );
  const maxFloors = toNumber((structural as any)?.max_floors);
  const minFloors = toNumber((structural as any)?.min_floors);
  const avgFloors = toNumber((structural as any)?.avg_floors);
  const builtupSqft = toNumber(
    (structural as any)?.total_built_up_area_sqft ??
      (structural as any)?.total_builtup_area_sqft ??
      (structural as any)?.builtup_area_sqft
  );
  const builtupSqm = toNumber(
    (structural as any)?.total_builtup_area_sqm ??
      (structural as any)?.builtup_area_sqm ??
      (structural as any)?.builtup_area
  );
  const builtupSqftFinal =
    builtupSqft !== null ? builtupSqft : builtupSqm !== null ? sqmToSqft(builtupSqm) : null;
  const totalLandSqm = toNumber(
    (structural as any)?.total_land_area_sqm ??
      (structural as any)?.land_area_sqm ??
      (structural as any)?.total_land_area ??
      (structural as any)?.land_area
  );
  const totalLandSqft = toNumber(
    (structural as any)?.total_land_area_sqft ??
      (structural as any)?.land_area_sqft
  );

  const landAcres =
    totalLandSqm !== null
      ? sqmToAcres(totalLandSqm)
      : totalLandSqft !== null
      ? totalLandSqft / 43560
      : null;
  const landSqft =
    totalLandSqft !== null
      ? totalLandSqft
      : totalLandSqm !== null
      ? sqmToSqft(totalLandSqm)
      : landAcres !== null
      ? landAcres * 43560
      : null;

  const unitsPerAcre =
    totalUnits !== null && landAcres && landAcres > 0 && totalStructures && totalStructures > 0
      ? totalUnits / landAcres
      : null;
  const unitsPerStructureRaw =
    totalUnits !== null && totalStructures && totalStructures > 0
      ? totalUnits / totalStructures
      : null;
  const avgUnitsPerFloorRaw =
    totalUnits !== null &&
    avgFloors !== null &&
    avgFloors > 0 &&
    totalStructures !== null &&
    totalStructures > 0
      ? totalUnits / (avgFloors * totalStructures)
      : null;
  const unitsPerStructure =
    unitsPerStructureRaw !== null ? smartRound(unitsPerStructureRaw) : null;
  const avgUnitsPerFloor =
    avgUnitsPerFloorRaw !== null ? smartRound(avgUnitsPerFloorRaw) : null;
  const avgFloorsPerStructure = avgFloors ?? maxFloors;
  const verticalIntensity =
    avgFloors !== null && totalStructures !== null
      ? avgFloors * totalStructures
      : null;

  const landPerUnitSqft =
    landSqft !== null && totalUnits && totalUnits > 0
      ? landSqft / totalUnits
      : null;
  const builtupToLandRatio =
    builtupSqftFinal !== null && landSqft !== null && landSqft > 0
      ? builtupSqftFinal / landSqft
      : null;

  const densityClass = unitsPerAcre !== null ? classifyDensity(unitsPerAcre) : null;
  const densityScore =
    unitsPerAcre !== null
      ? Math.min(100, Math.round((unitsPerAcre / 130) * 100))
      : null;
  const verticalClass =
    avgFloorsPerStructure !== null ? classifyVertical(avgFloorsPerStructure) : null;
  const landClass = landPerUnitSqft !== null ? classifyLand(landPerUnitSqft) : null;
  const scaleClass = totalUnits !== null ? classifyScale(totalUnits) : null;

  const density: DensityDNA = densityNotApplicable
    ? {
        units_per_acre: null,
        units_per_tower: null,
        avg_units_per_floor: null,
        density_class: null,
        density_score: null,
        explanation: "Residential density intelligence not applicable for this project type.",
      }
    : {
        units_per_acre: unitsPerAcre,
        units_per_tower: unitsPerStructure,
        avg_units_per_floor: avgUnitsPerFloor,
        density_class: densityClass?.label ?? null,
        density_score: densityScore,
        explanation:
          unitsPerAcre !== null
            ? `~${formatNumber(unitsPerAcre)} homes per acre. Indicates a ${densityClass?.label}-density gated community with balanced crowd levels.`
            : "Insufficient data to classify density.",
      };

  const verticalNotApplicable = structural?.vertical_applicable === false;
  const vertical: VerticalDNA = verticalNotApplicable
    ? {
        avg_floors_per_tower: null,
        vertical_intensity: null,
        vertical_class: null,
        explanation: "Vertical intelligence not applicable for this project type.",
      }
    : {
        avg_floors_per_tower: avgFloorsPerStructure,
        vertical_intensity: verticalIntensity,
        vertical_class: verticalClass ?? null,
        explanation:
          avgFloorsPerStructure !== null
            ? `${Math.round(avgFloorsPerStructure)}-floor towers place this project in the ${verticalClass} category with strong lift dependency. Structural vertical mass reflects the number of stacked floors across all towers.`
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
    total_towers: totalStructures,
    total_floors: maxFloors ?? minFloors ?? null,
    scale_class: scaleClass ?? null,
    explanation:
      totalUnits !== null
        ? `With ${Math.round(totalUnits)}+ units, this is a ${scaleClass}-scale residential ecosystem.`
        : "Insufficient data to classify project scale.",
  };

  console.log("[LAND DNA INPUT]", {
    land_area: landSqft,
    built_up_area: builtupSqftFinal,
    built_up_to_land_ratio: builtupToLandRatio,
  });
  console.log("[DNA OUTPUT]", { density, vertical, land, scale: scaleResult });
  return {
    density,
    vertical,
    land,
    scale: scaleResult,
  };
}
