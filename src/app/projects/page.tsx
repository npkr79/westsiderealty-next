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
    .select("id, project_name, page_status, completion_status, city_id")
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

  // ===== CITY FILTERING =====
  const cityFilter = resolvedSearchParams.city;
  let cityIds: string[] | null = null;

  if (cityFilter && cityFilter !== "all" && cityFilter.trim() !== "") {
    // Single city filter
    const { data: cityRow } = await supabase
      .from("cities")
      .select("id")
      .eq("url_slug", cityFilter)
      .maybeSingle();
    
    if (cityRow?.id) {
      cityIds = [cityRow.id];
    }
  } else {
    // Default: Hyderabad + Goa (when no city param or "all" is selected)
    const { data: defaultCities } = await supabase
      .from("cities")
      .select("id")
      .in("url_slug", ["hyderabad", "goa"]);
    
    cityIds = (defaultCities || []).map(c => c.id);
    // If no default cities found, don't filter by city (show all)
    if (cityIds.length === 0) {
      cityIds = null;
    }
  }

  // ===== BUILD MAIN QUERY =====
  // Start with minimal query - no joins until we confirm it works
  let query = supabase
    .from("projects")
    .select(`
      id, project_name, url_slug, hero_image_url, price_range_text, completion_status, page_status, city_id, created_at,
      city:cities(city_name, url_slug),
      micro_market:micro_markets(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `)
    .eq("page_status", "published");

  // Apply city filter
  if (cityIds && cityIds.length > 0) {
    query = query.in("city_id", cityIds);
  }

  // Apply status filter using completion_status
  const statusFilter = resolvedSearchParams.status;
  if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "") {
    if (statusFilter === "under-construction") {
      query = query.ilike("completion_status", "%Under%");
    } else if (statusFilter === "ready") {
      query = query.ilike("completion_status", "%Ready%");
    }
  }

  // Apply search filter
  if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
    query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
  }

  // Order results
  query = query.order("created_at", { ascending: false });

  const { data: projects, error } = await query;

  // Normalize the data - Supabase may return arrays for relations, convert to single objects
  const projectsList: Project[] = (projects || []).map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.completion_status || p.status,
    city: Array.isArray(p.city) 
      ? (p.city[0] || null)
      : (p.city || null),
    micro_market: Array.isArray(p.micro_market) 
      ? (p.micro_market[0] || null)
      : (p.micro_market || null),
    developer: Array.isArray(p.developer)
      ? (p.developer[0] || null)
      : (p.developer || null),
  }));

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
        {debug && (
          <section className="container mx-auto px-4 py-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
            <h3 className="font-bold text-sm mb-2">🔍 Debug Mode</h3>
            <pre className="text-xs overflow-auto bg-white p-4 rounded border">
              {JSON.stringify({
                testError: testError ? {
                  message: testError.message,
                  details: testError.details,
                  hint: testError.hint,
                  code: testError.code,
                } : null,
                testCount: testData?.length ?? 0,
                mainError: error ? {
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  code: error.code,
                } : null,
                mainCount: projects?.length ?? 0,
                filters: {
                  city: resolvedSearchParams.city,
                  status: resolvedSearchParams.status,
                  search: resolvedSearchParams.search,
                  microMarket: resolvedSearchParams.microMarket,
                },
                cityIds: cityIds,
                citiesFetched: citiesData?.length ?? 0,
              }, null, 2)}
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
