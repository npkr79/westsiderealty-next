export interface VillaIntelligenceResult {
  totalVillas: number;
  landAcres: number | null;
  villasPerAcre: number | null;
  landPerVillaSqft: number | null;
  densityClass: string | null;
  scaleClass: string;
  landStressClass: string | null;
}

export const SQM_PER_ACRE = 4046.86;
export const SQFT_PER_SQM = 10.7639;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const classifyVillaDensity = (v: number | null): string | null => {
  if (v === null) return null;
  if (v < 4) return "estate";
  if (v < 8) return "low";
  if (v < 12) return "medium";
  if (v < 20) return "high";
  return "extreme";
};

export const classifyVillaScale = (n: number): string => {
  if (n < 50) return "boutique enclave";
  if (n < 150) return "gated villa community";
  if (n < 400) return "villa township";
  return "mega villa ecosystem";
};

export const classifyVillaLandStress = (sqft: number | null): string | null => {
  if (sqft === null) return null;
  if (sqft > 3000) return "abundant";
  if (sqft > 1500) return "balanced";
  if (sqft > 800) return "stressed";
  return "severely stressed";
};

export const computeVillaIntelligence = (
  profile: Record<string, unknown> | null,
  land: Record<string, unknown> | null
): VillaIntelligenceResult => {
  const totalVillas = toNumber((profile as any)?.total_units) ?? 0;
  const landSqm =
    toNumber((land as any)?.total_land_area) ??
    toNumber((land as any)?.net_land_area) ??
    null;
  const landAcres = landSqm ? landSqm / SQM_PER_ACRE : null;
  const landSqft = landSqm ? landSqm * SQFT_PER_SQM : null;
  const villasPerAcre =
    landAcres && landAcres > 0 ? totalVillas / landAcres : null;
  const landPerVillaSqft =
    landSqft && totalVillas > 0 ? landSqft / totalVillas : null;

  return {
    totalVillas,
    landAcres,
    villasPerAcre,
    landPerVillaSqft,
    densityClass: classifyVillaDensity(villasPerAcre),
    scaleClass: classifyVillaScale(totalVillas),
    landStressClass: classifyVillaLandStress(landPerVillaSqft),
  };
};
