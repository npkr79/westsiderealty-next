import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

type ScoreBand = "low" | "medium" | "high";
type StageBand = "early-stage" | "under-construction" | "ready";
type DensityBand = "low" | "balanced" | "high";
type PositioningBand = "mass" | "mid" | "premium";

interface BaselineProjectRow {
  id: string;
  updated_at?: string | null;
  total_units?: number | string | null;
  total_towers?: number | string | null;
  total_floors?: number | string | null;
  status?: string | null;
  completion_status?: string | null;
  possession_date_text?: string | null;
  bhk_config?: string | null;
  developer_id?: string | null;
  property_types?: unknown;
  price_range_text?: string | null;
}

interface DeveloperShare {
  developerId: string;
  projectCount: number;
  share: number;
}

interface NumericPercentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MicroMarketBaseline {
  microMarketId: string;
  cityId?: string;
  sampleSize: number;
  generatedAt: string;
  densityPercentiles: {
    totalUnits: NumericPercentiles;
    totalTowers: NumericPercentiles;
    totalFloors: NumericPercentiles;
    unitsPerTower: NumericPercentiles;
  };
  typicalProjectScale: {
    totalUnitsMedian: number;
    totalTowersMedian: number;
    totalFloorsMedian: number;
    unitsPerTowerMedian: number;
  };
  stageMix: {
    earlyStageShare: number;
    underConstructionShare: number;
    readyShare: number;
  };
  densityBuckets: {
    lowShare: number;
    balancedShare: number;
    highShare: number;
  };
  developerConcentration: {
    topDevelopers: DeveloperShare[];
    topDeveloperShare: number;
    hhi: number;
  };
  configurationMix: {
    dominantConfig: string;
    shares: Record<string, number>;
  };
  positioningMix: {
    dominantPositioning: PositioningBand;
    shares: Record<PositioningBand, number>;
  };
  pipelineRisk: {
    underConstructionToReadyRatio: number | null;
    underConstructionShare: number;
    readyShare: number;
  };
  corridorMaturityLevel: "emerging" | "transitioning" | "mature";
  confidence: {
    overall: ScoreBand;
    sampleSize: ScoreBand;
    dataCompleteness: ScoreBand;
    developerCoverage: ScoreBand;
    sampleSizeValue: number;
    dataCompletenessValue: number;
    developerCoverageValue: number;
  };
  extensibility: {
    supplyShockReady: true;
    absorptionModelReady: true;
  };
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

const toPercent = (value: number): number => Math.round(clamp(value) * 1000) / 1000;

const percentile = (values: number[], q: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * clamp(q);
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base];
  return sorted[base] + rest * (next - sorted[base]);
};

const toPercentiles = (values: number[]): NumericPercentiles => ({
  p10: Math.round(percentile(values, 0.1)),
  p25: Math.round(percentile(values, 0.25)),
  p50: Math.round(percentile(values, 0.5)),
  p75: Math.round(percentile(values, 0.75)),
  p90: Math.round(percentile(values, 0.9)),
});

const deriveStage = (row: BaselineProjectRow): StageBand => {
  const text = `${row.status || ""} ${row.completion_status || ""} ${row.possession_date_text || ""}`.toLowerCase();
  if (text.includes("ready") || text.includes("completed")) return "ready";
  if (text.includes("construction") || text.includes("under")) return "under-construction";
  return "early-stage";
};

const deriveDensityBand = (row: BaselineProjectRow): DensityBand => {
  const units = toNumber(row.total_units);
  if (units >= 800) return "high";
  if (units >= 300) return "balanced";
  return "low";
};

const derivePositioning = (row: BaselineProjectRow): PositioningBand => {
  const price = String(row.price_range_text || "").toLowerCase();
  const propertyTypesRaw = Array.isArray(row.property_types)
    ? row.property_types
    : typeof row.property_types === "string"
      ? [row.property_types]
      : [];
  const hasVilla = propertyTypesRaw.some((item) => String(item).toLowerCase().includes("villa"));
  const premiumSignal =
    price.includes("cr") || price.includes("crore") || price.includes("luxury") || price.includes("premium");
  if (premiumSignal) return "premium";
  if (hasVilla) return "mid";
  return "mass";
};

const parseConfigs = (bhkConfig: string | null | undefined): string[] => {
  if (!bhkConfig) return [];
  const text = bhkConfig.toLowerCase();
  const matches = Array.from(text.matchAll(/(\d+)\s*bhk/g)).map((match) => `${match[1]}BHK`);
  return Array.from(new Set(matches));
};

