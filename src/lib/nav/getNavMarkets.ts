import { createServiceClient } from "@/lib/supabase/serviceClient";

export interface NavMarketCity {
  label: string;
  citySlug: string;
  href: string;
  description: string;
  markets: { label: string; href: string; badge?: string }[];
  cta: { label: string; href: string };
}

export async function getNavMarkets(): Promise<NavMarketCity[]> {
  try {
    const supabase = createServiceClient();

    const { data: cities } = await supabase
      .from("cities")
      .select("id, city_name, url_slug")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!cities || cities.length === 0) return [];

    const results: NavMarketCity[] = await Promise.all(
      cities.map(async (city) => {
        const { data: markets } = await supabase
          .from("micro_markets")
          .select("micro_market_name, url_slug, is_featured, is_luxury")
          .eq("city_id", city.id)
          .eq("status", "active")
          .order("is_featured", { ascending: false })
          .order("price_per_sqft_max", { ascending: false })
          .limit(8);

        return {
          label: `${city.city_name} Markets`,
          citySlug: city.url_slug,
          href: `/${city.url_slug}/micro-markets`,
          description: `Live price intelligence across ${city.city_name}'s top investment micro-markets`,
          markets: (markets ?? []).map((m, i) => ({
            label: m.micro_market_name,
            href: `/${city.url_slug}/${m.url_slug}`,
            badge:
              i === 0
                ? "HOT"
                : m.is_featured
                  ? "HOT"
                  : m.is_luxury
                    ? "LUXURY"
                    : undefined,
          })),
          cta: {
            label: `View all ${city.city_name} markets →`,
            href: `/${city.url_slug}/micro-markets`,
          },
        };
      })
    );

    return results;
  } catch (err) {
    console.error("[getNavMarkets]", err);
    return [];
  }
}
