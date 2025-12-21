import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import ProjectCard from "@/components/properties/ProjectCard";
import ProjectsFiltersRoot from "@/components/projects/ProjectsFiltersRoot";
import CityTabs from "@/components/projects/CityTabs";
import { Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{ search?: string; city?: string; microMarket?: string; status?: string; debug?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://www.westsiderealty.in/projects";

  return buildMetadata({
    title: "Premium Real Estate Projects | Westside Realty",
    description: "Explore premium residential projects across India. Find luxury apartments, villas, and plots from top developers.",
    canonicalUrl,
  });
}

interface Project {
  id: string;
  project_name: string;
  url_slug: string;
  hero_image_url: string | null;
  price_range_text: string | null;
  status: string | null;
  city: { city_name: string; url_slug: string } | null;
  micro_market: { micro_market_name: string; url_slug: string } | null;
  developer: { developer_name: string; url_slug: string } | null;
}

export default async function ProjectsHubPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const debug = resolvedSearchParams?.debug === "1";
  
  const supabase = await createClient();

  // ===== TEST QUERY: Check if projects table has any data =====
  const { data: testData, error: testError } = await supabase
    .from("projects")
    .select("id, project_name, status, completion_status, page_status, city_id")
    .limit(5);
  
  // Fetch all cities for filter
  const { data: citiesData, error: citiesError } = await supabase
    .from("cities")
    .select("city_name, url_slug")
    .eq("page_status", "published")
    .order("city_name");

  // Fetch micro market options (all cities)
  const { data: mmData } = await supabase
    .from("micro_markets")
    .select("micro_market_name, url_slug, city:cities(url_slug)")
    .order("micro_market_name");

  const microMarketOptions = (mmData || []).map((mm: any) => ({
    micro_market_name: mm.micro_market_name,
    url_slug: mm.url_slug,
    city_slug: mm.city?.url_slug || "",
  }));

  // Check if filtering by Goa
  const cityFilter = resolvedSearchParams.city;
  const isGoaFilter = cityFilter === "goa";

  let projectsList: Project[] = [];
  let error: any = null;

  if (isGoaFilter) {
    // Fetch from goa_holiday_properties table
    let goaQuery = supabase
      .from("goa_holiday_properties")
      .select("id, title, description, price, price_display, hero_image_url, location_area, district, type, bedrooms, bathrooms, area_sqft, seo_slug, status, created_at")
      .eq("status", "Active");

    // Apply search filter
    if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
      goaQuery = goaQuery.or(`title.ilike.%${resolvedSearchParams.search}%,description.ilike.%${resolvedSearchParams.search}%,location_area.ilike.%${resolvedSearchParams.search}%`);
    }

    // Apply status filter (for Goa, we can filter by type or other fields)
    const statusFilter = resolvedSearchParams.status;
    if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "" && statusFilter !== "published") {
      // Map status filters to Goa property types if needed
      if (statusFilter === "ready") {
        // For Goa, "ready" might mean properties that are ready to move in
        // This would need to be based on your actual data structure
      }
    }

    goaQuery = goaQuery.order("created_at", { ascending: false });

    const { data: goaProperties, error: goaError } = await goaQuery;

    if (goaError) {
      console.error("Goa properties error:", goaError);
      error = goaError;
    }

    // Transform to match project card format
    projectsList = (goaProperties || []).map((prop: any) => ({
      id: prop.id,
      project_name: prop.title,
      url_slug: prop.seo_slug || prop.id,
      hero_image_url: prop.hero_image_url,
      price_range_text: prop.price_display || (prop.price ? `₹${(prop.price / 10000000).toFixed(2)} Cr` : null),
      status: prop.status,
      city: { city_name: "Goa", url_slug: "goa" },
      micro_market: prop.location_area ? { micro_market_name: prop.location_area, url_slug: prop.location_area.toLowerCase().replace(/\s+/g, "-") } : null,
      developer: null,
      // Add special flag for Goa properties to use different URL
      _isGoaProperty: true,
    }));
  } else {
    // Existing projects table query for Hyderabad/other cities
    // Get city ID if city filter is applied (and it's not "all" or empty)
    let cityId: string | null = null;
    if (cityFilter && cityFilter !== "all" && cityFilter.trim() !== "") {
      const { data: cityData, error: cityLookupError } = await supabase
        .from("cities")
        .select("id, city_name")
        .eq("url_slug", cityFilter)
        .single();

      if (!cityLookupError && cityData) cityId = cityData.id;
    }

    // Build query (ONLY use page_status for publish)
    let query = supabase
      .from("projects")
      .select(`
        id,
        project_name,
        url_slug,
        hero_image_url,
        price_range_text,
        status,
        completion_status,
        page_status,
        city:cities!projects_city_id_fkey(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers!projects_developer_id_fkey(developer_name, url_slug)
      `)
      .eq("page_status", "published");

    // Apply city filter
    if (cityId) query = query.eq("city_id", cityId);

    // Apply micro-market filter (by slug -> id)
    const microMarketSlug = resolvedSearchParams.microMarket;
    if (microMarketSlug && microMarketSlug !== "all" && microMarketSlug.trim() !== "") {
      const { data: mm } = await supabase
        .from("micro_markets")
        .select("id")
        .eq("url_slug", microMarketSlug)
        .maybeSingle();

      if (mm?.id) query = query.eq("micro_market_id", mm.id);
    }

    // Apply status filter (use completion_status; ignore "published" because we already filter page_status)
    const statusFilter = resolvedSearchParams.status;
    if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "" && statusFilter !== "published") {
      const map: Record<string, string> = {
        "under-construction": "Under Construction",
        "ready-to-move": "Ready",
        "new-launch": "New Launch",
      };
      const needle = map[statusFilter] ?? statusFilter.replace(/-/g, " ");
      query = query.ilike("completion_status", `%${needle}%`);
    }

    // Apply search filter
    if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
      query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data: projects, error: projectsError } = await query;
    error = projectsError;

    // Normalize relations + map status shown on cards
    projectsList = (projects || []).map((p: any) => ({
      id: p.id,
      project_name: p.project_name,
      url_slug: p.url_slug,
      hero_image_url: p.hero_image_url,
      price_range_text: p.price_range_text,
      status: p.completion_status ?? p.status ?? null,
      city: Array.isArray(p.city) ? (p.city[0] || null) : (p.city || null),
      micro_market: Array.isArray(p.micro_market) ? (p.micro_market[0] || null) : (p.micro_market || null),
      developer: Array.isArray(p.developer) ? (p.developer[0] || null) : (p.developer || null),
    }));
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Real Estate Projects",
    description: "Premium residential projects across India",
    url: "https://www.westsiderealty.in/projects",
  };

  return (
    <>
      <JsonLd jsonLd={[jsonLd]} />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 via-background to-secondary/10 py-20 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Premium Projects
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Discover Your Dream Project
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Explore RERA-verified residential projects from India's top developers. 
              Find your perfect home in Hyderabad, Goa, and other prime locations.
            </p>
          </div>
        </section>

        {/* City Tabs */}
        <section className="border-b bg-card sticky top-16 z-20 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <CityTabs 
              cities={citiesData || []} 
              selectedCity={resolvedSearchParams.city}
            />
          </div>
        </section>

        {/* Filters */}
        <section className="border-b bg-card/50 sticky top-[calc(4rem+3rem)] z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <ProjectsFiltersRoot
              cities={citiesData || []}
              microMarkets={microMarketOptions}
              initialSearch={resolvedSearchParams.search}
              initialCity={resolvedSearchParams.city}
              initialMicroMarket={resolvedSearchParams.microMarket}
              initialStatus={resolvedSearchParams.status}
            />
          </div>
        </section>

        {/* Debug Panel */}
        {resolvedSearchParams.debug === "1" && (
          <section className="container mx-auto px-4 py-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
            <h3 className="font-bold text-sm mb-2">🔍 Debug</h3>
            <pre className="text-xs overflow-auto bg-white p-4 rounded border">
              {JSON.stringify(
                {
                  count: projectsList.length,
                  error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
                  params: resolvedSearchParams,
                },
                null,
                2
              )}
            </pre>
          </section>
        )}

        {/* Projects Grid */}
        <section className="container mx-auto px-4 py-12">
          {projectsList.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your filters or search terms to find projects.
                {debug && error && (
                  <span className="block mt-2 text-red-600 text-sm">
                    Error: {error.message}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{projectsList.length}</span> project{projectsList.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsList.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      ...project,
                      city: project.city || { city_name: "Unknown", url_slug: "" },
                    }}
                    citySlug={project.city?.url_slug || ""}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

    </>
  );
}
