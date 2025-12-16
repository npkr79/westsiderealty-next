import { createClient } from "@/lib/supabase/server";

export interface NavCity {
  city_name: string;
  url_slug: string;
}

export interface NavMicroMarket {
  name: string;
  url_slug: string;
  city_slug: string;
}

export interface NavDeveloper {
  developer_name: string;
  url_slug: string;
  total_projects: number | null;
}

// Cache for navigation data
let citiesCache: NavCity[] | null = null;
let microMarketsCache: NavMicroMarket[] | null = null;
let developersCache: NavDeveloper[] | null = null;

export const navigationService = {
  async getNavigationCities(): Promise<NavCity[]> {
    if (citiesCache) return citiesCache;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cities")
      .select("city_name, url_slug")
      .in("url_slug", ["goa", "hyderabad"])
      .order("city_name");

    if (error) {
      console.error("Error fetching navigation cities:", error);
      return [];
    }

    citiesCache = data || [];
    return citiesCache;
  },

  async getFeaturedMicroMarkets(): Promise<NavMicroMarket[]> {
    if (microMarketsCache) return microMarketsCache;

    const targetAreas = ["neopolis", "kokapet", "tellapur", "gachibowli", "kondapur"];
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("micro_markets")
      .select("micro_market_name, url_slug")
      .in("url_slug", targetAreas);

    if (error) {
      console.error("Error fetching navigation micro markets:", error);
      return [];
    }

    microMarketsCache = (data || []).map((mm) => ({
      name: mm.micro_market_name,
      url_slug: mm.url_slug,
      city_slug: "hyderabad",
    }));

    return microMarketsCache;
  },

  async getFeaturedDevelopers(): Promise<NavDeveloper[]> {
    if (developersCache) return developersCache;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("developers")
      .select("developer_name, url_slug, total_projects")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("display_order", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Error fetching navigation developers:", error);
      return [];
    }

    developersCache = data || [];
    return developersCache;
  },

  clearCache() {
    citiesCache = null;
    microMarketsCache = null;
    developersCache = null;
  },
};
