import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import ProjectCard from "@/components/properties/ProjectCard";
import Link from "next/link";
import Image from "next/image";
import { Building2, Search, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
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

export default async function SearchPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const query = resolved.q || "";
  
  const supabase = await createClient();

  // Fetch projects and developers in parallel
  const [projectsResult, developersResult] = await Promise.all([
    query
      ? supabase
          .from("projects")
          .select(`
            id,
            project_name,
            url_slug,
            hero_image_url,
            price_range_text,
            status,
            is_published,
            city:cities(url_slug, city_name),
            micro_market:micro_markets!projects_micromarket_id_fkey(url_slug, micro_market_name),
            developer:developers(url_slug, developer_name)
          `)
          .ilike("project_name", `%${query}%`)
          .eq("is_published", true)
          .limit(20)
      : { data: [], error: null },
    query
      ? supabase
          .from("developers")
          .select("id, developer_name, url_slug, logo_url, tagline, specialization")
          .ilike("developer_name", `%${query}%`)
          .eq("is_published", true)
          .limit(20)
      : { data: [], error: null },
  ]);

  const projects: ProjectResult[] = (projectsResult.data || []).map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.status,
    city: Array.isArray(p.city) ? p.city[0] : p.city,
    micro_market: Array.isArray(p.micro_market) ? p.micro_market[0] : p.micro_market,
    developer: Array.isArray(p.developer) ? p.developer[0] : p.developer,
  }));

  const developers: DeveloperResult[] = developersResult.data || [];

  const hasResults = projects.length > 0 || developers.length > 0;

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
          title={query ? `Search Results for "${query}"` : "Search Properties & Developers"}
          description={
            query
              ? `Found ${projects.length} project${projects.length !== 1 ? "s" : ""} and ${developers.length} developer${developers.length !== 1 ? "s" : ""} matching your search`
              : "Search for projects and developers across Hyderabad, Goa, and Dubai"
          }
        />

        <div className="container mx-auto px-4 py-8">
          {!query ? (
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
                Try searching with different keywords or browse our{" "}
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
                      Projects ({projects.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                      const citySlug = project.city?.url_slug || "hyderabad";

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
                          citySlug={citySlug}
                        />
                      );
                    })}
                  </div>
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
