import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import ProjectCard from "@/components/properties/ProjectCard";
import { Building2 } from "lucide-react";

interface PageProps {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{ search?: string; status?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug } = await params;
  const supabase = await createClient();
  
  const { data: city } = await supabase
    .from("cities")
    .select("city_name, seo_title, meta_description")
    .eq("url_slug", citySlug)
    .single();

  if (!city) {
    return {
      title: "Projects Not Found",
    };
  }

  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects`;

  return buildMetadata({
    title: `${city.seo_title || city.city_name} Projects - Premium Real Estate | RE/MAX Westside Realty`,
    description: city.meta_description || `Explore premium residential projects in ${city.city_name}. Find luxury apartments, villas, and plots from top developers.`,
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

export default async function CityProjectsPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Get city info
  const { data: city } = await supabase
    .from("cities")
    .select("id, city_name, url_slug")
    .eq("url_slug", citySlug)
    .single();

  if (!city) {
    notFound();
  }

  // Build query for projects in this city
  let query = supabase
    .from("projects")
    .select(`
      id, project_name, url_slug, hero_image_url, price_range_text, status, is_published,
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `)
    .eq("city_id", city.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Apply status filter
  if (resolvedSearchParams.status) {
    if (resolvedSearchParams.status === "published") {
      query = query.eq("status", "published");
    } else if (resolvedSearchParams.status === "under-construction") {
      query = query.ilike("status", "%under construction%");
    }
  }

  // Apply search filter
  if (resolvedSearchParams.search) {
    query = query.ilike("project_name", `%${resolvedSearchParams.search}%`);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Normalize the data
  const projectsList: Project[] = (projects || []).map((p: any) => ({
    id: p.id,
    project_name: p.project_name,
    url_slug: p.url_slug,
    hero_image_url: p.hero_image_url,
    price_range_text: p.price_range_text,
    status: p.status,
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
    name: `${city.city_name} Real Estate Projects`,
    description: `Premium residential projects in ${city.city_name}`,
    url: `https://www.westsiderealty.in/${citySlug}/projects`,
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: city.city_name, href: `/${citySlug}` },
    { label: "Projects", href: `/${citySlug}/projects` },
  ];

  return (
    <>
      <JsonLd jsonLd={[jsonLd]} />
      <PageHeader
        title={`New Projects in ${city.city_name}`}
        subtitle={`${projectsList.length} projects available`}
        breadcrumbs={breadcrumbItems}
      />

      <main className="min-h-screen bg-background">
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
                      city: { city_name: city.city_name, url_slug: city.url_slug },
                    }}
                    citySlug={citySlug}
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
