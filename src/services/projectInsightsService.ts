import { unstable_cache } from "next/cache";
import type { ProjectWithRelations } from "@/services/projectService";
import { microMarketAnalyticsService, type MicroMarketBaseline } from "@/services/microMarketAnalyticsService";

type ScoreBand = "low" | "medium" | "high";
type CategoryBand = "value" | "core" | "premium" | "luxury";

export interface ProjectInsightBlock {
  score: number;
  band: ScoreBand;
  summary: string;
}

export interface ProjectInsights {
  projectCategory: CategoryBand;
  positioningLabel: "mass" | "mid" | "premium";
  densityCategory: "low" | "balanced" | "high";
  stageOfDevelopment: "ready" | "under-construction" | "early-stage";
  density: ProjectInsightBlock;
  livability: ProjectInsightBlock;
  stageRisk: ProjectInsightBlock;
  configurationPositioning: {
    summary: string;
    dominantConfig: string;
  };
  buyerSegments: string[];
  idealBuyers: string[];
  notIdealBuyers: string[];
  marketPositioning: {
    summary: string;
    label: string;
  };
  riskUpside: {
    upside: string[];
    risks: string[];
  };
  marketBaseline: {
    corridorMaturityLevel: "emerging" | "transitioning" | "mature" | "unknown";
    typicalProjectScale: {
      totalUnitsMedian: number;
      totalTowersMedian: number;
      totalFloorsMedian: number;
      unitsPerTowerMedian: number;
    } | null;
    typicalConfiguration: string | null;
    stageMix: {
      earlyStageShare: number;
      underConstructionShare: number;
      readyShare: number;
    } | null;
    densityPercentiles: {
      p25: number;
      p50: number;
      p75: number;
    } | null;
  };
  relativeComparison: {
    densityVsMarket: {
      label: "less-dense-than-market" | "market-aligned-density" | "denser-than-market" | "insufficient-data";
      summary: string;
    };
    stageVsMarket: {
      label: "more-delivered-than-market" | "market-aligned-stage" | "earlier-than-market" | "insufficient-data";
      summary: string;
    };
    positioningVsMarket: {
      label: "more-premium-than-market" | "market-aligned-positioning" | "more-value-than-market" | "insufficient-data";
      summary: string;
    };
  };
  confidence: {
    overall: ScoreBand;
    sampleSize: ScoreBand;
    dataCompleteness: ScoreBand;
    developerCoverage: ScoreBand;
    sampleSizeValue: number;
    dataCompletenessValue: number;
    developerCoverageValue: number;
  };
}

