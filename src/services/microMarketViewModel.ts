/**
 * Transforms micro_market_page_cache_v2 rows into UI-ready view model.
 * Single source of truth for micro-market page data.
 */

export interface MicroMarketCacheRow {
  id: string;
  micro_market_name: string | null;
  url_slug: string | null;
  micro_market_key: string | null;
  city_id: string | null;
  hero_hook: string | null;
  price_per_sqft_min: number | null;
  price_per_sqft_max: number | null;
  annual_appreciation_min: number | null;
  annual_appreciation_max: number | null;
  rental_yield_min: number | null;
  rental_yield_max: number | null;
  completion_ratio: number | null;
  recent_launches: number | null;
  velocity_score: number | null;
  premium_projects: number | null;
  new_developer_entries: number | null;
  rotation_score: number | null;
  institutional_share: number | null;
  institutional_multiple: number | null;
  delay_multiple: number | null;
  delay_ratio: number | null;
  wealth_score: number | null;
  capital_momentum_score: number | null;
  developer_strength: number | null;
  premium_density: number | null;
  refreshed_at?: string | null;
}

export interface HeroSnapshot {
  name: string;
  hook: string | null;
  priceRange: { min: number | null; max: number | null };
  growth: { min: number | null; max: number | null };
  rental: { min: number | null; max: number | null };
  keySignals: {
    cycleStage: string | null;
    entryPhase: string | null;
    institutionalConfidence: string | null;
    capitalMomentum: string | null;
  };
}

export interface WhyThisMarket {
  whoIsBuying: string[];
  whyNow: string[];
  migrationTrend: string[];
  /** @deprecated Use whoIsBuying/whyNow/migrationTrend chips. Kept for backward compatibility. */
  growthStory?: string;
}

export interface PipelineStage {
  label: string;
  status: "completed" | "active" | "pending";
}

export interface SupplyDevelopment {
  projectActivity: number | null;
  supplyTrend: number | null;
  constructionMomentum: number | null;
  velocityScore: number | null;
  tier1DeveloperShare: number | null;
  phaseExpansionSignal: string | null;
  supplyWaveIndicator: string | null;
  pipelineStages: PipelineStage[];
}

export interface DemandLiquidity {
  completion: number | null;
  exitVisibility: { delayRatio: number | null; delayMultiple: number | null };
  exitVisibilityScore: number | null;
  rentalDemandSignal: string | null;
  buyerProfileMix: string | null;
  demandBar: number | null;
}

export interface DeveloperCapital {
  developerStrength: number | null;
  institutionalEntry: number | null;
  premiumMigration: { projects: number | null; density: number | null; share: number | null };
  institutionalEntryScore: number | null;
  landBankingActivity: string | null;
  capitalConvictionBand: string | null;
}

export interface InfrastructureTimelineStep {
  label: string;
  status: "announced" | "active" | "completed";
}

export interface InfrastructureFuture {
  majorInfrastructure: string | null;
  impactSignals: string | null;
  timeline: InfrastructureTimelineStep[];
  impactProbability: number | null;
  majorCorridorCatalysts: string[];
}

export interface RiskOutlook {
  supplyRisk: number | null;
  execution: string | null;
  futureCycle: { rotationScore: number | null; momentumScore: number | null };
  bullBaseBear: { bull: number; base: number; bear: number };
  pricingOverheatingRisk: number | null;
  executionRisk: number | null;
}

export interface MicroMarketViewModel {
  id: string;
  urlSlug: string;
  cityId: string | null;
  hero: HeroSnapshot;
  whyThisMarket: WhyThisMarket;
  supplyDevelopment: SupplyDevelopment;
  demandLiquidity: DemandLiquidity;
  developerCapital: DeveloperCapital;
  infrastructureFuture: InfrastructureFuture;
  riskOutlook: RiskOutlook;
}

const toNum = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const toStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

