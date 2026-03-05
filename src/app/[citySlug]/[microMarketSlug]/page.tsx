import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getMicroMarketFromCache, getMicroMarketMapCenter } from "@/services/microMarketCacheService";
// Keep import to satisfy any stale references; projects are fetched by ProjectsInMarketAsync
import { getProjectsFromView } from "@/services/microMarketProjectsService";
import { buildMicroMarketViewModel } from "@/services/microMarketViewModel";
import MicroMarketPageContent from "@/components/micro-market/MicroMarketPageContent";
import { buildMetadata } from "@/components/common/SEO";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ citySlug: string; microMarketSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam, microMarketSlug: mmSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const microMarketSlug = Array.isArray(mmSlugParam) ? mmSlugParam[0] : mmSlugParam;

  const cache = await getMicroMarketFromCache(citySlug, microMarketSlug);
  if (!cache) return { title: "Micro Market Not Found" };

  const supabase = createServiceClient();
  const { data: city } = await supabase
    .from("cities")
    .select("city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = city?.city_name || citySlug;
  const marketName = cache.micro_market_name || microMarketSlug;

  return buildMetadata({
    title: `${marketName} Real Estate Investment Guide | ${cityName} | RE/MAX Westside Realty`,
    description:
      cache.hero_hook ||
      `Explore ${marketName} - property prices, growth trends, and investment potential in ${cityName}.`,
    canonicalUrl: `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}`,
  });
}

type NearbyMarket = { micro_market_name: string; url_slug: string };