interface ProjectInsightsInput {
  projectId: string;
  updatedAt: string;
  totalUnits: number;
  totalTowers: number;
  totalFloors: number;
  hasLocationAdvantages: boolean;
  hasAmenities: boolean;
  status: string;
  completionStatus: string;
  possessionDateText: string;
  priceRangeText: string;
  propertyTypes: string[];
  bhkConfig: string;
  microMarketId: string;
  cityId: string;
  // Project-specific context for grounded bullet generation
  projectName: string;
  developerName: string;
  microMarketName: string;
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const scoreBand = (score: number): ScoreBand => {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
};

const deriveCategory = (priceRangeText: string, propertyTypes: string[]): CategoryBand => {
  const normalizedPrice = priceRangeText.toLowerCase();
  const hasVilla = propertyTypes.some((type) => type.toLowerCase().includes("villa"));
  const hasLuxuryKeywords =
    normalizedPrice.includes("cr") ||
    normalizedPrice.includes("crore") ||
    normalizedPrice.includes("luxury") ||
    normalizedPrice.includes("premium");

  if (hasVilla && hasLuxuryKeywords) return "luxury";
  if (hasLuxuryKeywords) return "premium";
  if (hasVilla) return "core";
  return "value";
};

const deriveBuyerSegments = (category: CategoryBand, bhkConfig: string, stageRisk: number): string[] => {
  const segments = new Set<string>();
  const normalizedConfig = bhkConfig.toLowerCase();

  if (normalizedConfig.includes("1bhk") || normalizedConfig.includes("2bhk")) {
    segments.add("First-time upgraders");
    segments.add("Yield-oriented investors");
  }
  if (normalizedConfig.includes("3bhk") || normalizedConfig.includes("4bhk")) {
    segments.add("End-use family buyers");
  }
  if (category === "luxury" || category === "premium") {
    segments.add("Affluent lifestyle buyers");
  }
  if (stageRisk <= 45) {
    segments.add("Low execution-risk investors");
  } else {
    segments.add("Value-seeking early-entry investors");
  }

  return Array.from(segments);
};

const compareDensity = (projectUnits: number, baseline: MicroMarketBaseline | null) => {
  if (!baseline || baseline.sampleSize < 8) {
    return {
      label: "insufficient-data" as const,
      summary: "Market-relative density comparison is limited due to low corridor sample depth.",
    };
  }
  const p25 = baseline.densityPercentiles.totalUnits.p25;
  const p75 = baseline.densityPercentiles.totalUnits.p75;
  if (projectUnits > 0 && projectUnits < p25) {
    return {
      label: "less-dense-than-market" as const,
      summary: "Project scale is lower than typical corridor supply, often translating to lower crowd load.",
    };
  }
  if (projectUnits > p75) {
    return {
      label: "denser-than-market" as const,
      summary: "Project scale is higher than typical corridor supply, usually with higher amenity utilization.",
    };
  }
  return {
    label: "market-aligned-density" as const,
    summary: "Project density is broadly aligned with prevailing corridor project scale.",
  };
};

const compareStage = (
  stage: "ready" | "under-construction" | "early-stage",
  baseline: MicroMarketBaseline | null
) => {
  if (!baseline || baseline.sampleSize < 8) {
    return {
      label: "insufficient-data" as const,
      summary: "Stage comparison confidence is limited due to insufficient corridor sample size.",
    };
  }
  const readyShare = baseline.stageMix.readyShare;
  if (stage === "ready" && readyShare < 0.35) {
    return {
      label: "more-delivered-than-market" as const,
      summary: "This project sits in a more delivered stage than most corridor inventory.",
    };
  }
  if (stage === "early-stage" && readyShare >= 0.4) {
    return {
      label: "earlier-than-market" as const,
      summary: "This project is earlier in lifecycle than the corridor's prevailing delivered profile.",
    };
  }
  return {
    label: "market-aligned-stage" as const,
    summary: "Project stage broadly aligns with current corridor lifecycle mix.",
  };
};

const comparePositioning = (
  positioningLabel: "mass" | "mid" | "premium",
  baseline: MicroMarketBaseline | null
) => {
  if (!baseline || baseline.sampleSize < 8) {
    return {
      label: "insufficient-data" as const,
      summary: "Positioning comparison is limited due to low baseline confidence.",
    };
  }
  const dominant = baseline.positioningMix.dominantPositioning;
  const order: Record<"mass" | "mid" | "premium", number> = { mass: 1, mid: 2, premium: 3 };
  if (order[positioningLabel] > order[dominant]) {
    return {
      label: "more-premium-than-market" as const,
      summary: "Project positioning is above the corridor's dominant quality/price tier.",
    };
  }
  if (order[positioningLabel] < order[dominant]) {
    return {
      label: "more-value-than-market" as const,
      summary: "Project positioning sits below the corridor's dominant tier, indicating value skew.",
    };
  }
  return {
    label: "market-aligned-positioning" as const,
    summary: "Project positioning is aligned with the corridor's dominant supply tier.",
  };
};

const deriveInsights = (input: ProjectInsightsInput, baseline: MicroMarketBaseline | null): ProjectInsights => {
  const densityRaw = input.totalUnits > 0 ? Math.min(100, Math.round((input.totalUnits / 1200) * 100)) : 40;
  const livabilityRaw =
    35 +
    (input.hasAmenities ? 25 : 0) +
    (input.hasLocationAdvantages ? 25 : 0) +
    (input.totalTowers > 0 && input.totalUnits / Math.max(1, input.totalTowers) < 140 ? 15 : 0);

  const statusText = `${input.status} ${input.completionStatus} ${input.possessionDateText}`.toLowerCase();
  const stageRiskRaw =
    statusText.includes("ready") || statusText.includes("completed")
      ? 20
      : statusText.includes("construction") || statusText.includes("under")
        ? 55
        : 70;

  const category = deriveCategory(input.priceRangeText, input.propertyTypes);
  const dominantConfig = input.bhkConfig || "Not disclosed";
  const configurationSummary = dominantConfig.toLowerCase().includes("4")
    ? "Large-format inventory orientation"
    : dominantConfig.toLowerCase().includes("2")
      ? "Mid-market volume orientation"
      : "Balanced configuration spread";

  const densityBand = scoreBand(densityRaw);
  const livabilityBand = scoreBand(livabilityRaw);
  const stageRiskBand = scoreBand(100 - stageRiskRaw);

  const marketLabel =
    category === "luxury"
      ? "Luxury-led supply"
      : category === "premium"
        ? "Premium end-user corridor"
        : category === "core"
          ? "Core residential depth"
          : "Value-market absorption";

  const positioningLabel: "mass" | "mid" | "premium" =
    category === "luxury" || category === "premium" ? "premium" : category === "core" ? "mid" : "mass";
  const densityCategory: "low" | "balanced" | "high" =
    densityRaw >= 75 ? "high" : densityRaw >= 45 ? "balanced" : "low";
  const stageOfDevelopment: "ready" | "under-construction" | "early-stage" =
    stageRiskRaw <= 30 ? "ready" : stageRiskRaw <= 60 ? "under-construction" : "early-stage";

  const idealBuyers = deriveBuyerSegments(category, dominantConfig, stageRiskRaw);
  const notIdealBuyers = [
    stageRiskRaw > 60 ? "Immediate-possession buyers" : "High-risk appetite speculators",
    category === "luxury" ? "Strict value-only budget buyers" : "Ultra-luxury requirement seekers",
  ];
  // Format possession year for use in bullets (e.g. "mid-2026")
  const possessionYear = (() => {
    const d = new Date(input.possessionDateText);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const half = m < 6 ? "early" : "mid";
      return `${half}-${y}`;
    }
    return input.possessionDateText || "at handover";
  })();

