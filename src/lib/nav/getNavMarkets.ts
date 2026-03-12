import { createServiceClient } from "@/lib/supabase/serviceClient";

export interface NavMarketCity {
  label: string;
  citySlug: string;
  href: string;
  description: string;
  markets: { label: string; href: string; badge?: string }[];
  cta: { label: string; href: string };
}

// Markets to exclude from the Hyderabad nav dropdown
const HYDERABAD_NAV_EXCLUDES = new Set(["SD Road", "CBI Colony, Jubilee Hills"]);
// Markets that must always appear in the Hyderabad nav dropdown
const HYDERABAD_NAV_PRIORITY = ["Tellapur", "Neopolis"];

export async function getNavMarkets(): Promise<NavMarketCity[]> {
  try {
    const supabase = createServiceClient();

    const { data: cities } = await supabase
      .from("cities")
      .select("id, city_name, url_slug")
      .eq("is_active", true)
      .gt("display_order", 0)
      .order("display_order", { ascending: true });

    if (!cities || cities.length === 0) return [];

    const results: NavMarketCity[] = await Promise.all(
      cities.map(async (city) => {
        const isHyderabad = city.url_slug === "hyderabad";

        // Fetch extra rows for Hyderabad to compensate for excluded markets
        const fetchLimit = isHyderabad ? 15 : 8;
        const { data: markets } = await supabase
          .from("micro_markets")
          .select("micro_market_name, url_slug, is_featured, is_luxury")
          .eq("city_id", city.id)
          .in("status", ["active", "published"])
          .order("is_featured", { ascending: false })
          .order("price_per_sqft_max", { ascending: false })
          .limit(fetchLimit);

        let displayMarkets = markets ?? [];

        if (isHyderabad) {
          // Remove excluded markets
          const filtered = displayMarkets.filter(
            (m) => !HYDERABAD_NAV_EXCLUDES.has(m.micro_market_name)
          );

          // Fetch priority markets that may not be in the top results
          const presentNames = new Set(filtered.map((m) => m.micro_market_name));
          const missingPriority = HYDERABAD_NAV_PRIORITY.filter(
            (name) => !presentNames.has(name)
          );

          if (missingPriority.length > 0) {
            const { data: priorityMarkets } = await supabase
              .from("micro_markets")
              .select("micro_market_name, url_slug, is_featured, is_luxury")
              .eq("city_id", city.id)
              .in("status", ["active", "published"])
              .in("micro_market_name", missingPriority);

            // Prepend priority markets so they appear near the top
            displayMarkets = [...(priorityMarkets ?? []), ...filtered].slice(0, 8);
          } else {
            displayMarkets = filtered.slice(0, 8);
          }
        }

        return {
          label: `${city.city_name} Markets`,
          citySlug: city.url_slug,
          href: `/${city.url_slug}/micro-markets`,
          description: `Live price intelligence across ${city.city_name}'s top investment micro-markets`,
          markets: displayMarkets.map((m, i) => ({
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