export default async function MicroMarketPage({ params }: PageProps) {
  const { citySlug: citySlugParam, microMarketSlug: mmSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const microMarketSlug = Array.isArray(mmSlugParam) ? mmSlugParam[0] : mmSlugParam;

  const cache = await getMicroMarketFromCache(citySlug, microMarketSlug);
  if (!cache) {
    return notFound();
  }

  const supabase = createServiceClient();
  const { data: city } = await supabase
    .from("cities")
    .select("city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = city?.city_name || citySlug;

  // Run all independent fetches in parallel
  const [mapCenter, mmData, nearbyMarketsData, metricsData, aiEnrichmentRaw, classRowsData] = await Promise.all([
    getMicroMarketMapCenter(cache.id),
    supabase
      .from("micro_markets")
      .select("faqs, faq_schema_json, commute_matrix, connectivity_details, nearest_mmts_status, top_schools, top_hospitals")
      .eq("micro_market_name", cache.micro_market_name ?? "")
      .maybeSingle()
      .then(({ data }) => data),
    supabase
      .from("micro_market_page_cache_v2")
      .select("micro_market_name, url_slug")
      .eq("city_id", cache.city_id ?? "")
      .neq("url_slug", cache.url_slug ?? "")
      .order("capital_momentum_score", { ascending: false, nullsFirst: false })
      .limit(6)
      .then(({ data }) => data ?? []),
    supabase
      .from("micro_market_metrics" as never)
      .select("growth_stage, price_cycle_stage, institutional_confidence, overall_score")
      .eq("micro_market", cache.micro_market_name ?? "")
      .maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => data),
    supabase
      .from("micro_market_ai_enrichment" as never)
      .select("market_maturity, builder_activity, buyer_profile, rental_yield_min, rental_yield_max, price_per_sqft_current, market_summary, top_developers, market_risks, confidence, zone_type, market_character, price_band_current, buyer_profile_detail, lifestyle_score, possession_wait, best_for, appreciation_5yr, rental_yield_detail, entry_timing, entry_reasoning, employment_drivers, infrastructure_pipeline, social_infrastructure, risk_level, primary_risk, secondary_risks, bull_case, bear_case, analyst_recommendation, commercial_rental_yield_min, commercial_rental_yield_max, commercial_rental_yield_detail, fetched_at")
      .eq("micro_market_id", cache.id)
      .maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => data),
    // Fetch project classifications here so we can augment cache metrics + reuse for BHK/amenities
    cache.micro_market_name
      ? supabase
          .from("project_micro_market_classification")
          .select("project_id")
          .eq("resolved_micro_market", cache.micro_market_name)
          .then(({ data }) => (data ?? []) as Array<{ project_id: string | null }>)
      : Promise.resolve([] as Array<{ project_id: string | null }>),
  ]);

  // Derive projectIds from classification table
  const projectIds = classRowsData
    .map((r) => r.project_id)
    .filter((id): id is string => id != null);

  // Augment the cache row: fill null RERA metrics from data we have at runtime.
  // recent_launches = count of projects classified to this market (RERA project count).
  // velocity_score  = derived from AI enrichment builder_activity when cache has no value.
  const aiRaw = aiEnrichmentRaw as Record<string, unknown> | null;
  const derivedVelocityScore = ((): number | null => {
    if (cache.velocity_score != null) return null; // don't override
    const ba = String(aiRaw?.builder_activity ?? "").toLowerCase();
    if (ba.includes("very active")) return 85;
    if (ba.includes("high") || ba.includes("active")) return 65;
    if (ba.includes("moderate")) return 45;
    if (projectIds.length > 0) return 20;
    return null;
  })();

  const augmentedCache = {
    ...cache,
    recent_launches: cache.recent_launches ?? (projectIds.length > 0 ? projectIds.length : null),
    velocity_score: cache.velocity_score ?? derivedVelocityScore,
  };

  const viewModel = buildMicroMarketViewModel(augmentedCache);

  // Process FAQs from micro_markets table.
  // Stored as either a JSON string or native array.
  // Field names vary by market: {question, answer} or {q, a}.
  const parseFaqs = (raw: unknown): Array<{ question: string; answer: string }> => {
    const normalize = (items: unknown[]): Array<{ question: string; answer: string }> =>
      items
        .map((f) => {
          const item = f as Record<string, unknown>;
          return {
            question: String(item.question ?? item.q ?? "").trim(),
            answer: String(item.answer ?? item.a ?? "").trim(),
          };
        })
        .filter((f) => f.question);

    if (!raw) return [];
    if (Array.isArray(raw)) return normalize(raw);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? normalize(parsed) : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const faqs = parseFaqs(mmData?.faqs);
  const rawFaqSchema = mmData?.faq_schema_json;
  const faqSchemaJson: string | null =
    typeof rawFaqSchema === "string" ? rawFaqSchema : null;

  // Parse commute matrix — format: [{destination, distance, time}, ...]
  const parseCommuteMatrix = (raw: unknown): Array<{ destination: string; distance: string; time: string }> => {
    if (!raw) return [];
    const items: unknown[] = Array.isArray(raw) ? raw : (() => {
      try { return JSON.parse(String(raw)); } catch { return []; }
    })();
    return (items as Record<string, unknown>[])
      .map((item) => ({
        destination: String(item.destination ?? "").trim(),
        distance: String(item.distance ?? "").trim(),
        time: String(item.time ?? "").trim(),
      }))
      .filter((entry) => entry.destination);
  };

  // Parse school/hospital name arrays — handles clean strings and double-escaped JSON
  const parseNames = (raw: unknown): string[] => {
    if (!raw) return [];
    const items: unknown[] = Array.isArray(raw) ? raw : (() => {
      try { return JSON.parse(String(raw)); } catch { return []; }
    })();
    const result: string[] = [];
    for (const item of items) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("[") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
          try {
            const inner = JSON.parse(trimmed);
            if (Array.isArray(inner)) {
              inner.forEach((i: unknown) => { if (typeof i === "string" && i.trim()) result.push(i.trim()); });
            } else if (typeof inner === "string" && inner.trim()) {
              result.push(inner.trim());
            }
          } catch {
            const clean = trimmed.replace(/^["\\]+|["\\]+$/g, "").trim();
            if (clean) result.push(clean);
          }
        } else if (trimmed) {
          result.push(trimmed);
        }
      }
    }
    return result;
  };

  const mmRaw = mmData as Record<string, unknown> | null;
  const locationData = {
    commuteMatrix: parseCommuteMatrix(mmRaw?.commute_matrix),
    topSchools: parseNames(mmRaw?.top_schools).slice(0, 5),
    topHospitals: parseNames(mmRaw?.top_hospitals).slice(0, 5),
    nearestMmtsStatus: typeof mmRaw?.nearest_mmts_status === "string" ? mmRaw.nearest_mmts_status : null,
    connectivityDetails: typeof mmRaw?.connectivity_details === "string" ? mmRaw.connectivity_details : null,
  };

  const marketMetrics = metricsData
    ? {
        growthStage: typeof metricsData.growth_stage === "string" ? metricsData.growth_stage : null,
        priceCycleStage: typeof metricsData.price_cycle_stage === "string" ? metricsData.price_cycle_stage : null,
      }
    : null;

  const aiEnrichment = aiEnrichmentRaw as {
    // v1 fields
    market_maturity: string | null;
    builder_activity: string | null;
    buyer_profile: string | null;
    rental_yield_min: number | null;
    rental_yield_max: number | null;
    price_per_sqft_current: number | null;
    market_summary: string | null;
    top_developers: string[] | null;
    market_risks: string | null;
    confidence: string | null;
    // v2 fields
    zone_type: string | null;
    market_character: string | null;
    price_band_current: string | null;
    buyer_profile_detail: string | null;
    lifestyle_score: string | null;
    possession_wait: string | null;
    best_for: string | null;
    appreciation_5yr: string | null;
    rental_yield_detail: string | null;
    entry_timing: string | null;
    entry_reasoning: string | null;
    employment_drivers: string[] | null;
    infrastructure_pipeline: string[] | null;
    social_infrastructure: string | null;
    risk_level: string | null;
    primary_risk: string | null;
    secondary_risks: string[] | null;
    bull_case: string | null;
    bear_case: string | null;
    analyst_recommendation: string | null;
    commercial_rental_yield_min: number | null;
    commercial_rental_yield_max: number | null;
    commercial_rental_yield_detail: string | null;
    fetched_at: string | null;
  } | null;

  // Process nearby markets for cross-linking
  const nearbyMarkets: NearbyMarket[] = (
    (nearbyMarketsData ?? []) as Array<{
      micro_market_name: string | null;
      url_slug: string | null;
    }>
  )
    .filter((m) => m.micro_market_name != null && m.url_slug != null)
    .map((m) => ({
      micro_market_name: m.micro_market_name!,
      url_slug: m.url_slug!,
    }));

  // Fetch available BHK types + amenities using projectIds already fetched above
  type MarketAmenities = { schools: boolean; hospitals: boolean; dailyConveniences: boolean; pharmacy: boolean };
  let availableBhkTypes: string[] = [];
  let marketAmenities: MarketAmenities | null = null;
  if (projectIds.length > 0) {
    const [unitResult, amenityResult] = await Promise.all([
        supabase
          .from("v_project_unit_enriched")
          .select("normalized_unit_config")
          .eq("is_residential_signal", true)
          .eq("is_noise", false)
          .in("project_id", projectIds)
          .not("normalized_unit_config", "is", null),
        supabase
          .from("project_location_access")
          .select("schools_nearby,international_schools_nearby,emergency_hospital_nearby,clinics_nearby,grocery_access,pharmacy_access")
          .in("project_id", projectIds)
          .limit(50),
      ]);

      const bhkCounts: Record<string, number> = {};
      const validBhk = new Set(["1BHK", "2BHK", "2.5BHK", "3BHK", "4BHK", "5BHK"]);
      (
        (unitResult.data ?? []) as Array<{ normalized_unit_config: string | null }>
      ).forEach((u) => {
        if (u.normalized_unit_config && validBhk.has(u.normalized_unit_config)) {
          bhkCounts[u.normalized_unit_config] =
            (bhkCounts[u.normalized_unit_config] ?? 0) + 1;
        }
      });
      availableBhkTypes = Object.entries(bhkCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([config]) => config)
        .slice(0, 4);

      const amenityRows = amenityResult.data;
      if (amenityRows && amenityRows.length > 0) {
        const threshold = amenityRows.length * 0.3;
        const counts = { schools: 0, hospitals: 0, dailyConveniences: 0, pharmacy: 0 };
        (amenityRows as Array<Record<string, unknown>>).forEach((r) => {
          if (r.schools_nearby || r.international_schools_nearby) counts.schools++;
          if (r.emergency_hospital_nearby || r.clinics_nearby) counts.hospitals++;
          if (r.grocery_access) counts.dailyConveniences++;
          if (r.pharmacy_access) counts.pharmacy++;
        });
        marketAmenities = {
          schools: counts.schools > threshold,
          hospitals: counts.hospitals > threshold,
          dailyConveniences: counts.dailyConveniences > threshold,
          pharmacy: counts.pharmacy > threshold,
        };
      }
  }

  return (
    <MicroMarketPageContent
      viewModel={viewModel}
      citySlug={citySlug}
      cityName={cityName}
      mapCenter={mapCenter}
      faqs={faqs}
      faqSchemaJson={faqSchemaJson}
      availableBhkTypes={availableBhkTypes}
      nearbyMarkets={nearbyMarkets}
      amenities={marketAmenities}
      locationData={locationData}
      marketMetrics={marketMetrics}
      aiEnrichment={aiEnrichment}
    />
  );
}
