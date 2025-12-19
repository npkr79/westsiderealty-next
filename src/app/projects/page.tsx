import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import FooterSection from "@/components/home/FooterSection";
import ProjectCard from "@/components/properties/ProjectCard";
import ProjectsFiltersRoot from "@/components/projects/ProjectsFiltersRoot";
import { Building2 } from "lucide-react";

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
  city_slug: string;
  micro_market: { micro_market_name: string; url_slug: string } | null;
  developer: { developer_name: string; url_slug: string } | null;
}

export default async function ProjectsHubPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Fetch all cities for filter
  const { data: citiesData } = await supabase
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

  // Build query for projects (all cities)
  let query = supabase
    .from("projects")
    .select("id, project_name, url_slug, hero_image_url, price_range_text, status, city_slug, micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug), developer:developers(developer_name, url_slug)")
    .or("status.ilike.published,status.ilike.%under construction%,page_status.eq.published")
    .order("created_at", { ascending: false });

  // Apply filters
  if (resolvedSearchParams.city) {
    query = query.eq("city_slug", resolvedSearchParams.city);
  }

  if (resolvedSearchParams.status) {
    if (resolvedSearchParams.status === "published") {
      query = query.eq("status", "published");
    } else if (resolvedSearchParams.status === "under-construction") {
      query = query.ilike("status", "%under construction%");
    }
  }

  if (resolvedSearchParams.search) {
    query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Normalize the data - Supabase may return arrays for relations, convert to single objects
  const projectsList: Project[] = (projects || []).map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.status,
    city_slug: p.city_slug,
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
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Premium Real Estate Projects
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore luxury residential projects from India's leading developers. Find your perfect home or investment opportunity.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b bg-card/50 sticky top-16 z-10 backdrop-blur-sm">
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
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Found {projectsList.length} project{projectsList.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsList.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      ...project,
                      city: { city_name: project.city_slug, url_slug: project.city_slug },
                    }}
                    citySlug={project.city_slug}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <FooterSection />
    </>
  );
}

