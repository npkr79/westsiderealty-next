import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import ProjectCard from "@/components/properties/ProjectCard";
import Link from "next/link";
import Image from "next/image";
import { Building2, Search, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ 
    q?: string;
    city?: string;
    category?: string;
    projectType?: string;
    propertyTypes?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const query = resolved.q || "";
  
  return buildMetadata({
    title: query 
      ? `Search Results for "${query}" | Westside Realty`
      : "Search Properties & Developers | Westside Realty",
    description: query
      ? `Find projects and developers matching "${query}" in Hyderabad, Goa, and Dubai.`
      : "Search for real estate projects and developers in Hyderabad, Goa, and Dubai.",
    canonicalUrl: `https://www.westsiderealty.in/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
  });
}

interface ProjectResult {
  id: string;
  project_name: string;
  url_slug: string;
  hero_image_url: string | null;
  price_range_text: string | null;
  status: string;
  property_types?: any;
  city?: {
    url_slug: string;
    city_name: string;
  };
  micro_market?: {
    url_slug: string;
    micro_market_name: string;
  };
  developer?: {
    url_slug: string;
    developer_name: string;
  };
}

interface DeveloperResult {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
  tagline: string | null;
  specialization: string | null;
}

// Helper function to check if property_types JSONB contains a specific type
function matchesPropertyType(propertyTypes: any, searchTypes: string[]): boolean {
  if (!propertyTypes || searchTypes.length === 0) return true;
  
  // Handle JSONB - could be array, object, or string
  let typesArray: string[] = [];
  
  if (Array.isArray(propertyTypes)) {
    typesArray = propertyTypes.map((t: any) => {
      if (typeof t === 'string') return t.toLowerCase();
      if (t?.type) return String(t.type).toLowerCase();
      if (t?.name) return String(t.name).toLowerCase();
      return String(t).toLowerCase();
    });
  } else if (typeof propertyTypes === 'string') {
    try {
      const parsed = JSON.parse(propertyTypes);
      if (Array.isArray(parsed)) {
        typesArray = parsed.map((t: any) => {
          if (typeof t === 'string') return t.toLowerCase();
          if (t?.type) return String(t.type).toLowerCase();
          if (t?.name) return String(t.name).toLowerCase();
          return String(t).toLowerCase();
        });
      } else {
        typesArray = [propertyTypes.toLowerCase()];
      }
    } catch {
      // If not JSON, treat as single string
      typesArray = [propertyTypes.toLowerCase()];
    }
  } else if (typeof propertyTypes === 'object' && propertyTypes !== null) {
    typesArray = Object.values(propertyTypes).map((t: any) => String(t).toLowerCase());
  }
  
  // Check if any search type matches (exact match or contains)
  const normalizedSearchTypes = searchTypes.map(t => t.toLowerCase().trim());
  return normalizedSearchTypes.some(searchType => 
    typesArray.some(type => {
      const normalizedType = type.toLowerCase().trim();
      // Exact match
      if (normalizedType === searchType) return true;
      // Contains match (e.g., "apartment" matches "apartments" or "apartment/flat")
      if (normalizedType.includes(searchType) || searchType.includes(normalizedType)) return true;
      // Special case: "apartment" should match "apartments", "apartment/flat", etc.
      if ((normalizedType.includes('apartment') || normalizedType.includes('flat')) && 
          (searchType.includes('apartment') || searchType.includes('flat'))) return true;
      return false;
    })
  );
}

const ITEMS_PER_PAGE = 20;

export default async function SearchPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const query = resolved.q || "";
  const citySlug = resolved.city || "";
  const category = resolved.category || "";
  const projectType = resolved.projectType || "";
  const propertyTypesParam = resolved.propertyTypes || "";
  const currentPage = parseInt(resolved.page || "1", 10);
  
  const supabase = await createClient();

  // Parse property types from comma-separated string
  const propertyTypes = propertyTypesParam 
    ? propertyTypesParam.split(",").filter(Boolean)
    : [];

  // Get city ID if city filter is provided
  let cityId: string | null = null;
  if (citySlug) {
    const { data: cityData } = await supabase
      .from("cities")
      .select("id")
      .eq("url_slug", citySlug)
      .maybeSingle();
    cityId = cityData?.id || null;
  }

  // Build projects query - don't filter by is_published to include all projects
  // The user wants to see all projects matching the criteria, not just published ones
  // Note: is_published column doesn't exist in projects table, so we don't select it
  let projectsQuery = supabase
    .from("projects")
    .select(`
      id,
      project_name,
      url_slug,
      hero_image_url,
      price_range_text,
      status,
      property_types,
      city:cities(url_slug, city_name),
      micro_market:micro_markets!projects_micromarket_id_fkey(url_slug, micro_market_name),
      developer:developers(url_slug, developer_name)
    `, { count: 'exact' });

  // Apply city filter
  if (cityId) {
    projectsQuery = projectsQuery.eq("city_id", cityId);
  }

  // Apply project type filter (New Projects vs Resale) - make it less restrictive
  if (projectType === "new-project") {
    // New projects: include published, under construction, or any status that's not explicitly "resale"
    projectsQuery = projectsQuery.or("status.ilike.published,status.ilike.%under construction%,status.is.null");
  } else if (projectType === "resale") {
    // Resale: ready-to-move or completed projects
    projectsQuery = projectsQuery.or("status.ilike.%ready%,status.ilike.%completed%");
  }

  // Apply search query filter
  if (query) {
    projectsQuery = projectsQuery.ilike("project_name", `%${query}%`);
  }

  // Fetch all matching projects (we'll filter property types and category in memory)
  // Increase limit to get more projects before filtering
  const { data: projectsData, error: projectsError, count: totalCount } = await projectsQuery.limit(500);

  if (projectsError) {
    console.error("[SearchPage] Error fetching projects:", projectsError);
  }

  // Filter by property types in memory (since JSONB filtering is complex)
  let filteredProjects = (projectsData || []) as any[];
  
  console.log(`[SearchPage] Fetched ${filteredProjects.length} projects before property type filtering`);
  console.log(`[SearchPage] Property types filter:`, propertyTypes);
  
  if (propertyTypes.length > 0) {
    // Map property type IDs to actual property type names
    const propertyTypeMap: Record<string, string[]> = {
      "apartment": ["apartment", "flat", "apartment/flat", "apartments", "Apartment", "Flat"],
      "standalone": ["standalone", "standalone apartment"],
      "independent-house": ["independent house", "independent", "house"],
      "villa": ["villa", "villas"],
      "office": ["office", "office space"],
      "retail": ["retail", "retail space"],
      "serviced": ["serviced"],
      "coworking": ["coworking", "co-working"],
      "residential-plot": ["residential plot", "plot"],
      "commercial-plot": ["commercial plot"],
      "gated-plot": ["gated plot", "gated"],
      "agricultural": ["agricultural", "agriculture"],
    };

    // Get all search terms for selected property types
    const searchTerms: string[] = [];
    propertyTypes.forEach(pt => {
      const terms = propertyTypeMap[pt] || [pt];
      searchTerms.push(...terms);
    });

    console.log(`[SearchPage] Searching for property types:`, searchTerms);

    filteredProjects = filteredProjects.filter(project => {
      const matches = matchesPropertyType(project.property_types, searchTerms);
      if (!matches && project.property_types) {
        console.log(`[SearchPage] Project "${project.project_name}" property_types:`, JSON.stringify(project.property_types));
      }
      return matches;
    });
    
    console.log(`[SearchPage] After property type filtering: ${filteredProjects.length} projects`);
  }

  // Apply category filter (residential/commercial/land)
  if (category === "residential") {
    // Filter out commercial and land types
    filteredProjects = filteredProjects.filter(project => {
      const types = project.property_types;
      if (!types) return true; // Include if no property type specified
      const typesStr = JSON.stringify(types).toLowerCase();
      return !typesStr.includes("commercial") && !typesStr.includes("plot") && !typesStr.includes("land");
    });
  } else if (category === "commercial") {
    // Only include commercial types
    filteredProjects = filteredProjects.filter(project => {
      const types = project.property_types;
      if (!types) return false;
      const typesStr = JSON.stringify(types).toLowerCase();
      return typesStr.includes("commercial") || typesStr.includes("office") || typesStr.includes("retail");
    });
  } else if (category === "land") {
    // Only include land/plot types
    filteredProjects = filteredProjects.filter(project => {
      const types = project.property_types;
      if (!types) return false;
      const typesStr = JSON.stringify(types).toLowerCase();
      return typesStr.includes("plot") || typesStr.includes("land") || typesStr.includes("agricultural");
    });
  }

  // Calculate pagination
  const totalProjects = filteredProjects.length;
  const totalPages = Math.ceil(totalProjects / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const projects: ProjectResult[] = paginatedProjects.map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.status,
    property_types: p.property_types,
    city: Array.isArray(p.city) ? p.city[0] : p.city,
    micro_market: Array.isArray(p.micro_market) ? p.micro_market[0] : p.micro_market,
    developer: Array.isArray(p.developer) ? p.developer[0] : p.developer,
  }));

  // Fetch developers (only if search query is provided)
  let developers: DeveloperResult[] = [];
  if (query) {
    let developersQuery = supabase
      .from("developers")
      .select("id, developer_name, url_slug, logo_url, tagline, specialization")
      .ilike("developer_name", `%${query}%`)
      .eq("is_published", true);

    const { data: developersData, error: developersError } = await developersQuery.limit(20);

    if (developersError) {
      console.error("[SearchPage] Error fetching developers:", developersError);
    }

    developers = developersData || [];
  }

  const hasResults = projects.length > 0 || developers.length > 0;

  // Build search summary
  const searchSummary: string[] = [];
  if (citySlug) searchSummary.push(citySlug.charAt(0).toUpperCase() + citySlug.slice(1));
  if (projectType === "new-project") searchSummary.push("New Projects");
  if (projectType === "resale") searchSummary.push("Resale");
  if (propertyTypes.length > 0) {
    const typeLabels: Record<string, string> = {
      "apartment": "Apartment/Flat",
      "standalone": "Standalone Apartment",
      "independent-house": "Independent House",
      "villa": "Villa",
    };
    searchSummary.push(propertyTypes.map(pt => typeLabels[pt] || pt).join(", "));
  }
  if (query) searchSummary.push(`"${query}"`);

  // Build pagination URL
  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams();
    if (citySlug) params.set("city", citySlug);
    if (category) params.set("category", category);
    if (projectType) params.set("projectType", projectType);
    if (propertyTypesParam) params.set("propertyTypes", propertyTypesParam);
    if (query) params.set("q", query);
    if (page > 1) params.set("page", page.toString());
    return `/search?${params.toString()}`;
  };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: query ? `Search Results for "${query}"` : "Search Properties & Developers",
    description: `Search results for real estate projects and developers${query ? ` matching "${query}"` : ""}`,
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title={
            searchSummary.length > 0
              ? `Search Results${searchSummary.length > 0 ? `: ${searchSummary.join(" • ")}` : ""}`
              : "Search Properties & Developers"
          }
          subtitle={
            hasResults
              ? `Found ${totalProjects} project${totalProjects !== 1 ? "s" : ""}${developers.length > 0 ? ` and ${developers.length} developer${developers.length !== 1 ? "s" : ""}` : ""}${totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ""}`
              : query || citySlug
              ? "No results found. Try adjusting your filters."
              : "Search for projects and developers across Hyderabad, Goa, and Dubai"
          }
        />

        <div className="container mx-auto px-4 py-8">
          {!hasResults && !query && !citySlug ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Enter a search query
              </h2>
              <p className="text-gray-600">
                Search for projects, developers, or micro-markets
              </p>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No results found
              </h2>
              <p className="text-gray-600">
                Try adjusting your filters or browse our{" "}
                <Link href="/hyderabad/projects" className="text-blue-600 hover:underline">
                  projects
                </Link>{" "}
                or{" "}
                <Link href="/developers" className="text-blue-600 hover:underline">
                  developers
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Projects Section */}
              {projects.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Building2 className="w-6 h-6 text-blue-700" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Projects ({totalProjects})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                      const projectCitySlug = project.city?.url_slug || citySlug || "hyderabad";

                      return (
                        <ProjectCard
                          key={project.id}
                          project={{
                            id: project.id,
                            project_name: project.project_name,
                            url_slug: project.url_slug,
                            hero_image_url: project.hero_image_url,
                            price_range_text: project.price_range_text,
                            status: project.status,
                            micro_market: project.micro_market,
                            developer: project.developer,
                          }}
                          citySlug={projectCitySlug}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Link href={buildPaginationUrl(currentPage - 1)}>
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                      </Link>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 10) {
                            pageNum = i + 1;
                          } else if (currentPage <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 4) {
                            pageNum = totalPages - 9 + i;
                          } else {
                            pageNum = currentPage - 5 + i;
                          }
                          
                          return (
                            <Link key={pageNum} href={buildPaginationUrl(pageNum)}>
                              <Button
                                variant={currentPage === pageNum ? "default" : "outline"}
                                className="min-w-[40px]"
                              >
                                {pageNum}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>

                      <Link href={buildPaginationUrl(currentPage + 1)}>
                        <Button
                          variant="outline"
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* Developers Section */}
              {developers.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Briefcase className="w-6 h-6 text-blue-700" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Developers ({developers.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developers.map((developer) => (
                      <Link
                        key={developer.id}
                        href={`/developers/${developer.url_slug}`}
                        className="block"
                      >
                        <Card className="h-full hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {developer.logo_url ? (
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  <Image
                                    src={developer.logo_url}
                                    alt={developer.developer_name}
                                    fill
                                    className="object-contain rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                  {developer.developer_name}
                                </h3>
                                {developer.tagline && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {developer.tagline}
                                  </p>
                                )}
                                {developer.specialization && (
                                  <Badge variant="secondary" className="text-xs">
                                    {developer.specialization}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