export function buildMicroMarketViewModel(row: MicroMarketCacheRow): MicroMarketViewModel {
  const priceMin = toNum(row.price_per_sqft_min);
  const priceMax = toNum(row.price_per_sqft_max);
  const growthMin = toNum(row.annual_appreciation_min);
  const growthMax = toNum(row.annual_appreciation_max);
  const rentalMin = toNum(row.rental_yield_min);
  const rentalMax = toNum(row.rental_yield_max);

  const completion = toNum(row.completion_ratio);
  const recentLaunches = toNum(row.recent_launches);
  const growthStory =
    growthMin != null && growthMin > 0
      ? `Strong appreciation potential (${growthMin}%+ YoY) driven by infrastructure and demand.`
      : toStr(row.hero_hook) || "Established corridor with steady demand and growth trajectory.";
  const premiumProjects = toNum(row.premium_projects);
  const premiumDensity = toNum(row.premium_density);
  const wealthScore = toNum(row.wealth_score);
  const exitInterpretation =
    completion != null
      ? completion >= 0.7
        ? "High completion ratio supports exit visibility."
        : completion >= 0.4
          ? "Moderate completion—exit visibility improving."
          : "Early-stage corridor—longer hold recommended."
      : null;

  const devStrength = toNum(row.developer_strength);
  const execution =
    devStrength != null
      ? devStrength >= 70
        ? "Strong developer execution track record."
        : devStrength >= 40
          ? "Mixed execution—select projects carefully."
          : "Emerging developer base—verify delivery history."
      : null;

  const rotationScore = toNum(row.rotation_score);
  const capitalMomentum = toNum(row.capital_momentum_score);
  const instShare = toNum(row.institutional_share);

  const cycleStage =
    rotationScore != null
      ? rotationScore >= 70
        ? "Accumulation"
        : rotationScore >= 40
          ? "Expansion"
          : "Early / Stable"
      : null;

  const entryPhase =
    completion != null && capitalMomentum != null
      ? completion >= 0.7 && capitalMomentum >= 60
        ? "Active"
        : completion >= 0.4
          ? "Phased"
          : "Early"
      : completion != null
        ? completion >= 0.7
          ? "Active"
          : completion >= 0.4
            ? "Phased"
            : "Early"
        : null;

  const institutionalConfidence =
    instShare != null
      ? instShare >= 0.6
        ? "High"
        : instShare >= 0.3
          ? "Moderate"
          : "Emerging"
      : null;

  const capitalMomentumLabel =
    capitalMomentum != null
      ? capitalMomentum >= 70
        ? "Strong"
        : capitalMomentum >= 40
          ? "Building"
          : "Steady"
      : null;

  const whoIsBuying: string[] = [];
  if (instShare != null && instShare >= 0.5) whoIsBuying.push("Institutional buyers");
  if (instShare != null && instShare >= 0.2 && instShare < 0.5) whoIsBuying.push("End-user investors");
  if (wealthScore != null && wealthScore >= 60) whoIsBuying.push("Premium segment");
  if (wealthScore != null && wealthScore >= 40 && wealthScore < 60) whoIsBuying.push("Mid-segment");
  if (whoIsBuying.length === 0) whoIsBuying.push("Retail investors", "End-user demand");

  const whyNow: string[] = [];
  if (rotationScore != null && rotationScore >= 60) whyNow.push("Cycle timing");
  if (capitalMomentum != null && capitalMomentum >= 60) whyNow.push("Momentum building");
  if (completion != null && completion >= 0.5) whyNow.push("Supply normalization");
  if (recentLaunches != null && recentLaunches > 0) whyNow.push("Active development");
  if (growthMin != null && growthMin > 0) whyNow.push("Appreciation potential");
  if (whyNow.length === 0) whyNow.push("Steady demand", "Established corridor");

  const migrationTrend: string[] = [];
  if (instShare != null && instShare >= 0.4) migrationTrend.push("Institutional inflow");
  if (premiumProjects != null && premiumProjects > 0) migrationTrend.push("Premium migration");
  if (toNum(row.new_developer_entries) != null && toNum(row.new_developer_entries)! > 0)
    migrationTrend.push("New developer entry");
  if (premiumDensity != null && premiumDensity >= 0.5) migrationTrend.push("Premium density");
  if (migrationTrend.length === 0) migrationTrend.push("Organic growth", "Steady absorption");

  return {
    id: String(row.id),
    urlSlug: toStr(row.url_slug, "unknown"),
    cityId: row.city_id ? String(row.city_id) : null,
    hero: {
      name: toStr(row.micro_market_name, "Micro Market"),
      hook: row.hero_hook ? toStr(row.hero_hook) : null,
      priceRange: { min: priceMin, max: priceMax },
      growth: { min: growthMin, max: growthMax },
      rental: { min: rentalMin, max: rentalMax },
      keySignals: {
        cycleStage,
        entryPhase,
        institutionalConfidence,
        capitalMomentum: capitalMomentumLabel,
      },
    },
    whyThisMarket: {
      whoIsBuying,
      whyNow,
      migrationTrend,
      growthStory,
    },
    supplyDevelopment: (() => {
      const sdCompletion = toNum(row.completion_ratio);
      const devStrength = toNum(row.developer_strength);
      const sdCapitalMomentum = toNum(row.capital_momentum_score);
      const newEntries = toNum(row.new_developer_entries);
      const velocityScore = toNum(row.velocity_score);
      const sdRecentLaunches = toNum(row.recent_launches);
      const phaseExpansionSignal =
        sdCompletion != null && sdCapitalMomentum != null
          ? sdCompletion >= 0.6 && (sdCapitalMomentum >= 60 || (newEntries ?? 0) > 0)
            ? "Expanding"
            : sdCompletion >= 0.4
              ? "Stable"
              : "Early"
          : sdCompletion != null
            ? sdCompletion >= 0.6
              ? "Expanding"
              : sdCompletion >= 0.4
                ? "Stable"
                : "Early"
            : null;
      const supplyWaveIndicator =
        velocityScore != null && sdRecentLaunches != null
          ? velocityScore >= 70 && sdRecentLaunches >= 3
            ? "Peak"
            : velocityScore >= 50 || sdRecentLaunches >= 1
              ? "Rising"
              : velocityScore != null && velocityScore < 30
                ? "Trough"
                : "Stable"
          : velocityScore != null
            ? velocityScore >= 60
              ? "Rising"
              : velocityScore >= 30
                ? "Stable"
                : "Trough"
            : null;
      const stageLabels = ["Early planning", "Launches", "Under construction", "Completion"];
      const thresholds = [0, 0.25, 0.5, 0.75];
      const c = sdCompletion ?? 0;
      const activeIdx = thresholds.reduce((last, t, i) => (c >= t ? i : last), 0);
      const pipelineStages: PipelineStage[] = stageLabels.map((label, i) => ({
        label,
        status: (i < activeIdx ? "completed" : i === activeIdx ? "active" : "pending") as "completed" | "active" | "pending",
      }));
      return {
        projectActivity: toNum(row.recent_launches),
        supplyTrend: sdCompletion,
        constructionMomentum: toNum(row.capital_momentum_score),
        velocityScore,
        tier1DeveloperShare: devStrength,
        phaseExpansionSignal,
        supplyWaveIndicator,
        pipelineStages,
      };
    })(),
    demandLiquidity: (() => {
      const dlCompletion = completion;
      const delayRatio = toNum(row.delay_ratio);
      const rentalAvg =
        rentalMin != null && rentalMax != null
          ? (rentalMin + rentalMax) / 2
          : rentalMin ?? rentalMax ?? null;
      const exitVisibilityScore =
        dlCompletion != null && delayRatio != null
          ? Math.round(
              Math.min(100, Math.max(0, dlCompletion * 100 * (1 - Math.min(1, delayRatio))))
            )
          : dlCompletion != null
            ? Math.round(dlCompletion * 100)
            : null;
      const rentalDemandSignal =
        rentalAvg != null
          ? rentalAvg >= 5
            ? "Strong"
            : rentalAvg >= 3
              ? "Moderate"
              : "Emerging"
          : null;
      const buyerProfileMix =
        instShare != null
          ? instShare >= 0.5
            ? "Institutional-heavy"
            : instShare <= 0.2
              ? "Retail-dominant"
              : "Balanced"
          : null;
      const velocityScore = toNum(row.velocity_score);
      const demandBar =
        dlCompletion != null || velocityScore != null || rentalAvg != null
          ? Math.round(
              Math.min(
                100,
                Math.max(
                  0,
                  (dlCompletion ?? 0) * 40 + ((velocityScore ?? 0) / 100) * 40 + (rentalAvg ?? 0) * 2
                )
              )
            )
          : null;
      return {
        completion: dlCompletion,
        exitVisibility: {
          delayRatio,
          delayMultiple: toNum(row.delay_multiple),
        },
        exitVisibilityScore,
        rentalDemandSignal,
        buyerProfileMix,
        demandBar,
      };
    })(),
    developerCapital: (() => {
      const newEntries = toNum(row.new_developer_entries);
      const instShare = toNum(row.institutional_share);
      const capMomentum = toNum(row.capital_momentum_score);
      const completion = toNum(row.completion_ratio);
      const institutionalEntryScore =
        instShare != null || newEntries != null
          ? Math.round(
              Math.min(
                100,
                Math.max(
                  0,
                  (instShare ?? 0) * 80 + Math.min(20, (newEntries ?? 0) * 5)
                )
              )
            )
          : null;
      const landBankingActivity =
        completion != null || newEntries != null
          ? completion != null && newEntries != null
            ? completion < 0.4 && newEntries >= 2
              ? "Active"
              : completion < 0.6 || newEntries >= 1
                ? "Moderate"
                : "Emerging"
            : completion != null && completion < 0.5
              ? "Moderate"
              : newEntries != null && newEntries > 0
                ? "Moderate"
                : "Emerging"
          : null;
      const capitalConvictionBand =
        instShare != null && capMomentum != null
          ? instShare >= 0.5 && capMomentum >= 60
            ? "High"
            : instShare >= 0.3 || capMomentum >= 40
              ? "Medium"
              : "Low"
          : instShare != null
            ? instShare >= 0.5
              ? "High"
              : instShare >= 0.3
                ? "Medium"
                : "Low"
            : capMomentum != null
              ? capMomentum >= 60
                ? "High"
                : capMomentum >= 40
                  ? "Medium"
                  : "Low"
              : null;
      return {
        developerStrength: devStrength,
        institutionalEntry: newEntries,
        premiumMigration: {
          projects: toNum(row.premium_projects),
          density: toNum(row.premium_density),
          share: toNum(row.institutional_share),
        },
        institutionalEntryScore,
        landBankingActivity,
        capitalConvictionBand,
      };
    })(),
    infrastructureFuture: (() => {
      const ifCompletion = completion;
      const capMomentum = toNum(row.capital_momentum_score);
      const velocityScore = toNum(row.velocity_score);
      const newEntries = toNum(row.new_developer_entries);
      const instShare = toNum(row.institutional_share);
      const premiumProjects = toNum(row.premium_projects);
      const timeline: InfrastructureTimelineStep[] = (() => {
        const c = ifCompletion ?? 0;
        const steps = [
          { label: "Announced", threshold: 0 },
          { label: "Active", threshold: 0.3 },
          { label: "Delivered", threshold: 0.7 },
        ];
        const activeIdx = steps.reduce((last, s, i) => (c >= s.threshold ? i : last), 0);
        return steps.map((s, i) => ({
          label: s.label,
          status: (i < activeIdx ? "completed" : i === activeIdx ? "active" : "announced") as "completed" | "active" | "announced",
        }));
      })();
      const impactProbability =
        capMomentum != null || velocityScore != null || ifCompletion != null
          ? Math.round(
              Math.min(
                100,
                Math.max(
                  0,
                  ((capMomentum ?? 0) * 0.5 + (velocityScore ?? 0) * 0.3 + (ifCompletion ?? 0) * 40)
                )
              )
            )
          : null;
      const catalysts: string[] = [];
      if (instShare != null && instShare >= 0.3) catalysts.push("Institutional inflow");
      if (newEntries != null && newEntries > 0) catalysts.push("Developer entry");
      if (premiumProjects != null && premiumProjects > 0) catalysts.push("Premium migration");
      if (capMomentum != null && capMomentum >= 50) catalysts.push("Capital momentum");
      if (catalysts.length === 0) catalysts.push("Organic growth");
      return {
        majorInfrastructure: null,
        impactSignals: exitInterpretation,
        timeline,
        impactProbability,
        majorCorridorCatalysts: catalysts,
      };
    })(),
    riskOutlook: (() => {
      const rotationScore = toNum(row.rotation_score);
      const capMomentum = toNum(row.capital_momentum_score);
      const delayRatio = toNum(row.delay_ratio);
      const devStrength = toNum(row.developer_strength);
      const velocityScore = toNum(row.velocity_score);
      const growthMin = toNum(row.annual_appreciation_min);
      const bullRaw = Math.min(100, Math.max(0, ((rotationScore ?? 50) + (capMomentum ?? 50)) / 2));
      const bearRaw = Math.min(100, Math.max(0, (delayRatio ?? 0) * 120 + (100 - (capMomentum ?? 50)) * 0.15));
      const baseRaw = Math.max(0, 100 - bullRaw - bearRaw);
      const total = bullRaw + bearRaw + baseRaw || 1;
      const bull = Math.round((100 * bullRaw) / total);
      const base = Math.round((100 * baseRaw) / total);
      const bear = 100 - bull - base;
      const bullBaseBear = {
        bull: Math.max(0, Math.min(100, bull)),
        base: Math.max(0, Math.min(100, base)),
        bear: Math.max(0, Math.min(100, bear)),
      };
      const pricingOverheatingRisk =
        growthMin != null || velocityScore != null
          ? Math.round(
              Math.min(
                100,
                Math.max(0, ((growthMin ?? 0) * 3 + (velocityScore ?? 0) * 0.4) / 1.5)
              )
            )
          : null;
      const executionRisk =
        devStrength != null || delayRatio != null
          ? Math.round(
              Math.min(
                100,
                Math.max(0, (100 - (devStrength ?? 50)) * 0.5 + (delayRatio ?? 0) * 80)
              )
            )
          : null;
      return {
        supplyRisk: delayRatio,
        execution,
        futureCycle: {
          rotationScore: toNum(row.rotation_score),
          momentumScore: toNum(row.capital_momentum_score),
        },
        bullBaseBear,
        pricingOverheatingRisk,
        executionRisk,
      };
    })(),
  };
}