const toBand = (score: number): ScoreBand => {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
};

const selectClient = async () => {
  try {
    return createServiceClient();
  } catch {
    return createClient();
  }
};

const loadProjects = async (microMarketId: string, cityId?: string): Promise<BaselineProjectRow[]> => {
  const client = await selectClient();
  let query = client
    .from("projects")
    .select(
      "id,updated_at,total_units,total_towers,total_floors,status,completion_status,possession_date_text,bhk_config,developer_id,property_types,price_range_text"
    )
    .eq("micro_market_id", microMarketId);

  if (cityId) query = query.eq("city_id", cityId);

  const { data, error } = await query.limit(2000);
  if (error || !data) return [];
  return data as BaselineProjectRow[];
};

const buildBaseline = (rows: BaselineProjectRow[], microMarketId: string, cityId?: string): MicroMarketBaseline => {
  const sampleSize = rows.length;
  const units = rows.map((row) => toNumber(row.total_units)).filter((value) => value > 0);
  const towers = rows.map((row) => toNumber(row.total_towers)).filter((value) => value > 0);
  const floors = rows.map((row) => toNumber(row.total_floors)).filter((value) => value > 0);
  const unitsPerTower = rows
    .map((row) => {
      const u = toNumber(row.total_units);
      const t = toNumber(row.total_towers);
      if (u <= 0 || t <= 0) return 0;
      return u / t;
    })
    .filter((value) => value > 0);

  const stageCounts: Record<StageBand, number> = {
    "early-stage": 0,
    "under-construction": 0,
    ready: 0,
  };
  const densityCounts: Record<DensityBand, number> = { low: 0, balanced: 0, high: 0 };
  const positioningCounts: Record<PositioningBand, number> = { mass: 0, mid: 0, premium: 0 };
  const developerCounts = new Map<string, number>();
  const configCounts = new Map<string, number>();

  let developerPresentCount = 0;
  let completenessSignals = 0;
  let completenessTotal = sampleSize * 4;

  rows.forEach((row) => {
    const stage = deriveStage(row);
    stageCounts[stage] += 1;

    const densityBand = deriveDensityBand(row);
    densityCounts[densityBand] += 1;

    const positioning = derivePositioning(row);
    positioningCounts[positioning] += 1;

    const developerId = row.developer_id || "";
    if (developerId) {
      developerPresentCount += 1;
      developerCounts.set(developerId, (developerCounts.get(developerId) || 0) + 1);
    }

    parseConfigs(row.bhk_config).forEach((config) => {
      configCounts.set(config, (configCounts.get(config) || 0) + 1);
    });

    if (toNumber(row.total_units) > 0) completenessSignals += 1;
    if (toNumber(row.total_towers) > 0) completenessSignals += 1;
    if (toNumber(row.total_floors) > 0) completenessSignals += 1;
    if (String(row.bhk_config || "").trim()) completenessSignals += 1;
  });

  if (completenessTotal === 0) completenessTotal = 1;
  const dataCompletenessValue = completenessSignals / completenessTotal;
  const developerCoverageValue = sampleSize > 0 ? developerPresentCount / sampleSize : 0;
  const sampleSizeValue = clamp(sampleSize / 40);
  const overallConfidence = (sampleSizeValue * 0.45) + (dataCompletenessValue * 0.35) + (developerCoverageValue * 0.2);

  const topDevelopers = Array.from(developerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([developerId, projectCount]) => ({
      developerId,
      projectCount,
      share: sampleSize > 0 ? toPercent(projectCount / sampleSize) : 0,
    }));

  const topDeveloperShare = topDevelopers[0]?.share ?? 0;
  const hhi = Array.from(developerCounts.values()).reduce((sum, count) => {
    const share = sampleSize > 0 ? count / sampleSize : 0;
    return sum + share * share;
  }, 0);

  const configEntries = Array.from(configCounts.entries()).sort((a, b) => b[1] - a[1]);
  const configTotal = configEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const configShares = Object.fromEntries(configEntries.map(([config, count]) => [config, toPercent(count / configTotal)]));
  const dominantConfig = configEntries[0]?.[0] || "Mixed";

  const positioningTotal = sampleSize || 1;
  const positioningShares: Record<PositioningBand, number> = {
    mass: toPercent(positioningCounts.mass / positioningTotal),
    mid: toPercent(positioningCounts.mid / positioningTotal),
    premium: toPercent(positioningCounts.premium / positioningTotal),
  };
  const dominantPositioning = (Object.entries(positioningShares).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "mid") as PositioningBand;

  const readyShare = sampleSize > 0 ? stageCounts.ready / sampleSize : 0;
  const underConstructionShare = sampleSize > 0 ? stageCounts["under-construction"] / sampleSize : 0;
  const earlyShare = sampleSize > 0 ? stageCounts["early-stage"] / sampleSize : 0;
  const underConstructionToReadyRatio = readyShare > 0 ? Number((underConstructionShare / readyShare).toFixed(2)) : null;

  const corridorMaturityLevel: MicroMarketBaseline["corridorMaturityLevel"] =
    readyShare >= 0.45 && underConstructionShare <= 0.45
      ? "mature"
      : readyShare >= 0.2 && (underConstructionShare >= 0.3 || earlyShare >= 0.2)
        ? "transitioning"
        : "emerging";

  return {
    microMarketId,
    cityId,
    sampleSize,
    generatedAt: new Date().toISOString(),
    densityPercentiles: {
      totalUnits: toPercentiles(units),
      totalTowers: toPercentiles(towers),
      totalFloors: toPercentiles(floors),
      unitsPerTower: toPercentiles(unitsPerTower),
    },
    typicalProjectScale: {
      totalUnitsMedian: Math.round(percentile(units, 0.5)),
      totalTowersMedian: Math.round(percentile(towers, 0.5)),
      totalFloorsMedian: Math.round(percentile(floors, 0.5)),
      unitsPerTowerMedian: Math.round(percentile(unitsPerTower, 0.5)),
    },
    stageMix: {
      earlyStageShare: toPercent(earlyShare),
      underConstructionShare: toPercent(underConstructionShare),
      readyShare: toPercent(readyShare),
    },
    densityBuckets: {
      lowShare: sampleSize > 0 ? toPercent(densityCounts.low / sampleSize) : 0,
      balancedShare: sampleSize > 0 ? toPercent(densityCounts.balanced / sampleSize) : 0,
      highShare: sampleSize > 0 ? toPercent(densityCounts.high / sampleSize) : 0,
    },
    developerConcentration: {
      topDevelopers,
      topDeveloperShare,
      hhi: Number(hhi.toFixed(4)),
    },
    configurationMix: {
      dominantConfig,
      shares: configShares,
    },
    positioningMix: {
      dominantPositioning,
      shares: positioningShares,
    },
    pipelineRisk: {
      underConstructionToReadyRatio,
      underConstructionShare: toPercent(underConstructionShare),
      readyShare: toPercent(readyShare),
    },
    corridorMaturityLevel,
    confidence: {
      overall: toBand(overallConfidence),
      sampleSize: toBand(sampleSizeValue),
      dataCompleteness: toBand(dataCompletenessValue),
      developerCoverage: toBand(developerCoverageValue),
      sampleSizeValue: Number(sampleSizeValue.toFixed(3)),
      dataCompletenessValue: Number(dataCompletenessValue.toFixed(3)),
      developerCoverageValue: Number(developerCoverageValue.toFixed(3)),
    },
    extensibility: {
      supplyShockReady: true,
      absorptionModelReady: true,
    },
  };
};

const getCachedMicroMarketBaseline = unstable_cache(
  async (cacheVersion: string, microMarketId: string, cityId?: string) => {
    const rows = await loadProjects(microMarketId, cityId);
    return buildBaseline(rows, microMarketId, cityId);
  },
  ["micro-market-analytics-v1"],
  { revalidate: 1800 }
);

const buildCacheVersion = async (microMarketId: string, cityId?: string): Promise<string> => {
  const client = await selectClient();
  let query = client
    .from("projects")
    .select("updated_at", { count: "exact", head: false })
    .eq("micro_market_id", microMarketId)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (cityId) query = query.eq("city_id", cityId);
  const { data, count } = await query;
  const latest = Array.isArray(data) && data[0]?.updated_at ? String(data[0].updated_at) : "na";
  return `${count || 0}:${latest}`;
};

export const microMarketAnalyticsService = {
  async getMicroMarketBaseline(microMarketId: string, cityId?: string): Promise<MicroMarketBaseline | null> {
    if (!microMarketId) return null;
    const version = await buildCacheVersion(microMarketId, cityId);
    return getCachedMicroMarketBaseline(version, microMarketId, cityId);
  },
};

