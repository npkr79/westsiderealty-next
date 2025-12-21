import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import ProjectCard from "@/components/properties/ProjectCard";
import ProjectsFiltersRoot from "@/components/projects/ProjectsFiltersRoot";
import CityTabs from "@/components/projects/CityTabs";
import { Building2, Sparkles, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{ search?: string; city?: string; microMarket?: string; status?: string }>;
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
  
  // ===== ENV VAR VALIDATION =====
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("[ProjectsHubPage] ===== ENVIRONMENT CHECK =====");
  console.log("[ProjectsHubPage] NEXT_PUBLIC_SUPABASE_URL exists:", !!supabaseUrl);
  console.log("[ProjectsHubPage] NEXT_PUBLIC_SUPABASE_URL length:", supabaseUrl?.length || 0);
  console.log("[ProjectsHubPage] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!supabaseAnonKey);
  console.log("[ProjectsHubPage] NEXT_PUBLIC_SUPABASE_ANON_KEY length:", supabaseAnonKey?.length || 0);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[ProjectsHubPage] ❌ CRITICAL: Missing Supabase env vars!");
    throw new Error("Supabase environment variables are not configured");
  }

  const supabase = await createClient();

  // ===== TEST QUERY: Check if projects table has any data =====
  const { data: testData, error: testError } = await supabase
    .from("projects")
    .select("id, project_name, status, is_published, page_status, city_id")
    .limit(5);
  
  console.log("[ProjectsHubPage] ===== TEST QUERY RESULTS =====");
  console.log("[ProjectsHubPage] Test query error:", testError);
  console.log("[ProjectsHubPage] Test query returned rows:", testData?.length || 0);
  if (testData && testData.length > 0) {
    console.log("[ProjectsHubPage] Sample project:", {
      id: testData[0].id,
      name: testData[0].project_name,
      status: testData[0].status,
      is_published: testData[0].is_published,
      page_status: testData[0].page_status,
      city_id: testData[0].city_id,
    });
  }

  // Fetch all cities for filter
  const { data: citiesData, error: citiesError } = await supabase
    .from("cities")
    .select("city_name, url_slug")
    .eq("page_status", "published")
    .order("city_name");
  
  console.log("[ProjectsHubPage] Cities fetched:", citiesData?.length || 0);
  if (citiesError) console.error("[ProjectsHubPage] Cities error:", citiesError);

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

  // ===== FILTER LOGIC =====
  console.log("[ProjectsHubPage] ===== FILTER PARAMS =====");
  console.log("[ProjectsHubPage] Raw searchParams:", {
    city: resolvedSearchParams.city,
    status: resolvedSearchParams.status,
    search: resolvedSearchParams.search,
    microMarket: resolvedSearchParams.microMarket,
  });

  // Get city ID if city filter is applied (and it's not "all" or empty)
  let cityId: string | null = null;
  const cityFilter = resolvedSearchParams.city;
  if (cityFilter && cityFilter !== "all" && cityFilter.trim() !== "") {
    console.log("[ProjectsHubPage] Applying city filter:", cityFilter);
    const { data: cityData, error: cityLookupError } = await supabase
      .from("cities")
      .select("id, city_name")
      .eq("url_slug", cityFilter)
      .single();
    
    if (cityLookupError) {
      console.error("[ProjectsHubPage] City lookup error:", cityLookupError);
    } else if (cityData) {
      cityId = cityData.id;
      console.log("[ProjectsHubPage] Found city ID:", cityId, "for:", cityData.city_name);
    }
  } else {
    console.log("[ProjectsHubPage] No city filter (showing all cities)");
  }

  // Build query for projects (all cities)
  // Try multiple filter strategies to match what works in city-specific pages
  let query = supabase
    .from("projects")
    .select(`
      id, project_name, url_slug, hero_image_url, price_range_text, status, is_published, page_status,
      city:cities!projects_city_id_fkey(city_name, url_slug),
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `);

  // Apply status filter - prioritize is_published if it exists, otherwise use status field
  const statusFilter = resolvedSearchParams.status;
  if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "") {
    console.log("[ProjectsHubPage] Applying status filter:", statusFilter);
    if (statusFilter === "published") {
      // Try is_published first, fallback to status
      query = query.or("is_published.eq.true,status.eq.published,page_status.eq.published");
    } else if (statusFilter === "under-construction") {
      query = query.ilike("status", "%under construction%");
    }
  } else {
    // Default: show published projects (try multiple fields)
    console.log("[ProjectsHubPage] Using default status filter (published/under construction)");
    query = query.or("is_published.eq.true,status.ilike.published,status.ilike.%under construction%,page_status.eq.published");
  }

  // Apply city filter
  if (cityId) {
    console.log("[ProjectsHubPage] Filtering by city_id:", cityId);
    query = query.eq("city_id", cityId);
  }

  // Apply micro-market filter (if provided and not "all")
  if (resolvedSearchParams.microMarket && resolvedSearchParams.microMarket !== "all" && resolvedSearchParams.microMarket.trim() !== "") {
    console.log("[ProjectsHubPage] Applying micro-market filter:", resolvedSearchParams.microMarket);
    // Note: This requires a join or subquery - for now, we'll filter after fetch if needed
  }

  // Apply search filter
  if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
    console.log("[ProjectsHubPage] Applying search filter:", resolvedSearchParams.search);
    query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
  }

  // Order results
  query = query.order("created_at", { ascending: false });

  console.log("[ProjectsHubPage] ===== EXECUTING MAIN QUERY =====");
  const { data: projects, error } = await query;

  console.log("[ProjectsHubPage] ===== QUERY RESULTS =====");
  console.log("[ProjectsHubPage] Query error:", error);
  console.log("[ProjectsHubPage] Projects returned:", projects?.length || 0);
  
  let finalProjects = projects;
  
  // If main query fails or returns no results, try fallback strategies
  if (error || !projects || projects.length === 0) {
    if (error) {
      console.error("[ProjectsHubPage] ❌ Query error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
    
    console.log("[ProjectsHubPage] ===== TRYING FALLBACK QUERY =====");
    
    // Fallback 1: Try simpler query with just is_published (like city-specific pages)
    let fallbackQuery = supabase
      .from("projects")
      .select(`
        id, project_name, url_slug, hero_image_url, price_range_text, status, is_published, page_status,
        city:cities!projects_city_id_fkey(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq("is_published", true);
    
    if (cityId) {
      fallbackQuery = fallbackQuery.eq("city_id", cityId);
    }
    
    if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
      fallbackQuery = fallbackQuery.ilike("project_name", `%${resolvedSearchParams.search}%`);
    }
    
    fallbackQuery = fallbackQuery.order("created_at", { ascending: false });
    
    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    
    if (fallbackError) {
      console.error("[ProjectsHubPage] Fallback query also failed:", fallbackError);
    } else {
      console.log("[ProjectsHubPage] Fallback query returned:", fallbackData?.length || 0, "projects");
      if (fallbackData && fallbackData.length > 0) {
        finalProjects = fallbackData;
        console.log("[ProjectsHubPage] ✅ Using fallback query results");
      } else {
        // Fallback 2: Try with no status filter at all (just city if specified)
        console.log("[ProjectsHubPage] ===== TRYING FALLBACK 2 (NO STATUS FILTER) =====");
        let fallback2Query = supabase
          .from("projects")
          .select(`
            id, project_name, url_slug, hero_image_url, price_range_text, status, is_published, page_status,
            city:cities!projects_city_id_fkey(city_name, url_slug),
            micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
            developer:developers(developer_name, url_slug)
          `);
        
        if (cityId) {
          fallback2Query = fallback2Query.eq("city_id", cityId);
        }
        
        if (resolvedSearchParams.search && resolvedSearchParams.search.trim() !== "") {
          fallback2Query = fallback2Query.ilike("project_name", `%${resolvedSearchParams.search}%`);
        }
        
        fallback2Query = fallback2Query.order("created_at", { ascending: false }).limit(50);
        
        const { data: fallback2Data, error: fallback2Error } = await fallback2Query;
        
        if (!fallback2Error && fallback2Data && fallback2Data.length > 0) {
          console.log("[ProjectsHubPage] Fallback 2 returned:", fallback2Data.length, "projects");
          finalProjects = fallback2Data;
          console.log("[ProjectsHubPage] ✅ Using fallback 2 query results (no status filter)");
        } else {
          console.warn("[ProjectsHubPage] ⚠️ All query strategies returned no results");
        }
      }
    }
  }
  
  if (finalProjects && finalProjects.length > 0) {
    console.log("[ProjectsHubPage] ✅ Final projects count:", finalProjects.length);
    console.log("[ProjectsHubPage] Sample projects:", finalProjects.slice(0, 3).map(p => ({
      id: p.id,
      name: p.project_name,
      status: p.status,
      is_published: (p as any).is_published,
      city: (p as any).city,
    })));
  }

  // Normalize the data - Supabase may return arrays for relations, convert to single objects
  const projectsList: Project[] = (finalProjects || []).map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.status,
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

        {/* Projects Grid */}
        <section className="container mx-auto px-4 py-12">
          {projectsList.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your filters or search terms to find projects.
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