  const proj = input.projectName || "This project";
  const dev = input.developerName || "The developer";
  const mm = input.microMarketName || "this corridor";
  const units = input.totalUnits;
  const towers = input.totalTowers;

  const riskUpside = {
    upside: [
      // Execution / stage upside
      stageRiskRaw <= 30
        ? `${dev} has ${towers > 0 ? `${towers} towers` : "the project"} at an advanced structural stage — execution risk is largely behind you.`
        : stageRiskRaw <= 55
          ? `${proj} is mid-construction in ${mm} — entry now captures pre-completion pricing before handover appreciation.`
          : `Early-entry pricing in ${mm} gives patient buyers a cost advantage over ready inventory in the same corridor.`,
      // Location / demand upside
      input.hasLocationAdvantages
        ? `${mm} has established IT and commercial demand drivers — rental absorption is steady for this configuration type.`
        : `Infrastructure expansion planned around ${mm} could widen buyer demand over the next 3–5 years.`,
    ],
    risks: [
      // Density / resale risk
      densityRaw >= 75 && units > 0
        ? `${units.toLocaleString()} units means intense resale competition when bulk handover happens around ${possessionYear} — secondary market pricing will be under pressure.`
        : densityRaw >= 45
          ? `Mid-scale inventory means moderate resale supply at handover — plan for a 12–18 month absorption window before exit.`
          : `Lower supply density in ${mm} supports resale liquidity but limits rental-pool depth for investors.`,
      // Stage / timeline risk
      stageRiskRaw > 60
        ? `Construction is at an early stage — delivery timelines for ${proj} carry meaningful execution uncertainty until towers are topped out.`
        : stageRiskRaw > 35
          ? `Advanced-stage projects in ${mm} typically have limited room for price negotiation — expect list-price transactions.`
          : `Ready or near-ready inventory in ${mm} leaves minimal capital-appreciation runway before handover.`,
    ],
  };

  const densityVsMarket = compareDensity(input.totalUnits, baseline);
  const stageVsMarket = compareStage(stageOfDevelopment, baseline);
  const positioningVsMarket = comparePositioning(positioningLabel, baseline);

