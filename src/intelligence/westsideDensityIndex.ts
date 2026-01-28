import type { ProjectDNA } from "@/intelligence/projectDNA";

export interface WestsideDensityIndex {
  score: number;
  grade: "Light" | "Balanced" | "Moderately Stressed" | "High Stress" | "Extreme Stress";
  crowding_score: number | null;
  vertical_score: number | null;
  land_stress_score: number | null;
  tower_load_score: number | null;
  explanation: string;
  meaning: string;
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
  if (score <= 20) return "Light";
  if (score <= 40) return "Balanced";
  if (score <= 60) return "Moderately Stressed";
  if (score <= 80) return "High Stress";
  return "Extreme Stress";
};

const explanationForGrade = (grade: WestsideDensityIndex["grade"]): string => {
  switch (grade) {
    case "Light":
      return "Light, underutilized residential load with open system capacity.";
    case "Balanced":
      return "Balanced density with steady shared-system demand.";
    case "Moderately Stressed":
      return "Moderately stressed density with noticeable shared infrastructure load.";
    case "High Stress":
      return "High stress density with strong vertical and shared-system dependence.";
    default:
      return "Extreme stress density with heavy, system-driven daily life.";
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
    crowding_score: crowding !== null ? Math.round(crowding) : null,
    vertical_score: vertical !== null ? Math.round(vertical) : null,
    land_stress_score: landStress !== null ? Math.round(landStress) : null,
    tower_load_score: towerLoad !== null ? Math.round(towerLoad) : null,
    explanation: explanationForGrade(grade),
    meaning: "Higher scores indicate heavier, denser residential systems.",
  };
}
