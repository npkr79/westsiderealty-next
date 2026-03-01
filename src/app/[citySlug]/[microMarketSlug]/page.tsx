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
  const [viewModel, mapCenter, mmData, nearbyMarketsData] = await Promise.all([
    Promise.resolve(buildMicroMarketViewModel(cache)),
    getMicroMarketMapCenter(cache.id),
    supabase
      .from("micro_markets")
      .select("faqs, faq_schema_json")
      .eq("id", cache.id)
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
  ]);

  // Process FAQs from micro_markets table
  const rawFaqs = mmData?.faqs;
  const faqs: Array<{ question: string; answer: string }> = Array.isArray(rawFaqs)
    ? (rawFaqs as Array<{ question: string; answer: string }>)
    : [];
  const rawFaqSchema = mmData?.faq_schema_json;
  const faqSchemaJson: string | null =
    typeof rawFaqSchema === "string" ? rawFaqSchema : null;

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

  // Fetch available BHK types (two-step: project IDs → unit configs)
  let availableBhkTypes: string[] = [];
  if (cache.micro_market_name) {
    const { data: classRows } = await supabase
      .from("project_micro_market_classification")
      .select("project_id")
      .eq("resolved_micro_market", cache.micro_market_name);

    const projectIds = (
      (classRows ?? []) as Array<{ project_id: string | null }>
    )
      .map((r) => r.project_id)
      .filter((id): id is string => id != null);

    if (projectIds.length > 0) {
      const { data: unitRows } = await supabase
        .from("v_project_unit_enriched")
        .select("normalized_unit_config")
        .eq("is_residential_signal", true)
        .eq("is_noise", false)
        .in("project_id", projectIds)
        .not("normalized_unit_config", "is", null);

      const bhkCounts: Record<string, number> = {};
      const validBhk = new Set(["1BHK", "2BHK", "2.5BHK", "3BHK", "4BHK", "5BHK"]);
      (
        (unitRows ?? []) as Array<{ normalized_unit_config: string | null }>
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
    />
  );
}
