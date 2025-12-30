import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import HomeTestClient from "./HomeTestClient";

export const metadata: Metadata = buildMetadata({
  title: "RE/MAX Westside Realty - Find Your Dream Home | Hyderabad, Goa, Dubai",
  description:
    "Find your dream home in seconds. 1000+ RERA verified projects across Hyderabad, Goa & Dubai. Premium real estate advisory with expert guidance.",
  canonicalUrl: "https://www.westsiderealty.in/home-test",
  keywords:
    "hyderabad real estate, goa properties, dubai investment, RERA verified projects, buy property, real estate search",
});

// Fetch data server-side for SEO and performance
async function getHomeTestData() {
  const supabase = await createClient();

  // Fetch trending projects (using is_featured as proxy, or projects with high listing_count)
  const { data: trendingProjects } = await supabase
    .from("projects")
    .select(`
      id,
      project_name,
      url_slug,
      hero_image_url,
      price_range_text,
      status,
      listing_count,
      is_featured,
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug),
      city:cities(url_slug, city_name)
    `)
    .eq("is_published", true)
    .or("status.ilike.published,status.ilike.%under construction%")
    .order("listing_count", { ascending: false, nullsFirst: false })
    .order("is_featured", { ascending: false })
    .limit(3);

  // Fetch featured projects
  const { data: featuredProjects } = await supabase
    .from("projects")
    .select(`
      id,
      project_name,
      url_slug,
      hero_image_url,
      price_range_text,
      status,
      listing_count,
      is_featured,
      rera_link,
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug),
      city:cities(url_slug, city_name)
    `)
    .eq("is_published", true)
    .or("status.ilike.published,status.ilike.%under construction%")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch testimonials
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch micro-markets with project counts for Hyderabad
  const { data: hyderabadCity } = await supabase
    .from("cities")
    .select("id")
    .eq("url_slug", "hyderabad")
    .single();

  let microMarkets: any[] = [];
  if (hyderabadCity) {
    const { data: markets } = await supabase
      .from("micro_markets")
      .select(`
        id,
        micro_market_name,
        url_slug,
        latitude,
        longitude,
        projects:projects!projects_micromarket_id_fkey(count)
      `)
      .eq("city_id", hyderabadCity.id)
      .eq("status", "published")
      .limit(10);

    // Transform to include project count
    microMarkets = (markets || []).map((mm: any) => ({
      ...mm,
      projectCount: Array.isArray(mm.projects) ? mm.projects.length : 0,
    }));
  }

  return {
    trendingProjects: trendingProjects || [],
    featuredProjects: featuredProjects || [],
    testimonials: testimonials || [],
    microMarkets: microMarkets || [],
  };
}

export default async function HomeTestPage() {
  const data = await getHomeTestData();

  return <HomeTestClient {...data} />;
}
