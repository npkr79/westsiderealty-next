import { createClient } from "@/lib/supabase/server";

export interface LandownerProject {
  id: string;
  project_name: string;
  url_slug: string;
  seo_title: string | null;
  meta_description: string | null;
  hero_image_url: string | null;
  price_range_text: string | null;
  unit_size_range: string | null;
  property_types: string | null;
  completion_status: string | null;
  micro_market?: { micro_market_name: string; url_slug: string } | null;
  developer?: { developer_name: string; url_slug: string } | null;
  city?: { city_name: string; url_slug: string } | null;
}

export async function getLandownerInvestorProjects(): Promise<LandownerProject[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_name,
      url_slug,
      seo_title,
      meta_description,
      hero_image_url,
      price_range_text,
      unit_size_range,
      property_types,
      completion_status,
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug),
      city:cities(city_name, url_slug)
    `)
    .eq("has_landowner_investor_share", true)
    .eq("status", "published")
    .order("project_name", { ascending: true });

  if (error) {
    console.error("Error fetching landowner projects:", error);
    return [];
  }

  return (data || []).map((project: any) => ({
    id: project.id,
    project_name: project.project_name,
    url_slug: project.url_slug,
    seo_title: project.seo_title,
    meta_description: project.meta_description,
    hero_image_url: project.hero_image_url,
    price_range_text: project.price_range_text,
    unit_size_range: project.unit_size_range,
    property_types: project.property_types,
    completion_status: project.completion_status,
    micro_market: project.micro_market || null,
    developer: project.developer || null,
    city: project.city || null,
  }));
}

