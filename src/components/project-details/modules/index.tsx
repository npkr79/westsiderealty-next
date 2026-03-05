import type { ComponentType } from "react";
import ProjectDescription from "@/components/project-details/ProjectDescription";
import TechnicalSpecsCard from "@/components/project-details/TechnicalSpecsCard";
import AmenitiesCard from "@/components/project-details/AmenitiesCard";
import SpecificationsCard from "@/components/project-details/SpecificationsCard";
import FloorPlansGallery from "@/components/project-details/FloorPlansGallery";
import GoogleMapEmbed from "@/components/project-details/GoogleMapEmbed";
import LocationAdvantages from "@/components/project-details/LocationAdvantages";
import WhyInvestSection from "@/components/project-details/WhyInvestSection";
import WestsideVerdictSection from "@/components/project-details/WestsideVerdictSection";
import ProjectFAQs from "@/components/project-details/ProjectFAQs";
import SimilarProjects from "@/components/project-details/SimilarProjects";
import ProjectStickySidebar from "@/components/project-details/ProjectStickySidebar";
import ProjectStickyCard from "@/components/project-details/ProjectStickyCard";
import ProjectSocialProof from "@/components/project-details/ProjectSocialProof";
import ProjectCorridorStory from "@/components/project-details/ProjectCorridorStory";
import AboutDeveloperSection from "@/components/project-details/AboutDeveloperSection";
import AboutMicroMarketSection from "@/components/project-details/AboutMicroMarketSection";
import ProjectHighlights from "@/components/project-details/ProjectHighlights";
import LocationConnectivityMap from "@/components/project-details/LocationConnectivityMap";
import type { ProjectWithRelations } from "@/services/projectService";
import type { ProjectInsights } from "@/services/projectInsightsService";
import { getLifestyleSignals } from "@/utils/projectConfiguration";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Gauge, Users, Building2, CircleDot, TrendingUp, Clock3, Droplets, AlertTriangle, BarChart3 } from "lucide-react";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";

const toExecutionRiskLevel = (insights: ProjectInsights): "Stable" | "Steady" | "Needs closer watch" => {
  const score = Number(insights.stageRisk?.score ?? 60);
  if (score <= 30) return "Stable";
  if (score <= 60) return "Steady";
  return "Needs closer watch";
};

const toLivabilityLevel = (insights: ProjectInsights): "Good long-term livability" | "Balanced everyday comfort" | "Needs comfort checks" => {
  const score = Number(insights.livability?.score ?? 50);
  if (score >= 70) return "Good long-term livability";
  if (score >= 45) return "Balanced everyday comfort";
  return "Needs comfort checks";
};

const toDensityLabel = (insights: ProjectInsights): "Low-density comfort" | "Balanced density" | "High-density, active" => {
  if (insights.densityCategory === "high") return "High-density, active";
  if (insights.densityCategory === "low") return "Low-density comfort";
  return "Balanced density";
};

const toPrivacyCrowdLabel = (insights: ProjectInsights): "Calm" | "Balanced" | "Active" => {
  if (insights.densityCategory === "high") return "Active";
  if (insights.densityCategory === "low") return "Calm";
  return "Balanced";
};

const toBuyerFitLabel = (insights: ProjectInsights): string => {
  if (insights.idealBuyers.some((item) => /end-use family/i.test(item))) return "End-user friendly";
  if (insights.idealBuyers.some((item) => /first-time/i.test(item))) return "First-home friendly";
  return insights.buyerSegments[0] || "Balanced suitability";
};

