import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getMicroMarketFromCache, getMicroMarketMapCenter } from "@/services/microMarketCacheService";
// Keep import to satisfy any stale references; projects are fetched by ProjectsInMarketAsync
import { getProjectsFromView, getTopPicks } from "@/services/microMarketProjectsService";
import { buildMicroMarketViewModel } from "@/services/microMarketViewModel";
import MicroMarketRedesign, { type FeaturedProject } from "@/components/micro-market/MicroMarketRedesign";
import { buildMetadata, JsonLd } from "@/components/common/SEO";
import { buildProjectAbsoluteUrl } from "@/lib/routes";
import type { GoaMarketProject } from "@/components/micro-market/GoaProjectsInMarket";

export const revalidate = 600;


type RentalIntelligenceData = {
  intelligence: Array<{
    intelligence_type: string;
    ai_verdict: string | null;
    vs_fd_rate: number | null;
    highlight_stat: string | null;
    data_period: string | null;
  }>;
  rentalRows: Array<{
    property_type: string;
    furnishing_type: string | null;
    rent_min: number | null;
    rent_max: number | null;
    rent_median: number | null;
    rent_psf_min: number | null;
    rent_psf_max: number | null;
  }>;
};

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

  const priceMin = cache.price_per_sqft_min;
  const priceMax = cache.price_per_sqft_max;
  const priceRange =
    priceMin && priceMax
      ? ` — ₹${priceMin.toLocaleString()}-${priceMax.toLocaleString()}/sqft`
      : "";

  const { data: heroProject } = await supabase
    .from("advisor_project_intelligence")
    .select("hero_image_url")
    .eq("city_slug", citySlug)
    .ilike("micro_market", cache.micro_market_name ?? microMarketSlug)
    .eq("is_focus_project", true)
    .not("hero_image_url", "is", null)
    .limit(1)
    .maybeSingle();

  return buildMetadata({
    title: `${marketName} Real Estate${priceRange} | ${cityName} | Westside Realty`,
    description:
      cache.hero_hook ||
      `Discover projects in ${marketName}, ${cityName}. Price trends, growth analysis & RERA-verified listings. Expert market intelligence by Westside Realty.`,
    canonicalUrl: `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}`,
    keywords: `${marketName} real estate, ${marketName} apartments, buy flat ${marketName}, ${marketName} property price, ${marketName} ${cityName}, rera projects ${marketName}`,
    imageUrl: (heroProject?.hero_image_url as string | null) ?? undefined,
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
  const [mapCenter, mmData, nearbyMarketsData, metricsData, aiEnrichmentRaw, classRowsData, advisorMarketRaw] = await Promise.all([
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
      .select("market_maturity, builder_activity, buyer_profile, rental_yield_min, rental_yield_max, price_per_sqft_current, market_summary, top_developers, market_risks, confidence, zone_type, market_character, price_band_current, buyer_profile_detail, lifestyle_score, possession_wait, best_for, appreciation_5yr, rental_yield_detail, entry_timing, entry_reasoning, employment_drivers, infrastructure_pipeline, social_infrastructure, risk_level, primary_risk, secondary_risks, bull_case, bear_case, analyst_recommendation, commercial_rental_yield_min, commercial_rental_yield_max, commercial_rental_yield_detail, fetched_at, lifestyle_summary, nearest_beaches, top_attractions, airport_distances, things_to_do, dining_nightlife")
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
    // Fetch advisor market intelligence (has investment_verdict, outlook_base_case, growth_catalysts, risk_factors)
    supabase
      .from("advisor_market_intelligence" as never)
      .select("market_name, market_slug, investment_verdict, outlook_base_case, growth_catalysts, risk_factors, appreciation_1yr_pct, appreciation_cagr_5yr, rental_yield_avg_pct, price_per_sqft_min, price_per_sqft_max, market_velocity_score, description")
      .eq("market_slug", microMarketSlug)
      .maybeSingle()
      .then(({ data }: { data: Record<string, unknown> | null }) => data),
  ]);

  // Derive projectIds from classification table
  const projectIds = classRowsData
    .map((r) => r.project_id)
    .filter((id): id is string => id != null);

  // Goa-only: fetch projects classified to this micro-market via the classification table.
  // SELECT rp.*, p.* FROM project_micro_market_classification pmc
  //   JOIN rera_projects rp ON rp.id = pmc.project_id
  //   LEFT JOIN projects p ON p.url_slug = rp.url_slug
  //   WHERE pmc.micro_market_slug = microMarketSlug AND rp.city_slug = 'goa'
  //   LIMIT 12
  let goaProjects: GoaMarketProject[] = [];
  if (citySlug === "goa") {
    const { data: classRows } = await supabase
      .from("project_micro_market_classification")
      .select("project_id")
      .eq("micro_market_slug", microMarketSlug)
      .limit(12);

    const goaProjectIds = ((classRows ?? []) as Array<{ project_id: string | null }>)
      .map((r) => r.project_id)
      .filter((id): id is string => id != null);

    if (goaProjectIds.length > 0) {
      const { data: reraRows } = await supabase
        .from("rera_projects")
        .select("id, project_name, url_slug, proposed_completion_date")
        .in("id", goaProjectIds)
        .eq("city_slug", "goa")
        .not("url_slug", "is", null);

      const reraData = (reraRows ?? []) as Array<{
        id: string; project_name: string; url_slug: string; proposed_completion_date: string | null;
      }>;

      if (reraData.length > 0) {
        const reraSlugs = reraData.map((r) => r.url_slug).filter(Boolean);
        const { data: enrichData } = await supabase
          .from("projects")
          .select("url_slug, property_types, price_display_string, unit_size_range, configurations")
          .in("url_slug", reraSlugs);

        const enrichMap = new Map(
          ((enrichData ?? []) as Array<Record<string, unknown>>).map((e) => [e.url_slug, e])
        );

        goaProjects = reraData.map((r) => ({
          id: r.id,
          project_name: r.project_name,
          url_slug: r.url_slug,
          city_slug: "goa",
          proposed_completion_date: r.proposed_completion_date,
          ...((enrichMap.get(r.url_slug) ?? {}) as object),
        })) as GoaMarketProject[];
      }
    }
  }

  // Augment the cache row: fill null RERA metrics from data we have at runtime.
  // recent_launches = count of projects classified to this market (RERA project count).
  // velocity_score  = derived from AI enrichment builder_activity when cache has no value.
  const aiRaw = aiEnrichmentRaw as Record<string, unknown> | null;
  const derivedVelocityScore = ((): number | null => {
    if (cache.velocity_score != null) return null; // don't override
    return null; // no reliable text-based fallback — hide stat when DB value absent
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
            const clean = trimmed.replace(/^[\["\\]+|[\]"\\]+$/g, "").trim();
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

  // Type the advisor market intelligence result
  const advisorMarket = advisorMarketRaw as {
    market_name: string | null;
    market_slug: string | null;
    investment_verdict: string | null;
    outlook_base_case: string | null;
    growth_catalysts: unknown;
    risk_factors: unknown;
    appreciation_1yr_pct: number | null;
    appreciation_cagr_5yr: number | null;
    rental_yield_avg_pct: number | null;
    price_per_sqft_min: number | null;
    price_per_sqft_max: number | null;
    market_velocity_score: number | null;
    description: string | null;
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

  // Hyderabad-only: fetch rental intelligence data
  let rentalIntelligence: RentalIntelligenceData | null = null;
  if (citySlug === "hyderabad") {
    const [intelRes, rentalRes] = await Promise.all([
      supabase
        .from("micro_market_rental_intelligence" as never)
        .select("intelligence_type, ai_verdict, vs_fd_rate, highlight_stat, data_period")
        .eq("micro_market_id", cache.id)
        .order("generated_at", { ascending: false }),
      supabase
        .from("rental_market_data" as never)
        .select("property_type, furnishing_type, rent_min, rent_max, rent_median, rent_psf_min, rent_psf_max")
        .eq("micro_market_id", cache.id)
        .order("data_month", { ascending: false }),
    ]);
    const intelData = (intelRes as { data: unknown[] | null }).data ?? [];
    if (intelData.length > 0) {
      rentalIntelligence = {
        intelligence: intelData as RentalIntelligenceData["intelligence"],
        rentalRows: ((rentalRes as { data: unknown[] | null }).data ?? []) as RentalIntelligenceData["rentalRows"],
      };
    }
  }

  // New-design only: fetch featured projects using the proven microMarketProjectsService
  // getTopPicks queries the projects table directly (avoids MV schema mismatches),
  // sorts by strong_developer → near_completion → completion_proximity,
  // and returns developer_url_slug for direct linking.
  let featuredProjects: FeaturedProject[] = [];
  let featuredProjectCount = 0;
  const developerBrandSlugs: Record<string, string> = {};
  {
    const picks = await getTopPicks(
      citySlug,
      microMarketSlug,
      8,
      cache.micro_market_name ?? undefined
    );

    // Batch-lookup correct developer_brands.url_slug for each project.
    // Strategy 1: rera_projects.url_slug → developer_project_brand_map → developer_brands.url_slug
    // Strategy 2 (fallback): fuzzy-match developer_name against developer_brands.brand_name
    // Never fall back to developers.url_slug — that table uses different slug formats.
    const brandSlugByProjectSlug = new Map<string, string>();
    try {
      const brandSvc = createServiceClient();

      // Strategy 1: via rera_projects → brand map
      const projectSlugsForBrand = picks.map((p) => p.url_slug).filter(Boolean);
      if (projectSlugsForBrand.length > 0) {
        const { data: reraRows } = await brandSvc
          .from("rera_projects")
          .select("id, url_slug")
          .in("url_slug", projectSlugsForBrand);
        if (reraRows?.length) {
          const reraIds = (reraRows as Array<{ id: string }>).map((r) => r.id);
          const { data: brandMapRows } = await brandSvc
            .from("developer_project_brand_map")
            .select("project_id, brand_id")
            .in("project_id", reraIds);
          if (brandMapRows?.length) {
            const projectIdToBrandId = new Map(
              (brandMapRows as Array<{ project_id: string; brand_id: string }>).map((r) => [r.project_id, r.brand_id])
            );
            const brandIds = (brandMapRows as Array<{ brand_id: string }>).map((r) => r.brand_id).filter(Boolean);
            const { data: brandRows } = await brandSvc
              .from("developer_brands")
              .select("id, url_slug")
              .in("id", brandIds);
            if (brandRows?.length) {
              const brandIdToSlug = new Map(
                (brandRows as Array<{ id: string; url_slug: string | null }>).map((r) => [r.id, r.url_slug ?? ""])
              );
              for (const reraRow of reraRows as Array<{ id: string; url_slug: string | null }>) {
                const brandId = projectIdToBrandId.get(reraRow.id);
                if (brandId && reraRow.url_slug) {
                  const brandSlug = brandIdToSlug.get(brandId);
                  if (brandSlug) brandSlugByProjectSlug.set(reraRow.url_slug, brandSlug);
                }
              }
            }
          }
        }
      }

      // Strategy 2: fetch all developer_brands and match by name prefix.
      // This covers both project developer names AND aiEnrichment.top_developers chip names.
      const { data: allBrands } = await brandSvc
        .from("developer_brands")
        .select("brand_name, url_slug");
      if (allBrands?.length) {
        const brands = allBrands as Array<{ brand_name: string; url_slug: string | null }>;

        // Helper: resolve a developer display name to a brand slug
        function resolveBrandSlug(devName: string): string | null {
          const devLower = devName.toLowerCase();
          const words = devLower.split(/[\s-]+/);
          const twoWordPrefix = words.slice(0, 2).join(" ");
          // Two-word prefix match first (e.g. "my home" → "My Home Group")
          let found = brands.find((b) => b.url_slug && b.brand_name.toLowerCase().startsWith(twoWordPrefix));
          // One-word prefix for distinctive words (≥ 5 chars)
          if (!found && words[0].length >= 5) {
            found = brands.find((b) => b.url_slug && b.brand_name.toLowerCase().startsWith(words[0]));
          }
          return found?.url_slug ?? null;
        }

        // Fill project brand slugs for any still unmatched
        for (const pick of picks) {
          if (!brandSlugByProjectSlug.has(pick.url_slug) && pick.developer_name) {
            const slug = resolveBrandSlug(pick.developer_name);
            if (slug) brandSlugByProjectSlug.set(pick.url_slug, slug);
          }
        }

        // Also build name→slug map for developer chip names (aiEnrichment.top_developers)
        const chipNames: string[] = Array.isArray(aiEnrichment?.top_developers)
          ? (aiEnrichment.top_developers as string[])
          : [];
        for (const name of chipNames) {
          if (name && !developerBrandSlugs[name]) {
            const slug = resolveBrandSlug(name);
            if (slug) developerBrandSlugs[name] = slug;
          }
        }
      }
    } catch {
      // Non-critical — developer links will simply be hidden if lookup fails
    }

    featuredProjects = picks.map((p) => ({
      url_slug: p.url_slug,
      project_name: p.project_name,
      developer_name: p.developer_name ?? null,
      // Use confirmed brand slug only — never fall back to developers.url_slug (wrong format)
      developer_url_slug: brandSlugByProjectSlug.get(p.url_slug) ?? null,
      micro_market_name: p.micro_market_name ?? null,
      hero_image_url: p.hero_image_url ?? null,
      price_per_sqft_min: null,
      price_per_sqft_max: null,
      min_area: null,
      max_area: null,
      price_range_text: p.price_range_text ?? null,
    }));
    featuredProjectCount = picks.length;
    // Get actual total count from the classification table (already fetched above)
    if (projectIds.length > featuredProjectCount) featuredProjectCount = projectIds.length;
  }

  const marketName = cache.micro_market_name ?? microMarketSlug;
  const pageUrl = `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
      { "@type": "ListItem", position: 3, name: marketName, item: pageUrl },
    ],
  };

  // ItemList schema — helps Google show project count rich snippets
  const itemListSchema = featuredProjectCount > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${marketName} Real Estate Projects`,
    description: `RERA-verified residential projects in ${marketName}, ${cityName}`,
    numberOfItems: featuredProjectCount,
    itemListElement: featuredProjects.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: buildProjectAbsoluteUrl(citySlug, p.slug),
      name: p.name,
    })),
  } : null;

  // LocalBusiness/RealEstateAgent schema for service area map pack visibility
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    url: "https://www.westsiderealty.in",
    areaServed: {
      "@type": "Place",
      name: `${marketName}, ${cityName}`,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: marketName,
      addressRegion: cityName,
      addressCountry: "IN",
    },
  };

  // Include FAQ schema from DB if available — enables People Also Ask rich results
  const faqSchemaFromDb = faqSchemaJson
    ? (() => { try { return typeof faqSchemaJson === "string" ? JSON.parse(faqSchemaJson) : faqSchemaJson; } catch { return null; } })()
    : null;

  const schemas = [
    breadcrumbSchema,
    localBusinessSchema,
    ...(itemListSchema ? [itemListSchema] : []),
    ...(faqSchemaFromDb ? [faqSchemaFromDb] : []),
  ];

  return (
    <>
      <JsonLd jsonLd={schemas} />
      <MicroMarketRedesign
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
        advisorMarket={advisorMarket}
        goaProjects={goaProjects}
        rentalIntelligence={rentalIntelligence}
        projects={featuredProjects}
        projectCount={featuredProjectCount}
        developerBrandSlugs={developerBrandSlugs}
      />
    </>
    );
}