  return {
    projectCategory: category,
    positioningLabel,
    densityCategory,
    stageOfDevelopment,
    density: {
      score: densityRaw,
      band: densityBand,
      summary:
        densityBand === "high"
          ? "High-density development profile"
          : densityBand === "medium"
            ? "Balanced density profile"
            : "Low-density development profile",
    },
    livability: {
      score: Math.min(100, livabilityRaw),
      band: livabilityBand,
      summary:
        livabilityBand === "high"
          ? "Strong livability setup via amenities and access"
          : livabilityBand === "medium"
            ? "Moderate livability setup"
            : "Livability indicators are limited",
    },
    stageRisk: {
      score: stageRiskRaw,
      band: stageRiskBand,
      summary:
        stageRiskRaw <= 30
          ? "Execution risk is relatively low"
          : stageRiskRaw <= 60
            ? "Execution risk is moderate"
            : "Execution risk is elevated for this stage",
    },
    configurationPositioning: {
      summary: configurationSummary,
      dominantConfig,
    },
    buyerSegments: idealBuyers,
    idealBuyers,
    notIdealBuyers,
    marketPositioning: {
      summary: `${marketLabel} with ${configurationSummary.toLowerCase()}.`,
      label: marketLabel,
    },
    riskUpside,
    marketBaseline: {
      corridorMaturityLevel: baseline?.corridorMaturityLevel ?? "unknown",
      typicalProjectScale: baseline
        ? {
            totalUnitsMedian: baseline.typicalProjectScale.totalUnitsMedian,
            totalTowersMedian: baseline.typicalProjectScale.totalTowersMedian,
            totalFloorsMedian: baseline.typicalProjectScale.totalFloorsMedian,
            unitsPerTowerMedian: baseline.typicalProjectScale.unitsPerTowerMedian,
          }
        : null,
      typicalConfiguration: baseline?.configurationMix?.dominantConfig ?? null,
      stageMix: baseline
        ? {
            earlyStageShare: baseline.stageMix.earlyStageShare,
            underConstructionShare: baseline.stageMix.underConstructionShare,
            readyShare: baseline.stageMix.readyShare,
          }
        : null,
      densityPercentiles: baseline
        ? {
            p25: baseline.densityPercentiles.totalUnits.p25,
            p50: baseline.densityPercentiles.totalUnits.p50,
            p75: baseline.densityPercentiles.totalUnits.p75,
          }
        : null,
    },
    relativeComparison: {
      densityVsMarket,
      stageVsMarket,
      positioningVsMarket,
    },
    confidence: baseline?.confidence ?? {
      overall: "low",
      sampleSize: "low",
      dataCompleteness: "low",
      developerCoverage: "low",
      sampleSizeValue: 0,
      dataCompletenessValue: 0,
      developerCoverageValue: 0,
    },
  };
};

const getCachedProjectInsights = unstable_cache(
  async (
    cacheVersion: string,
    input: ProjectInsightsInput,
    baseline: MicroMarketBaseline | null
  ) => deriveInsights(input, baseline),
  ["project-insights-v1"],
  { revalidate: 3600 }
);

export const projectInsightsService = {
  async getProjectInsights(project: ProjectWithRelations): Promise<ProjectInsights> {
    const propertyTypesRaw = Array.isArray((project as any).property_types)
      ? (project as any).property_types
      : typeof (project as any).property_types === "string"
        ? [(project as any).property_types]
        : [];

    const input = {
      projectId: String(project.id ?? ""),
      updatedAt: String(project.updated_at ?? ""),
      totalUnits: toNumber((project as any).total_units),
      totalTowers: toNumber((project as any).total_towers),
      totalFloors: toNumber((project as any).total_floors),
      hasLocationAdvantages: Boolean((project as any).location_advantages_json),
      hasAmenities: Boolean((project as any).amenities_json),
      status: String((project as any).status ?? ""),
      completionStatus: String((project as any).completion_status ?? ""),
      possessionDateText: String((project as any).possession_date_text ?? ""),
      priceRangeText: String(project.price_range_text ?? ""),
      propertyTypes: propertyTypesRaw.map((item: unknown) => String(item)),
      bhkConfig: String((project as any).bhk_config ?? (project as any).configuration_display ?? ""),
      microMarketId: String(project.micro_market_id ?? ""),
      cityId: String(project.city_id ?? ""),
      projectName: String(project.project_name ?? ""),
      developerName: String(project.developer?.developer_name ?? project.developer_name ?? ""),
      microMarketName: String(project.micro_market?.micro_market_name ?? (project as any).micro_market_name ?? ""),
    };

    const baseline =
      input.microMarketId
        ? await microMarketAnalyticsService.getMicroMarketBaseline(input.microMarketId, input.cityId || undefined)
        : null;

    const baselineVersion = baseline
      ? `${baseline.sampleSize}:${baseline.generatedAt}:${baseline.confidence.overall}`
      : "none";
    const cacheVersion = `${input.projectId}:${input.updatedAt}:${baselineVersion}`;

    return getCachedProjectInsights(cacheVersion, input, baseline);
  },
};
