import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getMicroMarketsForHub } from "@/services/microMarketCacheService";
import MicroMarketsHubContent from "@/components/micro-market/MicroMarketsHubContent";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = createServiceClient();

  const { data: city } = await supabase
    .from("cities")
    .select("city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = city?.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  return buildMetadata({
    title: `${cityName} Real Estate Micro-Market Insights | Investment Dashboard`,
    description: `Compare property trends, prices, and investment potential in ${cityName}'s top localities. Analyze growth rates and find the best opportunities.`,
    canonicalUrl: `https://www.westsiderealty.in/${citySlug}/micro-markets`,
  });
}

export async function generateStaticParams() {
  const { createBuildClient } = await import("@/lib/supabase/buildClient");
  const supabase = createBuildClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("url_slug")
    .eq("page_status", "published");

  return cities?.map((city) => ({ citySlug: city.url_slug })) || [];
}

export default async function MicroMarketsHubPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = createServiceClient();

  const [markets, cityData] = await Promise.all([
    getMicroMarketsForHub(citySlug),
    supabase.from("cities").select("city_name").eq("url_slug", citySlug).maybeSingle(),
  ]);

  if (!cityData?.data) {
    notFound();
  }

  const cityName = cityData.data.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Which micro-market in ${cityName} offers the best ROI?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Markets with 15%+ YoY appreciation show strong growth. ROI depends on your investment timeline and risk appetite.",
        },
      },
      {
        "@type": "Question",
        name: `What is the average price per sq.ft in ${cityName} micro-markets?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prices vary by corridor. Use the comparison table to compare price ranges across markets.",
        },
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cityName} Real Estate Micro-Market Insights`,
    url: `https://www.westsiderealty.in/${citySlug}/micro-markets`,
    numberOfItems: markets.length,
    itemListElement: markets.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Place",
        name: m.micro_market_name,
        url: `https://www.westsiderealty.in/${citySlug}/${m.url_slug}`,
        ...(m.price_per_sqft_min != null &&
          m.price_per_sqft_max != null && {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: m.price_per_sqft_min,
              highPrice: m.price_per_sqft_max,
            },
          }),
      },
    })),
  };

  return (
    <>
      <JsonLd jsonLd={itemListSchema} />
      <JsonLd jsonLd={faqSchema} />
      <MicroMarketsHubContent markets={markets} citySlug={citySlug} cityName={cityName} />
    </>
  );
}

export const revalidate = 600;
