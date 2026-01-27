import type { ProjectDNA } from "@/intelligence/projectDNA";

export interface WestsideDensityIndex {
  score: number;
  grade: "Low" | "Balanced" | "Dense" | "Heavy" | "Extreme";
  crowding_score: number;
  vertical_score: number;
  land_stress_score: number;
  tower_load_score: number;
  explanation: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalize = (value: number | null, maxValue: number): number | null => {
  if (value === null) return null;
  return clamp(Math.round((value / maxValue) * 100), 0, 100);
};

const landStressScore = (landPerUnitSqft: number | null): number | null => {
  if (landPerUnitSqft === null) return null;
  const normalized = 100 - (landPerUnitSqft / 1200) * 100;
  return clamp(Math.round(normalized), 0, 100);
};

const gradeForScore = (score: number): WestsideDensityIndex["grade"] => {
  if (score <= 25) return "Low";
  if (score <= 45) return "Balanced";
  if (score <= 65) return "Dense";
  if (score <= 80) return "Heavy";
  return "Extreme";
};

const explanationForGrade = (grade: WestsideDensityIndex["grade"]): string => {
  switch (grade) {
    case "Low":
      return "Low-density residential environment with ample open space and lighter infrastructure load.";
    case "Balanced":
      return "Balanced-density ecosystem with healthy spacing and manageable shared infrastructure demand.";
    case "Dense":
      return "Dense urban community with higher shared amenity usage and active vertical circulation.";
    case "Heavy":
      return "High-density high-rise ecosystem. Designed for large populations with strong vertical dependency and shared-infrastructure load.";
    default:
      return "Extreme-density vertical community with intense shared amenity demand and high crowding pressure.";
  }
};

export function computeWestsideDensityIndex(
  dna: ProjectDNA
): WestsideDensityIndex {
  const crowding = normalize(dna.density.units_per_acre, 130);
  const towerLoad = normalize(dna.density.units_per_tower, 300);
  const vertical = normalize(dna.vertical.avg_floors_per_tower, 40);
  const landStress = landStressScore(dna.land.land_per_unit_sqft);

  const weightedScores: Array<{ score: number; weight: number }> = [];
  if (crowding !== null) weightedScores.push({ score: crowding, weight: 35 });
  if (towerLoad !== null) weightedScores.push({ score: towerLoad, weight: 25 });
  if (vertical !== null) weightedScores.push({ score: vertical, weight: 20 });
  if (landStress !== null) weightedScores.push({ score: landStress, weight: 20 });

  const totalWeight = weightedScores.reduce((sum, item) => sum + item.weight, 0);
  const score =
    totalWeight > 0
      ? Math.round(
          weightedScores.reduce((sum, item) => sum + item.score * item.weight, 0) /
            totalWeight
        )
      : 0;

  const grade = gradeForScore(score);

  return {
    score,
    grade,
    crowding_score: crowding ?? 0,
    vertical_score: vertical ?? 0,
    land_stress_score: landStress ?? 0,
    tower_load_score: towerLoad ?? 0,
    explanation: explanationForGrade(grade),
  };
}
