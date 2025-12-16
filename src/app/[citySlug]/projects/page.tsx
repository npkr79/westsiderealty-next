import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import FooterSection from "@/components/home/FooterSection";
import ProjectCard from "@/components/properties/ProjectCard";
import ProjectsFilters from "@/components/projects/ProjectsFilters";
import { Building2 } from "lucide-react";

interface PageProps {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ search?: string; microMarket?: string; status?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const supabase = await createClient();
  
  const { data: cityData } = await supabase
    .from("cities")
    .select("city_name")
    .eq("url_slug", citySlug)
    .maybeSingle();

  const cityName = cityData?.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects`;

  return buildMetadata({
    title: `Premium Real Estate Projects in ${cityName} | Westside Realty`,
    description: `Explore premium residential projects in ${cityName}. Find luxury apartments, villas, and plots from top developers.`,
    canonicalUrl,
  });
}

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("url_slug")
    .eq("page_status", "published");

  return cities?.map((city) => ({ citySlug: city.url_slug })) || [];
}

interface Project {
  id: string;
  project_name: string;
  url_slug: string;
  hero_image_url: string | null;
  price_range_text: string | null;
  status: string | null;
  micro_market: { micro_market_name: string; url_slug: string } | null;
  developer: { developer_name: string; url_slug: string } | null;
}

interface MicroMarketOption {
  micro_market_name: string;
  url_slug: string;
}

export default async function ProjectsHubPage({ params, searchParams }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Fetch city name
  const { data: cityData } = await supabase
    .from("cities")
    .select("city_name, id")
    .eq("url_slug", citySlug)
    .maybeSingle();

  if (!cityData) {
    notFound();
  }

  const cityName = cityData.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  // Fetch micro market options
  const { data: mmData } = await supabase
    .from("micro_markets")
    .select("micro_market_name, url_slug")
    .eq("city_id", cityData.id)
    .order("micro_market_name");

  const microMarketOptions = (mmData || []) as MicroMarketOption[];

  // Build query for projects
  let query = supabase
    .from("projects")
    .select("id, project_name, url_slug, hero_image_url, price_range_text, status, micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug), developer:developers(developer_name, url_slug)")
    .eq("city_slug", citySlug)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Apply search filter
  if (resolvedSearchParams.search) {
    query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
  }

  // Apply micro market filter
  if (resolvedSearchParams.microMarket && resolvedSearchParams.microMarket !== "all") {
    const { data: mmData } = await supabase
      .from("micro_markets")
      .select("id")
      .eq("url_slug", resolvedSearchParams.microMarket)
      .maybeSingle();

    if (mmData?.id) {
      query = query.eq("micromarket_id", mmData.id);
    }
  }

  // Apply status filter
  if (resolvedSearchParams.status && resolvedSearchParams.status !== "all") {
    query = query.eq("status", resolvedSearchParams.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
  }

  const projects = (data || []) as Project[];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: cityName, href: `/${citySlug}` },
    { label: "Projects" },
  ];

  return (
    <>
      <JsonLd
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Projects in ${cityName}`,
          "description": `Premium residential projects in ${cityName}`,
          "url": `https://www.westsiderealty.in/${citySlug}/projects`,
          "numberOfItems": projects.length,
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Premium Projects in {cityName}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover top residential projects from leading developers. RERA verified.
            </p>
          </div>
        </section>

        <section className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <ProjectsFilters microMarketOptions={microMarketOptions} citySlug={citySlug} />
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{projects.length} projects found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project as any} citySlug={citySlug} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <FooterSection />
    </>
  );
}