const HYDERABAD_LANDMARKS: Array<{ label: string; lat: number; lng: number }> = [
  { label: "Financial District", lat: 17.4186, lng: 78.3426 },
  { label: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { label: "ORR", lat: 17.4089, lng: 78.4238 },
  { label: "Airport", lat: 17.2403, lng: 78.4294 },
];

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

const distanceInKm = (fromLat: number, fromLng: number, toLat: number, toLng: number): number => {
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

interface AddressProps {
  project: ProjectWithRelations;
  address: string;
  galleryImages: string[];
  insights: ProjectInsights;
  intent: ListingIntent;
}

export function ProjectHero({ project, address, galleryImages, insights, intent }: AddressProps) {
  const scoreFromSignal = (
    signal: string,
    rules: Array<{ pattern: RegExp; score: number }>,
    defaultScore: number
  ): number => {
    for (const rule of rules) {
      if (rule.pattern.test(signal)) return rule.score;
    }
    return defaultScore;
  };
  const developer = project.developer ?? null;
  const displayDeveloperName =
    String((project as any).display_developer_name ?? developer?.developer_name ?? (project as any).developer_name ?? "").trim() ||
    null;
  const totalUnits = Number((project as any).total_units ?? 0);
  const carpetAreaRaw = String((project as any).carpet_area ?? "").trim();
  const unitSizeRangeRaw = String((project as any).unit_size_range ?? "").trim();
  const sizeBand = unitSizeRangeRaw || carpetAreaRaw;
  const possessionText =
    String((project as any).possession_date_text ?? "").trim() ||
    String((project as any).possession_date ?? "").split("T")[0].trim();
  const executionRisk = toExecutionRiskLevel(insights);
  const livability = toLivabilityLevel(insights);
  const density = toDensityLabel(insights);
  const privacyCrowd = toPrivacyCrowdLabel(insights);
  const buyerFit = toBuyerFitLabel(insights);
  const stageLabel = insights.stageOfDevelopment === "ready" ? "Ready" : insights.stageOfDevelopment === "under-construction" ? "Under Construction" : "Early Stage";
  const hasRera = Boolean((project as any).rera_number || (project as any).rera_id);
  const microMarketName = project.micro_market?.micro_market_name || "this location";
  const configurationDisplayRaw = (project as any).configuration_display;
  const normalizedConfigurationDisplay =
    typeof configurationDisplayRaw === "string"
      ? configurationDisplayRaw
          .replace(/(\d+(?:\.\d+)?)\s*BHK/gi, "$1 BHK")
          .replace(/\s{2,}/g, " ")
          .trim()
      : "";
  const configurationDisplayValue =
    normalizedConfigurationDisplay.length > 0
      ? normalizedConfigurationDisplay
      : "Multiple configurations available";
  const communityLabel = "Apartments";
  const lifestyleSignals = getLifestyleSignals(project as unknown as Record<string, unknown>);
  const comparisonLine =
    density === "Low"
      ? `Compared with nearby communities in ${microMarketName}, this project appears less dense and usually more privacy-oriented.`
      : density === "High"
        ? `Compared with nearby communities in ${microMarketName}, this project appears denser and usually more amenity-active.`
        : `Compared with nearby communities in ${microMarketName}, this project appears balanced on density and daily comfort.`;
  const heroPrimaryLine = project.project_name;
  const heroSecondaryLine = `${communityLabel} in ${microMarketName} · Emerging Financial District corridor`;
  const communityStatement =
    totalUnits >= 1200 && lifestyleSignals.some((signal) => /open|gated|clubhouse/i.test(signal))
      ? "Large gated community with modern amenities and open spaces."
      : insights.positioningLabel === "premium"
        ? "Spacious homes designed for comfort and long-term living."
        : density === "high"
          ? "Active community with strong social and lifestyle infrastructure."
          : "Thoughtfully planned homes for comfort, privacy, and modern family living.";

  const towers = Number((project as any).total_towers ?? 0);
  const latitude = Number((project as any).latitude ?? 0);
  const longitude = Number((project as any).longitude ?? 0);
  const hasGeo = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;
  const microMarketIntelligenceText = String((project as any).micro_market_institutional_positioning ?? "").trim();
  const microMarketDisplayName =
    String((project as any).micro_market_name ?? "").trim() ||
    project.micro_market?.micro_market_name ||
    "Micro-market";
  const defaultThesisByMicroMarket: Record<string, string> = {
    tellapur:
      "Emerging residential corridor driven by Financial District employment and ORR connectivity. Strong mid- to upper-mid segment demand with significant ongoing supply.",
  };
  const fallbackMicroMarketThesis =
    defaultThesisByMicroMarket[microMarketDisplayName.toLowerCase()] ||
    "Micro-market demand and supply context is being standardized for this corridor.";
  const nearbySupplyCountRaw = Number((project as any).nearby_supply_within_2km);
  const nearbySupplyCount = Number.isFinite(nearbySupplyCountRaw) ? nearbySupplyCountRaw : null;
  const hasNearbySupply = nearbySupplyCount !== null && nearbySupplyCount > 0;
  const competitionLevel: "high" | "balanced" | "low" | "unavailable" = !hasNearbySupply
    ? "unavailable"
    : nearbySupplyCount > 100
      ? "high"
      : nearbySupplyCount >= 40
        ? "balanced"
        : "low";
  const nearbySupplyInterpretation =
    !hasNearbySupply
      ? "Supply intensity assessment is currently unavailable."
      : nearbySupplyCount > 100
        ? "High supply intensity. Competitive pricing and slower absorption likely in the near term."
        : nearbySupplyCount >= 40
          ? "Moderate supply environment with balanced competition."
          : "Low supply cluster with potential scarcity premium.";
  const corridorStrategyInsight =
    competitionLevel === "balanced"
      ? "Market structure supports both end-user demand and investor participation."
      : competitionLevel === "high"
        ? "Price sensitivity expected in the near term."
        : competitionLevel === "low"
          ? "Scarcity premium potential."
          : "Corridor strategy signal is currently unavailable.";
  const priceResilienceInsight =
    competitionLevel === "balanced"
      ? "Moderate resilience expected during market cycles."
      : competitionLevel === "high"
        ? "Short-term volatility possible."
        : competitionLevel === "low"
          ? "Strong resilience potential due to limited supply."
          : "Price resilience signal is currently unavailable.";
  const inventoryDominantConfigurationRaw = String((project as any).inventory_dominant_configuration ?? "").trim();
  const inventoryDominantConfiguration = inventoryDominantConfigurationRaw || "3 BHK";
  const inventoryTotalUnitsRaw = Number((project as any).inventory_total_planned_units);
  const inventoryTotalUnits = Number.isFinite(inventoryTotalUnitsRaw) ? inventoryTotalUnitsRaw : null;
  const inventoryDemandStrengthRaw = String((project as any).inventory_demand_strength ?? "").trim();
  const inventoryDemandStrength = inventoryDemandStrengthRaw || "Strong";
  const inventoryDemandInterpretationRaw = String((project as any).inventory_demand_interpretation ?? "").trim();
  const inventoryDemandInterpretation =
    inventoryDemandInterpretationRaw || "Strong end-user driven absorption observed in the configuration mix.";
  const configurationDistributionRaw = Array.isArray((project as any).configuration_distribution)
    ? (project as any).configuration_distribution
    : [];
  const configurationDistribution = configurationDistributionRaw
    .map((item: any) => ({
      configuration: String(item?.configuration ?? "").trim(),
      total_units: Number(item?.total_units ?? 0),
      supply_share_pct: Number(item?.supply_share_pct ?? 0),
    }))
    .filter(
      (item: { configuration: string; total_units: number; supply_share_pct: number }) =>
        item.configuration.length > 0 && Number.isFinite(item.total_units) && Number.isFinite(item.supply_share_pct)
    )
    .sort((a: { supply_share_pct: number }, b: { supply_share_pct: number }) => b.supply_share_pct - a.supply_share_pct);
  const configurationBucketRaw = configurationDistribution.reduce(
    (acc, row) => {
      const config = row.configuration.toLowerCase();
      if (/(\b|^)\s*2\s*bhk(\b|$)/.test(config)) {
        acc.twoBhk += row.supply_share_pct;
      } else if (/(\b|^)\s*3\s*bhk(\b|$)/.test(config)) {
        acc.threeBhk += row.supply_share_pct;
      } else {
        acc.other += row.supply_share_pct;
      }
      return acc;
    },
    { twoBhk: 0, threeBhk: 0, other: 0 }
  );
  const configurationBucketTotal =
    configurationBucketRaw.twoBhk + configurationBucketRaw.threeBhk + configurationBucketRaw.other;
  const configurationBucket =
    configurationBucketTotal > 0
      ? {
          twoBhk: (configurationBucketRaw.twoBhk / configurationBucketTotal) * 100,
          threeBhk: (configurationBucketRaw.threeBhk / configurationBucketTotal) * 100,
          other: (configurationBucketRaw.other / configurationBucketTotal) * 100,
        }
      : { twoBhk: 0, threeBhk: 0, other: 0 };
  const hasConfigurationDistribution = configurationDistribution.length > 0 && configurationBucketTotal > 0;
  const dominantDistributionConfig = configurationDistribution[0]?.configuration || "";
  const dominantDistributionShare = configurationDistribution[0]?.supply_share_pct ?? null;
  const configurationDistributionInterpretation =
    dominantDistributionShare !== null && dominantDistributionShare > 50
      ? "Supply concentration is strong in this configuration, supporting deep liquidity and stable exit potential."
      : "Diversified configuration mix supports broader buyer participation.";
  const dominantConfigForBuyerDepth = (dominantDistributionConfig || inventoryDominantConfiguration).toLowerCase();
  const buyerDepthInsight =
    /3\s*bhk/.test(dominantConfigForBuyerDepth)
      ? "Strong family end-user depth with upgrade-driven demand."
      : /1\s*bhk|2\s*bhk|studio/.test(dominantConfigForBuyerDepth)
        ? "High rental and investor participation expected."
        : "Balanced buyer depth across end-user and investor cohorts.";
  const secondaryDistributionShare = configurationDistribution[1]?.supply_share_pct ?? 0;
  const liquidityConcentrationInsight =
    dominantDistributionShare !== null && dominantDistributionShare > 60
      ? "Liquidity concentration is high within the dominant configuration, indicating deep but format-specific transaction depth."
      : dominantDistributionShare !== null && dominantDistributionShare >= 45
        ? "Liquidity concentration is moderate, with a clear lead configuration supported by secondary demand pools."
        : "Liquidity concentration is distributed, with transaction potential spread across multiple configurations.";
  const buyerDiversityInsight =
    configurationDistribution.length >= 3
      ? "Buyer diversity is broad, with participation across multiple end-user and investor cohorts."
      : "Buyer diversity is selective, with demand concentrated around fewer buyer cohorts.";
  const exitFlexibilityInsight =
    dominantDistributionShare !== null && dominantDistributionShare <= 55 && secondaryDistributionShare >= 20
      ? "Exit flexibility is balanced, supported by both primary and secondary configuration demand pools."
      : dominantDistributionShare !== null && dominantDistributionShare > 55
        ? "Exit flexibility is strongest within the dominant configuration and weaker outside core formats."
        : "Exit flexibility remains moderate with configuration-specific resale depth.";
  const absorptionResilienceInsight =
    dominantDistributionShare !== null && dominantDistributionShare <= 55 && secondaryDistributionShare >= 20
      ? "Absorption resilience is balanced, supported by multi-configuration demand participation."
      : dominantDistributionShare !== null && dominantDistributionShare > 55
        ? "Absorption resilience is strongest in the dominant format and can soften in non-core configurations."
        : "Absorption resilience is moderate, with demand response varying by configuration depth.";
  const executionStageRaw = String((project as any).execution_stage ?? "").trim();
  const executionStage = executionStageRaw || "Near completion stage.";
  const executionTimelineRiskRaw = String((project as any).execution_timeline_risk ?? "").trim();
  const executionTimelineRisk = executionTimelineRiskRaw || "Low timeline risk.";
  const executionCapitalLockInRiskRaw = String((project as any).execution_capital_lock_in_risk ?? "").trim();
  const executionCapitalLockInRisk = executionCapitalLockInRiskRaw || "Lower capital lock-in risk.";
  const executionInterpretationRaw = String((project as any).execution_interpretation ?? "").trim();
  const executionInterpretation =
    executionInterpretationRaw ||
    "Execution visibility is strong. Suitable for buyers prioritizing delivery certainty and capital protection.";
  const rawInstitutionalIdentity = (project as any).project_institutional_identity;
  const institutionalIdentity =
    typeof rawInstitutionalIdentity === "string"
      ? (() => {
          try {
            return JSON.parse(rawInstitutionalIdentity);
          } catch {
            return null;
          }
        })()
      : rawInstitutionalIdentity && typeof rawInstitutionalIdentity === "object"
        ? rawInstitutionalIdentity
        : null;
  const developerBrand =
    String(
      institutionalIdentity?.developer_brand ??
        institutionalIdentity?.brand_name ??
        institutionalIdentity?.unified_brand ??
        displayDeveloperName ??
        "Developer brand"
    ).trim();
  const isInstitutional = Boolean(
    institutionalIdentity?.is_institutional === true ||
      String(institutionalIdentity?.is_institutional ?? "").toLowerCase() === "true"
  );
  const institutionalClassification = isInstitutional
    ? "Institutional-grade developer with established brand credibility."
    : "Institutional classification under review.";
  const institutionalInterpretation =
    "Strong brand positioning and execution visibility support buyer confidence.";
  const institutionalContext =
    "Projects are executed under multiple legal entities but consolidated under a unified brand umbrella.";
  const capitalRentalDemandRaw = String((project as any).capital_rental_demand ?? "").trim();
  const capitalRentalDemand =
    capitalRentalDemandRaw || "Emerging rental demand driven by employment corridor expansion.";
  const capitalYieldEnvironmentRaw = String((project as any).capital_yield_environment ?? "").trim();
  const capitalYieldEnvironment =
    capitalYieldEnvironmentRaw || "Growing rental ecosystem with long-term income potential.";
  const capitalExitLiquidityRaw = String((project as any).capital_exit_liquidity ?? "").trim();
  const capitalExitLiquidity =
    capitalExitLiquidityRaw || "Moderate liquidity supported by strong end-user participation.";
  const capitalInterpretationRaw = String((project as any).capital_interpretation ?? "").trim();
  const capitalInterpretation =
    capitalInterpretationRaw ||
    "This micro-market is positioned for long-term capital appreciation as infrastructure and employment density expand.";
  const rentalDemandLower = capitalRentalDemand.toLowerCase();
  const capitalStrategyInsight = rentalDemandLower.includes("emerging")
    ? "Early-stage corridor with price discovery and long-term appreciation potential."
    : rentalDemandLower.includes("strong")
      ? "Income-focused investment with stable rental depth."
      : rentalDemandLower.includes("moderate")
        ? "Balanced long-term hold with stable capital preservation."
        : "Balanced long-term hold with stable capital preservation.";
  const investorSuitability = rentalDemandLower.includes("strong")
    ? "Suitable for rental-focused investors and income strategies."
    : rentalDemandLower.includes("emerging")
      ? "For long-term investors seeking early entry into emerging corridors."
      : "Suitable for long-term investors prioritizing balanced capital preservation.";
  const nearbyProjectsRaw = Number((project as any).nearby_projects);
  const nearbyProjects = Number.isFinite(nearbyProjectsRaw) ? nearbyProjectsRaw : null;
  const competitionIntensityRaw = String((project as any).competition_intensity ?? "").trim();
  const competitionIntensity = competitionIntensityRaw || "Balanced competitive environment in this micro-market.";
  const marketSaturationRaw = String((project as any).market_saturation ?? "").trim();
  const marketSaturation = marketSaturationRaw || "Balanced supply environment with measured corridor saturation.";
  const competitionPricingPowerRaw = String((project as any).competition_pricing_power_outlook ?? "").trim();
  const competitionPricingPowerOutlook =
    competitionPricingPowerRaw || "Pricing power remains balanced across comparable inventory cohorts.";
  const competitionAbsorptionVelocityRaw = String((project as any).competition_absorption_velocity ?? "").trim();
  const competitionAbsorptionVelocity =
    competitionAbsorptionVelocityRaw || "Absorption velocity remains stable with steady end-user participation.";
  const competitionDeveloperDifferentiationRaw = String((project as any).competition_developer_differentiation ?? "").trim();
  const competitionDeveloperDifferentiation =
    competitionDeveloperDifferentiationRaw || "Developer differentiation is primarily execution-led within current supply structure.";
  const relativeValuePositioningRaw = String((project as any).relative_value_positioning ?? "").trim();
  const normalizedPositioning = relativeValuePositioningRaw.toLowerCase();
  const relativeValuePositioning =
    normalizedPositioning.includes("premium")
      ? "Premium"
      : normalizedPositioning.includes("value")
        ? "Value"
        : normalizedPositioning.includes("market")
          ? "Market"
          : "Market";
  const relativeValueStageVsCorridorRaw = String((project as any).relative_value_stage_vs_corridor ?? "").trim();
  const relativeValueStageVsCorridor =
    relativeValueStageVsCorridorRaw ||
    (insights.stageOfDevelopment === "ready"
      ? "Ahead of corridor execution curve."
      : insights.stageOfDevelopment === "under-construction"
        ? "Aligned with corridor delivery cycle."
        : "Earlier than corridor completion cycle.");
  const relativeValueDensityVsCompetitorsRaw = String((project as any).relative_value_density_vs_competitors ?? "").trim();
  const relativeValueDensityVsCompetitors =
    relativeValueDensityVsCompetitorsRaw ||
    (insights.densityCategory === "high"
      ? "Higher density than corridor competitors."
      : insights.densityCategory === "low"
        ? "Lower density than corridor competitors."
        : "Density aligned with corridor competitors.");
  const relativeValueConfigurationVsCorridorRaw = String((project as any).relative_value_configuration_vs_corridor ?? "").trim();
  const relativeValueConfigurationVsCorridor =
    relativeValueConfigurationVsCorridorRaw ||
    `${inventoryDominantConfiguration} is the dominant internal mix benchmark for corridor comparison.`;
  const relativeValueEntryAttractivenessRaw = String((project as any).relative_value_entry_attractiveness ?? "").trim();
  const relativeValueEntryAttractiveness =
    relativeValueEntryAttractivenessRaw ||
    (relativeValuePositioning === "Value"
      ? "Entry attractiveness is favorable relative to corridor pricing depth."
      : relativeValuePositioning === "Market"
        ? "Entry attractiveness is balanced within prevailing corridor pricing bands."
        : "Entry attractiveness is selective and depends on premium absorption depth.");
  const relativeValueUpsideRaw = String((project as any).relative_value_upside ?? "").trim();
  const relativeValueUpside =
    relativeValueUpsideRaw ||
    (relativeValuePositioning === "Value"
      ? "Upside potential is stronger if corridor pricing converges toward mid-band comparables."
      : relativeValuePositioning === "Market"
        ? "Upside potential is moderate with cycle-linked repricing."
        : "Upside potential is execution-sensitive and linked to sustained premium demand.");
  const pricingCorridorBandRaw = String((project as any).pricing_corridor_price_band ?? "").trim();
  const pricingRelativePositioningRaw = String((project as any).pricing_relative_positioning ?? "").trim();
  const pricingEntryTimingRaw = String((project as any).pricing_entry_timing ?? "").trim();
  const pricingEarlyEntryVsMatureRaw = String((project as any).pricing_early_entry_vs_mature ?? "").trim();
  const pricingDiscoveryStageRaw = String((project as any).pricing_discovery_stage ?? "").trim();
  const pricingUpsideWindowRaw = String((project as any).pricing_upside_window ?? "").trim();
  const futureSupplyTimelineRaw = Array.isArray((project as any).future_supply_timeline)
    ? (project as any).future_supply_timeline
    : [];
  const futureSupplyTimeline = futureSupplyTimelineRaw
    .map((item: any) => ({
      year: Number(item?.year),
      count: Number(item?.count),
    }))
    .filter((item: { year: number; count: number }) => Number.isFinite(item.year) && Number.isFinite(item.count))
    .sort((a: { year: number }, b: { year: number }) => a.year - b.year)
    .slice(0, 10);
  const totalFutureSupply = futureSupplyTimeline.reduce((sum: number, item: { count: number }) => sum + item.count, 0);
  const futurePeakWave = futureSupplyTimeline.reduce<{ year: number; count: number } | null>(
    (acc, item) => (!acc || item.count > acc.count ? item : acc),
    null
  );
  const peakShare = futurePeakWave && totalFutureSupply > 0 ? futurePeakWave.count / totalFutureSupply : 0;
  const minLandmarkDistanceKm = hasGeo
    ? Math.min(...HYDERABAD_LANDMARKS.map((landmark) => distanceInKm(latitude, longitude, landmark.lat, landmark.lng)))
    : null;
  const executionSignal = `${executionStage} ${executionTimelineRisk} ${institutionalClassification}`.toLowerCase();
  const developerExecutionScore = scoreFromSignal(
    executionSignal,
    [
      { pattern: /institutional-grade|strong|low timeline risk|near completion|ready|stable/, score: 80 },
      { pattern: /balanced|steady|moderate|under construction|active delivery/, score: 64 },
      { pattern: /weak|high timeline risk|early|selective|under review|watch/, score: 42 },
    ],
    58
  );
  const locationSignal = `${microMarketIntelligenceText || fallbackMicroMarketThesis}`.toLowerCase();
  const baseLocationScore =
    minLandmarkDistanceKm === null ? 54 : minLandmarkDistanceKm <= 8 ? 78 : minLandmarkDistanceKm <= 15 ? 68 : 58;
  const locationScore = Math.min(
    88,
    baseLocationScore +
      (locationSignal.includes("strong") || locationSignal.includes("driven") || locationSignal.includes("connectivity")
        ? 4
        : 0)
  );
  const liquiditySignal = `${capitalExitLiquidity} ${competitionAbsorptionVelocity} ${inventoryDemandStrength}`.toLowerCase();
  const liquidityScore = scoreFromSignal(
    liquiditySignal,
    [
      { pattern: /strong|stable|deep|high|resilient/, score: 76 },
      { pattern: /balanced|moderate|steady/, score: 62 },
      { pattern: /low|weak|selective|constrained|volatile/, score: 44 },
    ],
    57
  );
  const supplyScore =
    peakShare >= 0.45 || (nearbySupplyCount !== null && nearbySupplyCount > 100)
      ? 44
      : nearbySupplyCount !== null && nearbySupplyCount >= 40
        ? 60
        : nearbySupplyCount !== null && nearbySupplyCount > 0
          ? 72
          : 56;
  const competitionSignal = `${competitionIntensity} ${marketSaturation}`.toLowerCase();
  const competitionScore = scoreFromSignal(
    competitionSignal,
    [
      { pattern: /high|intense|saturated/, score: 44 },
      { pattern: /balanced|moderate/, score: 64 },
      { pattern: /low|contained|measured/, score: 70 },
    ],
    58
  );
  const pricingCorridorBand =
    pricingCorridorBandRaw ||
    "Corridor pricing band is being standardized against active comparables.";
  const pricingRelativePositioning =
    pricingRelativePositioningRaw ||
    (relativeValuePositioning === "Premium"
      ? "Priced above corridor median benchmarks."
      : relativeValuePositioning === "Value"
        ? "Priced below corridor median benchmarks."
        : "Priced close to corridor median benchmarks.");
  const pricingEntryTiming =
    pricingEntryTimingRaw ||
    (peakShare >= 0.45
      ? "Entry timing favors selective accumulation before concentrated supply waves."
      : "Entry timing supports phased deployment through staggered supply release.");
  const pricingEarlyEntryVsMature =
    pricingEarlyEntryVsMatureRaw ||
    (relativeValuePositioning === "Value"
      ? "Current price level reflects early-entry characteristics with room for corridor convergence."
      : relativeValuePositioning === "Premium"
        ? "Current level reflects mature pricing behavior with tighter re-rating headroom."
        : "Current level sits between early-entry and mature pricing states.");
  const pricingDiscoveryStage =
    pricingDiscoveryStageRaw ||
    (supplyScore <= 50
      ? "Price discovery is active, with benchmark recalibration likely around delivery waves."
      : "Price discovery appears stable with narrower benchmark volatility.");
  const pricingUpsideWindow =
    pricingUpsideWindowRaw ||
    (relativeValuePositioning === "Value"
      ? "Upside window is wider if absorption remains resilient through supply normalization."
      : relativeValuePositioning === "Market"
        ? "Upside window is moderate and cycle-dependent."
        : "Upside window is narrower and depends on sustained premium demand depth.");
  const confidenceFactors: Array<{ label: string; score: number }> = [
    { label: "Developer execution", score: developerExecutionScore },
    { label: "Location", score: locationScore },
    { label: "Liquidity", score: liquidityScore },
    { label: "Supply", score: supplyScore },
    { label: "Competition", score: competitionScore },
  ];
  const institutionalConfidenceScore = Math.round(
    developerExecutionScore * 0.28 + locationScore * 0.2 + liquidityScore * 0.22 + supplyScore * 0.15 + competitionScore * 0.15
  );
  const institutionalConfidenceBand =
    institutionalConfidenceScore >= 72 ? "High" : institutionalConfidenceScore >= 56 ? "Moderate" : "Selective";
  const strongestFactor =
    confidenceFactors.reduce((best, item) => (item.score > best.score ? item : best), confidenceFactors[0]) ?? null;
  const weakestFactor =
    confidenceFactors.reduce((worst, item) => (item.score < worst.score ? item : worst), confidenceFactors[0]) ?? null;
  const institutionalConfidenceExplanation = `Composite confidence is ${institutionalConfidenceBand.toLowerCase()} at ${institutionalConfidenceScore}/100. ${strongestFactor?.label ?? "Core"} is currently the strongest support (${strongestFactor?.score ?? 0}/100), while ${weakestFactor?.label ?? "risk concentration"} remains the key monitoring point (${weakestFactor?.score ?? 0}/100).`;
  const stageLower = `${executionStage} ${executionTimelineRisk}`.toLowerCase();
  const liquidityLower = `${capitalExitLiquidity} ${competitionAbsorptionVelocity}`.toLowerCase();
  const exitHorizon =
    stageLower.includes("near completion") || stageLower.includes("ready") || stageLower.includes("low timeline risk")
      ? "12-24 month exit horizon."
      : stageLower.includes("under construction") || stageLower.includes("active delivery")
        ? "24-36 month exit horizon."
        : "36+ month exit horizon with phased monitoring.";
  const liquidityWindows =
    peakShare >= 0.45
      ? "Liquidity windows are concentrated around selective pre-handover and late-absorption phases."
      : liquidityLower.includes("strong") || liquidityLower.includes("stable")
        ? "Liquidity windows remain open across phased holding periods with steadier turnover."
        : "Liquidity windows are conditional and should align with corridor absorption milestones.";
  const riskScenarios = [
    peakShare >= 0.45
      ? "Supply concentration scenario: higher delivery clustering can compress near-term resale spreads."
      : "Supply normalization scenario: staggered completions support smoother secondary liquidity.",
    stageLower.includes("high timeline risk") || stageLower.includes("early")
      ? "Execution drift scenario: delayed milestones can extend holding period and defer optimal exits."
      : "Execution stability scenario: milestone visibility supports more predictable liquidation sequencing.",
    competitionScore <= 50
      ? "Competition pressure scenario: elevated competitive intensity may require pricing discipline at exit."
      : "Competition balance scenario: moderate competitive intensity supports orderly price discovery at exit.",
  ];
  const institutionalTakeWhy =
    relativeValuePositioning === "Value"
      ? "This project exists to provide an entry-efficient format in a corridor with evolving pricing benchmarks."
      : relativeValuePositioning === "Premium"
        ? "This project exists as a premium-format anchor for buyers prioritizing execution visibility and brand depth."
        : "This project exists as a market-aligned product balancing livability depth and capital discipline.";
  const institutionalTakeRole =
    competitionScore <= 50
      ? "Its corridor role is selective: defend positioning through execution quality amid competitive supply."
      : competitionScore >= 64
        ? "Its corridor role is stabilizing: support orderly absorption within balanced competitive conditions."
        : "Its corridor role is transitional: participate in corridor depth while supply normalizes.";
  const institutionalTakeStrategic =
    institutionalConfidenceBand === "High"
      ? "Strategically, it supports stability-led allocation with clearer medium-term liquidity visibility."
      : institutionalConfidenceBand === "Moderate"
        ? "Strategically, it supports phased allocation with disciplined entry and monitored exits."
        : "Strategically, it fits selective exposure where pricing and execution checkpoints are actively monitored.";
  const riskAndUpsideSummary =
    `${riskScenarios[0]} ${riskScenarios[2]} ${pricingUpsideWindow}`;
  const demandSignalLower = `${inventoryDemandStrength} ${inventoryDemandInterpretation}`.toLowerCase();
  const demandSignalScore = scoreFromSignal(
    demandSignalLower,
    [
      { pattern: /strong|high|deep|resilient|broad/, score: 78 },
      { pattern: /balanced|moderate|steady/, score: 62 },
      { pattern: /low|weak|selective|constrained/, score: 44 },
    ],
    58
  );
  const timelineRiskSignal = `${executionTimelineRisk}`.toLowerCase();
  const timelineRiskScore = scoreFromSignal(
    timelineRiskSignal,
    [
      { pattern: /low|stable|strong|on track/, score: 78 },
      { pattern: /moderate|watch|steady/, score: 58 },
      { pattern: /high|elevated|delay|uncertain/, score: 36 },
    ],
    54
  );
  const toDecisionBand = (score: number): "High" | "Moderate" | "Selective" =>
    score >= 72 ? "High" : score >= 56 ? "Moderate" : "Selective";
  const decisionSignalTone = (
    score: number
  ): { text: string; bar: string; bg: string; dotOn: string; dotOff: string } => {
    if (score >= 72) {
      return {
        text: "text-emerald-300",
        bar: "bg-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-400/30",
        dotOn: "bg-emerald-300",
        dotOff: "bg-white/15",
      };
    }
    if (score >= 56) {
      return {
        text: "text-amber-300",
        bar: "bg-amber-400",
        bg: "bg-amber-500/10 border-amber-400/30",
        dotOn: "bg-amber-300",
        dotOff: "bg-white/15",
      };
    }
    return {
      text: "text-rose-300",
      bar: "bg-rose-400",
      bg: "bg-rose-500/10 border-rose-400/30",
      dotOn: "bg-rose-300",
      dotOff: "bg-white/15",
    };
  };
  const decisionSignals: Array<{ label: string; score: number; value: string }> = [
    {
      label: "Institutional confidence",
      score: institutionalConfidenceScore,
      value: `${institutionalConfidenceScore}/100`,
    },
    {
      label: "Demand signal",
      score: demandSignalScore,
      value: toDecisionBand(demandSignalScore),
    },
    {
      label: "Liquidity outlook",
      score: liquidityScore,
      value: toDecisionBand(liquidityScore),
    },
    {
      label: "Timeline risk",
      score: timelineRiskScore,
      value: toDecisionBand(timelineRiskScore),
    },
    {
      label: "Competition intensity",
      score: competitionScore,
      value: toDecisionBand(competitionScore),
    },
  ];
  const riskMeterSignals: Array<{ label: string; score: number }> = [
    { label: "Execution Risk", score: 100 - developerExecutionScore },
    { label: "Supply Risk", score: 100 - supplyScore },
    { label: "Liquidity Risk", score: 100 - liquidityScore },
    { label: "Pricing Risk", score: 100 - demandSignalScore },
  ];
  const chipTone = (
    text: string
  ): { border: string; bg: string; text: string; dot: string; meaning: string } => {
    const value = text.toLowerCase();
    if (/strong|high|deep|stable|low/.test(value)) {
      return {
        border: "border-emerald-300/60",
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        dot: "bg-emerald-500",
        meaning: "Stronger current signal.",
      };
    }
    if (/emerging|early/.test(value)) {
      return {
        border: "border-sky-300/60",
        bg: "bg-sky-50",
        text: "text-sky-800",
        dot: "bg-sky-500",
        meaning: "Early phase with evolving depth.",
      };
    }
    if (/moderate|balanced|active/.test(value)) {
      return {
        border: "border-amber-300/60",
        bg: "bg-amber-50",
        text: "text-amber-800",
        dot: "bg-amber-500",
        meaning: "Balanced but watch conditions.",
      };
    }
    if (/weak|low liquidity|high risk|selective|constrained|volatile/.test(value)) {
      return {
        border: "border-rose-300/60",
        bg: "bg-rose-50",
        text: "text-rose-800",
        dot: "bg-rose-500",
        meaning: "Higher caution signal.",
      };
    }
    return {
      border: "border-slate-300/60",
      bg: "bg-slate-50",
      text: "text-slate-800",
      dot: "bg-slate-500",
      meaning: "Signal available.",
    };
  };
  const shortToken = (value: string, fallback: string): string => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return fallback;
    const stopIndex = trimmed.search(/[.,;:]/);
    const firstChunk = stopIndex > 0 ? trimmed.slice(0, stopIndex) : trimmed;
    return firstChunk.length > 48 ? `${firstChunk.slice(0, 45).trim()}...` : firstChunk;
  };
  const marketHeatScore = Math.max(0, Math.min(100, 100 - competitionScore));
  const saturationHeatScore = scoreFromSignal(
    marketSaturation.toLowerCase(),
    [
      { pattern: /low|contained|limited/, score: 22 },
      { pattern: /balanced|moderate|measured/, score: 50 },
      { pattern: /high|saturated|intense/, score: 80 },
    ],
    52
  );
  const corridorDensityHeatScore = scoreFromSignal(
    density.toLowerCase(),
    [
      { pattern: /low/, score: 28 },
      { pattern: /balanced/, score: 52 },
      { pattern: /high/, score: 76 },
    ],
    50
  );
  const dominantConfigurationLower = inventoryDominantConfiguration.toLowerCase();
  const buyerSegmentInsight = /3\s*bhk/.test(dominantConfigurationLower)
    ? "Primary buyer segment: family end-users."
    : /2\s*bhk/.test(dominantConfigurationLower)
      ? "Primary buyer segment: investors and first-time buyers."
      : /(4|5)\s*bhk|luxury|penthouse|villa/.test(dominantConfigurationLower)
        ? "Primary buyer segment: HNI and upgrade buyers."
        : "Primary buyer segment: balanced end-user demand.";
  const investmentLocationConviction = microMarketIntelligenceText || fallbackMicroMarketThesis;
  const investmentDemandDepth = `Dominant configuration: ${inventoryDominantConfiguration}. ${buyerSegmentInsight}`;
  const investmentExecutionVisibility = `${executionStage} ${executionTimelineRisk}`.trim();
  const investmentCapitalOutlook = capitalInterpretation;
  const investmentInvestorSuitability = investorSuitability;
  const investmentSummaryNarrative = `This project is positioned in ${microMarketDisplayName} with structural demand support. ${investmentDemandDepth} Execution visibility remains ${executionTimelineRisk.toLowerCase()}, while capital outlook indicates ${capitalStrategyInsight.toLowerCase()} ${investmentInvestorSuitability}`;
  const connectivityDistances = HYDERABAD_LANDMARKS.map((landmark) => ({
    label: landmark.label,
    value: hasGeo
      ? `~${Math.max(1, Math.round(distanceInKm(latitude, longitude, landmark.lat, landmark.lng)))} km`
      : "Not available",
  }));
  const towersLabel = towers === 1 ? "Tower" : "Towers";
  const unitsLabel = totalUnits === 1 ? "Unit" : "Units";
  const towersUnitsValue =
    towers > 0 && totalUnits > 0
      ? `${towers} ${towersLabel} • ${totalUnits} ${unitsLabel}`
      : towers > 0
        ? `${towers} ${towersLabel}`
        : totalUnits > 0
          ? `${totalUnits} ${unitsLabel}`
          : "Scale on request";
  const topMetrics: Array<{ label: string; value: string }> = [
    { label: "Configuration", value: configurationDisplayValue },
    { label: "Total units", value: totalUnits > 0 ? `${totalUnits.toLocaleString("en-IN")} ${unitsLabel}` : towersUnitsValue },
    { label: "Possession", value: possessionText || "Timeline on request" },
    { label: "Price positioning", value: shortToken(project.price_range_text || "", "Market-aligned pricing") },
  ];
  const heroDecisionSignals: Array<{ label: string; value: string; tone: "good" | "watch" | "risk" }> = [
    {
      label: "Demand",
      value: shortToken(inventoryDemandStrength, "Strong"),
      tone: /strong|deep|resilient/i.test(inventoryDemandStrength) ? "good" : "watch",
    },
    {
      label: "Competition",
      value: shortToken(competitionIntensity, "High"),
      tone: /high|intense|elevated/i.test(competitionIntensity) ? "risk" : /low|contained/i.test(competitionIntensity) ? "good" : "watch",
    },
    {
      label: "Execution",
      value: shortToken(executionStage, "Near completion"),
      tone: /near completion|ready|completed/i.test(executionStage) ? "good" : "watch",
    },
    {
      label: "Entry phase",
      value: shortToken(pricingEntryTiming, "Active"),
      tone: /active|phased|balanced/i.test(pricingEntryTiming) ? "watch" : "good",
    },
  ];
  const allSignalCards: Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
  }> = [
    { icon: Gauge, label: "Livability", value: livability },
    { icon: ShieldCheck, label: "Execution risk", value: executionRisk },
    { icon: Building2, label: "Density", value: density },
    { icon: Users, label: "Buyer fit", value: buyerFit },
    { icon: CircleDot, label: "Privacy / crowd", value: privacyCrowd },
  ];
  const signalPriorityByIntent: Record<ListingIntent, string[]> = {
    investment: ["Execution risk", "Density", "Buyer fit", "Livability", "Privacy / crowd"],
    "end-use": ["Livability", "Privacy / crowd", "Buyer fit", "Execution risk", "Density"],
    upgrade: ["Buyer fit", "Livability", "Density", "Privacy / crowd", "Execution risk"],
    nri: ["Execution risk", "Buyer fit", "Livability", "Density", "Privacy / crowd"],
  };
  const signalCards = signalPriorityByIntent[intent]
    .map((label) => allSignalCards.find((signal) => signal.label === label))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const intentSummaryByType: Record<ListingIntent, string> = {
    investment: "Advisory focus: rental comfort, delivery visibility, and long-term value potential.",
    "end-use": "Advisory focus: daily comfort, commute practicality, and long-term family livability.",
    upgrade: "Advisory focus: lifestyle uplift, better configuration quality, and everyday convenience.",
    nri: "Advisory focus: stable delivery, developer credibility, and low-friction ownership confidence.",
  };

  return (
    <>
      <div className="flex flex-col gap-8">
      <section className="order-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Investment Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{investmentSummaryNarrative}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Location conviction</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">{investmentLocationConviction}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Demand depth</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">{investmentDemandDepth}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Execution visibility</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">{investmentExecutionVisibility}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Capital outlook</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">{investmentCapitalOutlook}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Investor suitability</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">{investmentInvestorSuitability}</p>
          </div>
        </div>
      </section>
      <section className="order-1 relative w-full overflow-visible rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-8 text-slate-100 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)] sm:px-8 sm:py-10 lg:min-h-[460px] lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.06)_0%,rgba(15,23,42,0)_45%,rgba(99,102,241,0.1)_100%)]" />
          <div className="absolute inset-0 hidden sm:block bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:38px_38px]" />
        </div>
        <div className="relative">
          <div className="flex h-full flex-col gap-5 sm:gap-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                Institutional-grade residential corridor
              </div>
              <h1 className="font-semibold leading-[1.04] tracking-tight">
                <span className="block text-[2.15rem] tracking-[-0.015em] text-white sm:text-4xl lg:text-[2.9rem]">
                  {heroPrimaryLine}
                </span>
              </h1>
              <p className="text-sm font-medium text-slate-300 sm:text-base">{heroSecondaryLine}</p>
            </div>
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch lg:gap-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="group min-w-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.3)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-300">{metric.label}</p>
                    <p className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-white sm:text-xl">{metric.value}</p>
                  </div>
                ))}
              </div>
              <aside className="hidden h-full rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-[2px] lg:flex lg:flex-col lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">Decision signals</p>
                  <div className="mt-3 space-y-2.5">
                    {heroDecisionSignals.map((signal) => {
                      const toneClass =
                        signal.tone === "good"
                          ? "bg-emerald-400"
                          : signal.tone === "risk"
                            ? "bg-rose-400"
                            : "bg-amber-400";
                      return (
                        <div key={signal.label} className="flex items-center justify-between rounded-lg border border-white/15 bg-white/8 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${toneClass}`} />
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{signal.label}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">{signal.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <a
                    href="#advisor-concierge-desk"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Get Advisor-Led Support
                  </a>
                  <p className="text-center text-[11px] text-slate-300">Advised by corridor specialists</p>
                </div>
              </aside>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  hasRera
                    ? "border border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                    : "border border-amber-300/30 bg-amber-400/10 text-amber-100"
                }`}
                title={hasRera ? "Telangana RERA Verified Project" : "Telangana RERA verification status in progress"}
              >
                <ShieldCheck className="h-3 w-3" />
                {hasRera ? "TS RERA Registered" : "Under RERA Verification"}
              </span>
            </div>
            {lifestyleSignals.length > 0 ? (
              <div className="relative mt-4 -mx-5 sm:mx-0">
                <div className="px-4 pb-4 pb-[env(safe-area-inset-bottom)] sm:px-0 sm:pb-2">
                  <div className="flex min-w-max gap-2 overflow-x-auto whitespace-nowrap snap-x snap-mandatory pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {lifestyleSignals.map((signal) => (
                      <span
                        key={signal}
                        className="inline-flex min-w-max snap-start whitespace-nowrap rounded-full border border-white/10 bg-white/8 px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 sm:hidden">Swipe for more</p>
                </div>
                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-slate-900/85 to-transparent sm:hidden" />
              </div>
            ) : null}
            <details className="lg:hidden rounded-xl border border-white/15 bg-white/10 p-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                Decision signals
              </summary>
              <div className="mt-3 space-y-2">
                {heroDecisionSignals.map((signal) => {
                  const toneClass =
                    signal.tone === "good"
                      ? "bg-emerald-400"
                      : signal.tone === "risk"
                        ? "bg-rose-400"
                        : "bg-amber-400";
                  return (
                    <div key={signal.label} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${toneClass}`} />
                        <p className="text-xs text-slate-300">{signal.label}</p>
                      </div>
                      <p
                        className={
                          signal.label === "Entry phase"
                            ? "text-xs font-medium text-white"
                            : "text-sm font-semibold text-white"
                        }
                      >
                        {signal.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
      </section>
      <section className="order-2 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Decision Dashboard</h3>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">10s decision view</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {decisionSignals.map((signal) => {
            const tone = decisionSignalTone(signal.score);
            const dotsOn = signal.score >= 72 ? 3 : signal.score >= 56 ? 2 : 1;
            return (
              <div key={signal.label} className={`rounded-lg border p-3 ${tone.bg}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">{signal.label}</p>
                <p className={`mt-1 text-lg font-semibold leading-none ${tone.text}`}>{signal.value}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${tone.bar}`} style={{ width: `${Math.max(8, Math.min(100, signal.score))}%` }} />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={`${signal.label}-${index}`}
                      className={`h-1.5 w-4 rounded-full ${index < dotsOn ? tone.dotOn : tone.dotOff}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="order-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Project Risk Meter</h3>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Low to high risk</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {riskMeterSignals.map((item) => {
            const riskScore = Math.max(0, Math.min(100, item.score));
            const barClass = riskScore >= 66 ? "bg-rose-500" : riskScore >= 40 ? "bg-amber-500" : "bg-emerald-500";
            const riskBand = riskScore >= 66 ? "High" : riskScore >= 40 ? "Moderate" : "Low";
            return (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <p className="font-medium text-slate-600">{riskBand}</p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${barClass}`} style={{ width: `${riskScore}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="order-9 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Location & Connectivity</h3>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{microMarketDisplayName}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {microMarketIntelligenceText || fallbackMicroMarketThesis}
          </p>
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <p
            className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            title="Radius adjusted based on micro-market density."
          >
            Nearby Supply Intelligence
          </p>
          <p className="mt-1 text-[12px] text-slate-600">
            Active competing supply within a dynamically calibrated corridor radius.
          </p>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {hasNearbySupply ? nearbySupplyCount : "—"}
          </div>
          <p className="mt-0.5 text-[12px] font-medium text-slate-500">Nearby competing projects</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {hasNearbySupply ? nearbySupplyInterpretation : "Supply intelligence is being calibrated for this corridor."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Corridor Strategy Insight: {corridorStrategyInsight}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Price Resilience Insight: {priceResilienceInsight}
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {hasGeo ? (
            <LocationConnectivityMap latitude={latitude} longitude={longitude} projectName={project.project_name} />
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500">
              Map preview unavailable
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {connectivityDistances.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="order-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Configuration & Inventory Intelligence</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dominant Configuration</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">
              {inventoryDominantConfiguration} dominates the configuration mix in this project.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">{buyerSegmentInsight}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Indicates strong family end-user demand and long-term liquidity.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total Inventory</p>
            {inventoryTotalUnits !== null ? (
              <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">
                Total planned residential units: {inventoryTotalUnits.toLocaleString("en-IN")}
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">
                Inventory data under calibration.
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Large inventory depth supports sustained market participation.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Large scale development with sustained long-term supply visibility.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Based on Telangana RERA registered project disclosures.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Demand Signal</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-slate-900">
              Demand Strength: {inventoryDemandStrength}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{inventoryDemandInterpretation}</p>
          </div>
        </div>
      </section>
      <section className="order-[12] rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Configuration Distribution</h3>
        <div className="mt-4 space-y-3">
          {hasConfigurationDistribution ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="flex h-full w-full">
                    <div className="bg-sky-500" style={{ width: `${configurationBucket.twoBhk}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${configurationBucket.threeBhk}%` }} />
                    <div className="bg-amber-500" style={{ width: `${configurationBucket.other}%` }} />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">2 BHK</p>
                    <p className="mt-1 text-sm font-semibold text-sky-900">{configurationBucket.twoBhk.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">3 BHK</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-900">{configurationBucket.threeBhk.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Other Configurations</p>
                    <p className="mt-1 text-sm font-semibold text-amber-900">{configurationBucket.other.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              Configuration distribution data is currently unavailable for this project.
            </div>
          )}
          {hasConfigurationDistribution ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              {configurationDistributionInterpretation}
            </p>
          ) : null}
          {hasConfigurationDistribution ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              Buyer depth insight: {buyerDepthInsight}
            </p>
          ) : null}
          {hasConfigurationDistribution ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Liquidity concentration
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{liquidityConcentrationInsight}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Buyer diversity</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{buyerDiversityInsight}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Exit flexibility</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{exitFlexibilityInsight}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Absorption resilience
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{absorptionResilienceInsight}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="order-10 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Competitive Positioning</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Competing Projects</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-900">
              {nearbyProjects !== null
                ? `${nearbyProjects.toLocaleString("en-IN")} competing projects in this corridor.`
                : "Competing project count is under review."}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Competition Intensity</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-900">{competitionIntensity}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Market Saturation</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-900">{marketSaturation}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Competition heat", score: marketHeatScore },
            { label: "Corridor density", score: corridorDensityHeatScore },
            { label: "Saturation level", score: saturationHeatScore },
          ].map((metric) => {
            const barClass = metric.score >= 66 ? "bg-rose-500" : metric.score >= 40 ? "bg-amber-500" : "bg-emerald-500";
            const level = metric.score >= 66 ? "High" : metric.score >= 40 ? "Moderate" : "Low";
            return (
              <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="text-xs font-medium text-slate-700">{level}</p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${barClass}`} style={{ width: `${metric.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-600">Learn More</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <p className="text-sm leading-relaxed text-slate-700">{competitionPricingPowerOutlook}</p>
            <p className="text-sm leading-relaxed text-slate-700">{competitionAbsorptionVelocity}</p>
            <p className="text-sm leading-relaxed text-slate-700">{competitionDeveloperDifferentiation}</p>
          </div>
        </details>
      </section>
      <section className="order-[12] rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Relative Value in Corridor</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: TrendingUp, label: "Positioning", value: relativeValuePositioning, detail: relativeValueConfigurationVsCorridor },
            { icon: Clock3, label: "Stage vs corridor", value: shortToken(relativeValueStageVsCorridor, "Aligned"), detail: relativeValueStageVsCorridor },
            { icon: BarChart3, label: "Density vs competitors", value: shortToken(relativeValueDensityVsCompetitors, "Balanced"), detail: relativeValueDensityVsCompetitors },
            { icon: Gauge, label: "Entry attractiveness", value: shortToken(relativeValueEntryAttractiveness, "Balanced"), detail: relativeValueEntryAttractiveness },
            { icon: TrendingUp, label: "Upside", value: shortToken(relativeValueUpside, "Moderate"), detail: relativeValueUpside },
          ].map((chip) => {
            const tone = chipTone(chip.value);
            const Icon = chip.icon;
            return (
              <div key={chip.label} className={`rounded-full border px-3 py-2 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 self-center ${tone.text}`} />
                  <p className="leading-none text-[10px] font-semibold uppercase tracking-wide text-slate-600">{chip.label}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  <p className={`leading-none text-sm font-semibold ${tone.text}`}>{chip.value}</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{tone.meaning}</p>
              </div>
            );
          })}
        </div>
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-600">Learn More</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-slate-700">{relativeValueEntryAttractiveness}</p>
            <p className="text-sm leading-relaxed text-slate-700">{relativeValueUpside}</p>
          </div>
        </details>
      </section>
      <section className="order-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Pricing & Entry Strategy</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BarChart3, label: "Corridor price band", value: shortToken(pricingCorridorBand, "Standardized"), detail: pricingCorridorBand },
            { icon: TrendingUp, label: "Relative positioning", value: shortToken(pricingRelativePositioning, "Aligned"), detail: pricingRelativePositioning },
            { icon: Clock3, label: "Entry timing", value: shortToken(pricingEntryTiming, "Phased"), detail: pricingEntryTiming },
            { icon: Gauge, label: "Early vs mature", value: shortToken(pricingEarlyEntryVsMature, "Balanced"), detail: pricingEarlyEntryVsMature },
            { icon: AlertTriangle, label: "Price discovery", value: shortToken(pricingDiscoveryStage, "Stable"), detail: pricingDiscoveryStage },
            { icon: TrendingUp, label: "Upside window", value: shortToken(pricingUpsideWindow, "Moderate"), detail: pricingUpsideWindow },
          ].map((chip) => {
            const tone = chipTone(chip.value);
            const Icon = chip.icon;
            return (
              <div key={chip.label} className={`rounded-full border px-3 py-2 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 self-center ${tone.text}`} />
                  <p className="leading-none text-[10px] font-semibold uppercase tracking-wide text-slate-600">{chip.label}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  <p className={`leading-none text-sm font-semibold ${tone.text}`}>{chip.value}</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{tone.meaning}</p>
              </div>
            );
          })}
        </div>
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-600">Learn More</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <p className="text-sm leading-relaxed text-slate-700">{pricingEarlyEntryVsMature}</p>
            <p className="text-sm leading-relaxed text-slate-700">{pricingDiscoveryStage}</p>
            <p className="text-sm leading-relaxed text-slate-700">{pricingUpsideWindow}</p>
          </div>
        </details>
      </section>
      <section className="order-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Exit & Liquidity Strategy</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { icon: Clock3, label: "Exit horizon", value: shortToken(exitHorizon, "Phased"), detail: exitHorizon },
            { icon: Droplets, label: "Liquidity windows", value: shortToken(liquidityWindows, "Conditional"), detail: liquidityWindows },
            { icon: AlertTriangle, label: "Risk scenarios", value: "Scenario mapped", detail: "Supply, execution, and competition scenarios captured." },
          ].map((chip) => {
            const tone = chipTone(chip.value);
            const Icon = chip.icon;
            return (
              <div key={chip.label} className={`rounded-full border px-3 py-2 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 self-center ${tone.text}`} />
                  <p className="leading-none text-[10px] font-semibold uppercase tracking-wide text-slate-600">{chip.label}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  <p className={`leading-none text-sm font-semibold ${tone.text}`}>{chip.value}</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{tone.meaning}</p>
              </div>
            );
          })}
        </div>
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-600">Learn More</summary>
          <div className="mt-2 grid gap-2">
            {riskScenarios.map((scenario) => (
              <p key={scenario} className="text-sm leading-relaxed text-slate-700">
                {scenario}
              </p>
            ))}
          </div>
        </details>
      </section>
      <section className="order-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Institutional Confidence</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Composite Score</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{institutionalConfidenceScore}/100</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{institutionalConfidenceBand}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {confidenceFactors.map((factor) => (
              <div key={factor.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{factor.label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{factor.score}/100</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
          {institutionalConfidenceExplanation}
        </p>
      </section>
      <section className="order-[12] rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Institutional Take</h3>
        <div className="mt-3 grid gap-2">
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">Why this project exists: </span>
            {institutionalTakeWhy}
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">Role in corridor: </span>
            {institutionalTakeRole}
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">Strategic importance: </span>
            {institutionalTakeStrategic}
          </p>
        </div>
      </section>
      <section className="order-11 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Execution & Delivery Intelligence</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Project Stage</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{executionStage}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Timeline Risk</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{executionTimelineRisk}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Capital Lock-in</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{executionCapitalLockInRisk}</p>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
          {executionInterpretation}
        </p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Developer & Institutional Confidence
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Developer Brand: {developerBrand}.</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{institutionalClassification}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{institutionalInterpretation}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{institutionalContext}</p>
        </div>
      </section>
      <section className="order-[12] rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Capital & Investment Perspective</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            { icon: TrendingUp, label: "Rental demand", value: shortToken(capitalRentalDemand, "Emerging"), detail: capitalRentalDemand },
            { icon: BarChart3, label: "Yield environment", value: shortToken(capitalYieldEnvironment, "Growing"), detail: capitalYieldEnvironment },
            { icon: Droplets, label: "Exit liquidity", value: shortToken(capitalExitLiquidity, "Moderate"), detail: capitalExitLiquidity },
          ].map((chip) => {
            const tone = chipTone(chip.value);
            const Icon = chip.icon;
            return (
              <div key={chip.label} className={`rounded-full border px-3 py-2 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 shrink-0 self-center ${tone.text}`} />
                  <p className="leading-none text-[10px] font-semibold uppercase tracking-wide text-slate-600">{chip.label}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                  <p className={`leading-none text-sm font-semibold ${tone.text}`}>{chip.value}</p>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">{tone.meaning}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Liquidity Signal Bar</p>
            <p className="text-xs font-medium text-slate-600">
              {/strong/i.test(capitalExitLiquidity) ? "Deep" : /moderate|balanced/i.test(capitalExitLiquidity) ? "Active" : "Early phase"}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full ${
                /strong/i.test(capitalExitLiquidity)
                  ? "bg-emerald-500"
                  : /moderate|balanced/i.test(capitalExitLiquidity)
                    ? "bg-amber-500"
                    : "bg-sky-500"
              }`}
              style={{
                width: `${
                  /strong/i.test(capitalExitLiquidity)
                    ? 82
                    : /moderate|balanced/i.test(capitalExitLiquidity)
                      ? 58
                      : 36
                }%`,
              }}
            />
          </div>
        </div>
        <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-600">Learn More</summary>
          <div className="mt-2 grid gap-2">
            <p className="text-sm leading-relaxed text-slate-700">{capitalInterpretation}</p>
            <p className="text-sm leading-relaxed text-slate-700">Capital Strategy Insight: {capitalStrategyInsight}</p>
            <p className="text-sm leading-relaxed text-slate-700">Investor Suitability: {investorSuitability}</p>
          </div>
        </details>
      </section>
      <section className="order-5 rounded-xl border border-slate-200 bg-white p-4" data-advisory-section="trust-signals">
        <p className="text-sm font-semibold text-slate-900">Trust Signals</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {signalCards.map((signal) => {
            const Icon = signal.icon;
            return (
              <div
                key={signal.label}
                data-trust-signal={signal.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">{signal.label}</p>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900">{signal.value}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {hasRera ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">RERA verified</Badge> : null}
          <Badge variant="outline">{stageLabel}</Badge>
          <Badge variant="outline">{density} density</Badge>
          <Badge variant="outline">{buyerFit}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-700">{comparisonLine}</p>
        <p className="mt-2 text-xs text-slate-600">{intentSummaryByType[intent]}</p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project narrative in 20 seconds</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            <li>• Positioning: {insights.marketPositioning.label}</li>
            <li>• Best suited for: {buyerFit}</li>
            <li>• Delivery stage: {stageLabel}</li>
          </ul>
        </div>
      </section>
      <section className="order-12 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-semibold text-slate-900">Risk &amp; Upside</h3>
        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
          {riskAndUpsideSummary}
        </p>
      </section>
      <div className="order-[13]">
        <ProjectSocialProof
          intent={intent}
          microMarketName={microMarketName}
          stage={insights.stageOfDevelopment}
          corridorMaturity={insights.marketBaseline.corridorMaturityLevel}
        />
      </div>
      <div className="order-[14] lg:hidden">
        <ProjectStickyCard
          projectName={project.project_name}
          address={address}
          bhkConfig={(project as any).bhk_config}
          carpetArea={(project as any).carpet_area}
          possessionDate={(project as any).possession_date || (project as any).possession_date_text}
          configurationDisplay={(project as any).configuration_display}
          priceMin={(project as any).price_min}
          priceMax={(project as any).price_max}
          priceRangeText={project.price_range_text}
          reraNumber={(project as any).rera_number || (project as any).rera_id}
          developerName={displayDeveloperName}
        />
      </div>
      </div>
    </>
  );
}

interface DnaProps {
  project: ProjectWithRelations;
  insights: ProjectInsights;
  technicalSpecs: any;
  amenities: any;
  specifications: any;
  floorPlansRaw: any[];
  projectHighlights: any;
}

export function ProjectDNA({
  project,
  technicalSpecs,
  amenities,
  specifications,
  floorPlansRaw,
  projectHighlights,
}: DnaProps) {
  return (
    <>
      <ProjectDescription htmlContent={(project as any).long_description_html} />
      {projectHighlights ? <ProjectHighlights highlights={projectHighlights} /> : null}
      <div className="hidden md:block space-y-4">
        <TechnicalSpecsCard projectSnapshot={technicalSpecs} />
        <AmenitiesCard amenities={amenities} />
        {specifications &&
        ((Array.isArray(specifications) && specifications.length > 0) ||
          (typeof specifications === "object" && Object.keys(specifications).length > 0)) ? (
          <SpecificationsCard specifications={specifications} />
        ) : null}
        {floorPlansRaw && floorPlansRaw.length > 0 ? <FloorPlansGallery floorPlanImages={floorPlansRaw} /> : null}
      </div>
      <details className="md:hidden rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          View detailed specs, amenities and floor plans
        </summary>
        <div className="mt-4 space-y-4">
          <TechnicalSpecsCard projectSnapshot={technicalSpecs} />
          <AmenitiesCard amenities={amenities} />
          {specifications &&
          ((Array.isArray(specifications) && specifications.length > 0) ||
            (typeof specifications === "object" && Object.keys(specifications).length > 0)) ? (
            <SpecificationsCard specifications={specifications} />
          ) : null}
          {floorPlansRaw && floorPlansRaw.length > 0 ? <FloorPlansGallery floorPlanImages={floorPlansRaw} /> : null}
        </div>
      </details>
    </>
  );
}

interface BuyerFitProps {
  insights: ProjectInsights;
}

export function WhoShouldConsiderThisProject({ insights }: BuyerFitProps) {
  const upgradeConfidenceLine =
    insights.livability.band === "high"
      ? "Upgrade families usually find stronger comfort continuity here for schooling, daily commute, and long-hold living."
      : "For upgrade planning, this profile benefits from checking school access, commute ease, and long-term community fit.";
  const communityStrengthLine =
    insights.densityCategory === "low"
      ? "Community rhythm is typically calmer and family-oriented."
      : insights.densityCategory === "high"
        ? "Community rhythm is more active and socially dynamic."
        : "Community rhythm is usually balanced for mixed household needs.";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Who Should Consider This Project</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-900">Ideal buyers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
            {insights.idealBuyers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">Not ideal buyers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {insights.notIdealBuyers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upgrade family confidence</p>
        <p className="mt-1 text-sm text-slate-700">{upgradeConfidenceLine}</p>
        <p className="mt-1 text-sm text-slate-600">{communityStrengthLine}</p>
      </div>
    </section>
  );
}

interface LocationInsightsProps {
  project: ProjectWithRelations;
  locationAdvantages: any;
  insights: ProjectInsights;
}

export function LocationInsights({ project, locationAdvantages, insights }: LocationInsightsProps) {
  const lines: string[] = Array.isArray(locationAdvantages)
    ? locationAdvantages.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 4)
    : typeof locationAdvantages === "object" && locationAdvantages !== null
      ? Object.values(locationAdvantages)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 4)
      : [];

  const commuteText =
    lines[0] || "Daily routes to major office and school corridors are typically manageable from this location.";
  const workHubText =
    lines[1] || "Work-driven demand is supported by nearby employment zones and steady tenant movement.";
  const lifestyleText =
    lines[2] || "Everyday retail, social infrastructure, and weekend conveniences are available within practical reach.";
  const buyerFitText = insights.buyerSegments[0] || "Balanced end-use and investor demand";

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Location Clarity</h3>
        <p className="mt-2 text-sm text-slate-700">
          This location is most suitable for {buyerFitText.toLowerCase()} because commute practicality, work access, and
          daily lifestyle needs are reasonably aligned.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Daily commute</p>
            <p className="mt-1 text-sm text-slate-700">
              {commuteText}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Work hubs</p>
            <p className="mt-1 text-sm text-slate-700">{workHubText}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Lifestyle access</p>
            <p className="mt-1 text-sm text-slate-700">{lifestyleText}</p>
          </div>
        </div>
        {project.micro_market?.hero_hook ? (
          <p className="mt-3 text-sm text-slate-600">Micro-market context: {project.micro_market.hero_hook}</p>
        ) : null}
      </section>
      <GoogleMapEmbed embedUrl={(project as any).google_maps_embed_url} />
      <LocationAdvantages
        locationAdvantages={locationAdvantages}
        locationHighlights={(project as any).location_highlights}
      />
    </>
  );
}

interface DensityInsightsProps {
  project: ProjectWithRelations;
  investmentAnalysis: any;
  insights: ProjectInsights;
}

export function DensityInsights({ project, investmentAnalysis }: DensityInsightsProps) {
  const units = Number((project as any).total_units ?? 0);
  const towers = Number((project as any).total_towers ?? 0);
  const unitsPerTower = units > 0 && towers > 0 ? Math.round(units / towers) : null;
  const densityProfile = projectInsightsDensityText(project);

  const guidance =
    densityProfile === "high-density"
      ? {
          privacy: "Privacy can feel tighter during peak hours, especially in shared amenities.",
          crowd: "Expect higher social energy and busier common areas.",
          openSpace: "Prioritize tower spacing and landscape usability when evaluating comfort.",
          livability: "Best for buyers comfortable with active communities and strong amenity turnover.",
        }
      : densityProfile === "low-density"
        ? {
            privacy: "Privacy is typically stronger due to lower resident load.",
            crowd: "Common areas usually feel calmer with lower peak congestion.",
            openSpace: "Open areas often feel more accessible on a day-to-day basis.",
            livability: "Best for buyers prioritizing quiet living and lower crowd pressure.",
          }
        : {
            privacy: "Privacy is usually balanced for most family living patterns.",
            crowd: "Crowd levels are generally manageable across weekdays and weekends.",
            openSpace: "Open space utility is often reasonable if landscaping is maintained well.",
            livability: "Works well for buyers seeking a practical balance of community and comfort.",
          };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Density and Livability</h3>
        <p className="mt-2 text-sm text-slate-700">
          {project.project_name} follows a {densityProfile} profile. This directly shapes daily privacy, crowd behavior,
          open-space experience, and long-term liveability for residents.
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p>Privacy: {guidance.privacy}</p>
          <p>Crowd pattern: {guidance.crowd}</p>
          <p>Open space: {(project as any).open_space_text || guidance.openSpace}</p>
          <p>Long-term livability: {guidance.livability}</p>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
          <p>Total units: {units > 0 ? units : "Not disclosed"}</p>
          <p>Units per tower: {unitsPerTower ? unitsPerTower : "Not disclosed"}</p>
        </div>
      </div>
      <WhyInvestSection investmentAnalysis={investmentAnalysis} projectName={project.project_name} />
    </section>
  );
}

function projectInsightsDensityText(project: ProjectWithRelations): string {
  const units = Number((project as unknown as Record<string, unknown>).total_units ?? 0);
  if (!Number.isFinite(units) || units <= 0) return "balanced-density";
  if (units >= 800) return "high-density";
  if (units >= 300) return "balanced-density";
  return "low-density";
}

interface ConfigurationInsightsProps {
  insights: ProjectInsights;
}

export function ConfigurationInsights({ insights }: ConfigurationInsightsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Configuration Insights</h3>
      <p className="mt-2 text-sm text-slate-700">{insights.configurationPositioning.summary}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
        <p>Unit focus: {insights.configurationPositioning.dominantConfig}</p>
        <p>Ticket range: Market-aligned for {insights.positioningLabel} buyers.</p>
        <p>Demand profile: {insights.buyerSegments[0] || "Balanced end-use demand"}.</p>
      </div>
    </section>
  );
}

interface DeveloperTrustProps {
  project: ProjectWithRelations;
  citySlug: string;
}

export function DeveloperTrust({ project, citySlug }: DeveloperTrustProps) {
  const developer = project.developer ?? null;
  if (!developer) return null;
  const displayDeveloperName =
    String((project as any).display_developer_name ?? developer.developer_name ?? (project as any).developer_name ?? "").trim() ||
    developer.developer_name;
  const years = Number(developer.years_in_business ?? 0);
  const projects = Number(developer.total_projects ?? 0);
  const executionCulture =
    years >= 15
      ? "Established execution culture with long-cycle market exposure."
      : years >= 8
        ? "Stable execution culture with meaningful operating history."
        : "Developing execution culture with active market participation.";
  const deliveryDiscipline =
    projects >= 20
      ? "Broad delivery footprint supports stronger delivery discipline visibility."
      : projects >= 8
        ? "Moderate project depth offers useful delivery discipline signals."
        : "Delivery discipline is best validated through project-level milestone consistency.";
  const segmentFocus =
    developer.tagline ||
    (String((project as any).price_range_text || "").toLowerCase().includes("cr")
      ? "Premium residential focus in key demand corridors."
      : "Family-led residential focus with practical livability orientation.");

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Developer Confidence</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <p>Track record: {developer.years_in_business ? `${developer.years_in_business}+ years` : "Established developer"}</p>
          <p>Delivery: {developer.total_projects ? `${developer.total_projects} tracked projects` : "Portfolio available on request"}</p>
          <p>Positioning: {developer.tagline || "Market-recognized residential brand"}</p>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why buyers trust this developer</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{executionCulture}</li>
            <li>{deliveryDiscipline}</li>
            <li>{segmentFocus}</li>
          </ul>
        </div>
      </section>
      <AboutDeveloperSection
        developerName={displayDeveloperName}
        citySlug={citySlug}
        developerSlug={developer.url_slug}
        logoUrl={developer.logo_url}
        tagline={developer.tagline}
        yearsInBusiness={developer.years_in_business}
        totalProjects={developer.total_projects}
        totalSftDelivered={(developer as any).total_sft_delivered}
        description={(developer as any).developer_profile_seo || developer.meta_description}
        notableProjects={
          developer.notable_projects_json &&
          Array.isArray(developer.notable_projects_json) &&
          developer.notable_projects_json.length > 0
            ? developer.notable_projects_json
                .map((p: any) => (typeof p === "string" ? p : p?.project_name))
                .filter(Boolean)
                .join(", ")
            : null
        }
      />
    </>
  );
}

interface RiskFactorsProps {
  project: ProjectWithRelations;
  insights: ProjectInsights;
}

export function RiskFactors({ project }: RiskFactorsProps) {
  const statusText = String((project as any).status ?? "").toLowerCase();
  const completionText = String((project as any).completion_status ?? "").toLowerCase();
  const stage =
    statusText.includes("ready") || completionText.includes("ready")
      ? "ready"
      : statusText.includes("under") || completionText.includes("construction")
        ? "under-construction"
        : "early-stage";
  const densityProfile = projectInsightsDensityText(project);
  const microMarketName = project.micro_market?.micro_market_name || "the micro-market";
  const developer = project.developer ?? null;

  const upsideSignals = [
    stage === "ready"
      ? "Ready or near-ready stage can reduce execution uncertainty for end-use decisions."
      : stage === "under-construction"
        ? "Construction-stage entry may offer better value for patient buyers."
        : "Early-stage entry can create pricing upside if delivery progress remains healthy.",
    densityProfile === "low-density"
      ? "Lower-density profile can support stronger liveability and privacy perception."
      : densityProfile === "balanced-density"
        ? "Balanced density can support both social vibrancy and everyday comfort."
        : "Higher density can improve amenity viability and rental liquidity in active corridors.",
    `Demand in ${microMarketName} remains linked to connectivity and employment-led absorption.`,
    developer?.years_in_business
      ? `Developer tenure (${developer.years_in_business}+ years) can improve delivery confidence.`
      : "Developer track record should be reviewed alongside current stage progress.",
  ];

  const watchOutSignals = [
    stage !== "ready" ? "Timeline variability is possible while construction milestones are still in progress." : "Ready-stage projects may offer less negotiation flexibility on entry pricing.",
    densityProfile === "high-density"
      ? "Peak-hour crowding can affect amenity comfort and privacy."
      : densityProfile === "low-density"
        ? "Lower resident load may reduce internal retail/social vibrancy."
        : "Review tower spacing and amenity load to validate day-to-day comfort.",
    `Supply additions in ${microMarketName} should be tracked to assess near-term price pressure.`,
    developer?.total_projects
      ? `Delivery consistency should be validated across the developer's ${developer.total_projects} tracked projects.`
      : "Where portfolio depth is limited, monitor execution updates more closely.",
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Risk and Upside</h3>
        <p className="mt-2 text-sm text-slate-700">
          A balanced view helps avoid overconfidence or overcaution. Use these signals as practical decision checks.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-emerald-700">Upside</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {upsideSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-700">Watch-outs</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {watchOutSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <WestsideVerdictSection review={(project as any).westside_realty_review} />
    </section>
  );
}

interface ComparisonInsightsProps {
  project: ProjectWithRelations;
  citySlug: string;
  insights: ProjectInsights;
  intent?: ListingIntent;
}

export function ComparisonInsights({ project, citySlug, insights, intent = "end-use" }: ComparisonInsightsProps) {
  const microMarket = project.micro_market ?? null;
  const densityProfile = projectInsightsDensityText(project);
  const densityComparison =
    densityProfile === "high-density"
      ? "Denser than many family-led communities in this corridor."
      : densityProfile === "low-density"
        ? "Lower-density than most volume-led projects in this corridor."
        : "Close to a balanced density profile for the corridor.";
  const config = insights.configurationPositioning.dominantConfig || "Not disclosed";
  const unitPositioning = config.includes("4")
    ? "Skews toward larger-format homes versus mid-market stock."
    : config.includes("2")
      ? "Leans toward practical, mid-market family inventory."
      : "Shows a mixed unit profile relative to typical inventory.";
  const stagePositioning =
    insights.stageOfDevelopment === "ready"
      ? "Execution risk is generally lower than under-construction peers."
      : insights.stageOfDevelopment === "under-construction"
        ? "Sits in the active delivery bucket with moderate execution watch."
        : "Earlier-stage positioning with higher timeline sensitivity.";
  const buyerSuitability =
    insights.idealBuyers.length > 0
      ? insights.idealBuyers.slice(0, 2).join(" and ")
      : "Balanced end-use and long-hold buyers";

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Comparison Snapshot</h3>
        <p className="mt-2 text-sm text-slate-700">
          A quick relative read versus typical projects in {microMarket?.micro_market_name || "this micro-market"}.
        </p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Density vs market</p>
            <p className="mt-1">{densityComparison}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Unit size positioning</p>
            <p className="mt-1">{unitPositioning}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Stage positioning</p>
            <p className="mt-1">{stagePositioning}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Buyer suitability</p>
            <p className="mt-1">Most aligned with {buyerSuitability.toLowerCase()}.</p>
          </div>
        </div>
      </section>
      {project.id ? (
        <SimilarProjects
          currentProjectId={String(project.id)}
          microMarketId={project.micro_market_id}
          priceMin={(project as any).price_min}
          priceMax={(project as any).price_max}
          citySlug={citySlug}
          microMarketSlug={microMarket?.url_slug || undefined}
        />
      ) : null}
      {microMarket ? (
        <section className="space-y-4">
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Micro-market context (collapsed)
            </summary>
            <div className="mt-4">
              <AboutMicroMarketSection
                microMarketName={microMarket.micro_market_name}
                citySlug={citySlug}
                microMarketSlug={microMarket.url_slug}
                heroHook={microMarket.hero_hook}
                growthStory={microMarket.growth_story}
                pricePerSqftMin={microMarket.price_per_sqft_min}
                pricePerSqftMax={microMarket.price_per_sqft_max}
                appreciationRate={microMarket.annual_appreciation_min}
              />
            </div>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Corridor story (collapsed)
            </summary>
            <div className="mt-4">
              <ProjectCorridorStory
                insights={insights}
                intent={intent}
                microMarketName={microMarket.micro_market_name}
              />
            </div>
          </details>
        </section>
      ) : null}
    </>
  );
}

interface ReraDataProps {
  project: ProjectWithRelations;
  faqs: any[];
}

export function RERAData({ project, faqs }: ReraDataProps) {
  return <ProjectFAQs faqs={faqs} projectName={project.project_name} />;
}

interface LeadCaptureProps {
  project: ProjectWithRelations;
  address: string;
  brochureUrl: string | null;
}

export function LeadCapture({ project, address, brochureUrl }: LeadCaptureProps) {
  const developer = project.developer ?? null;
  const displayDeveloperName =
    String((project as any).display_developer_name ?? developer?.developer_name ?? (project as any).developer_name ?? "").trim() ||
    null;
  const microMarketName = project.micro_market?.micro_market_name || null;
  const stageText = String((project as any).status || (project as any).completion_status || "").toLowerCase();
  const isReadyLike = stageText.includes("ready");
  const isEarlyLike = stageText.includes("launch") || stageText.includes("new");
  const demandContext = isReadyLike
    ? `Buyer activity in ${microMarketName || "this micro-market"} is healthy, and ready inventory is typically absorbed faster.`
    : isEarlyLike
      ? `Early buyer activity in ${microMarketName || "this micro-market"} is building, and selection quality matters at this stage.`
      : `Demand in ${microMarketName || "this micro-market"} remains active, with buyers closely comparing delivery confidence.`;

  return (
    <>
      <div className="hidden lg:block">
        <ProjectStickySidebar
          projectName={project.project_name}
          projectId={project.id}
          address={address}
          bhkConfig={(project as any).bhk_config}
          carpetArea={(project as any).carpet_area}
          possessionDate={(project as any).possession_date || (project as any).possession_date_text}
          configurationDisplay={(project as any).configuration_display}
          priceMin={(project as any).price_min}
          priceMax={(project as any).price_max}
          priceRangeText={project.price_range_text}
          reraNumber={(project as any).rera_number || (project as any).rera_id}
          developerName={displayDeveloperName}
          developerLogo={developer?.logo_url}
          brochureUrl={brochureUrl || undefined}
          microMarketName={microMarketName}
          demandContext={demandContext}
          advisoryYears={12}
          buyersHelped={1200}
        />
      </div>
    </>
  );
}
