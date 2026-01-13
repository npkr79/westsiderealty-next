import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { parseFilterSlug } from "@/lib/utils/localityStats";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ProjectCard from "@/components/properties/ProjectCard";
import SmartLinkGrid from "@/components/shared/SmartLinkGrid";
import type { ProjectWithRelations } from "@/services/projectService";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate page title from filter type and value
 */
function getPageTitle(filterType: "config" | "type" | "status", filterValue: string, microMarketName: string, cityName: string): string {
  if (filterType === "config") {
    return `${filterValue} Apartments in ${microMarketName}, ${cityName} | RE/MAX`;
  } else if (filterType === "type") {
    return `Luxury ${filterValue}s in ${microMarketName}, ${cityName} | RE/MAX`;
  } else {
    return `${filterValue} Projects in ${microMarketName}, ${cityName} | RE/MAX`;
  }
}

/**
 * Generate page description
 */
function getPageDescription(filterType: "config" | "type" | "status", filterValue: string, microMarketName: string, cityName: string, count?: number): string {
  const filterLabel = filterType === "config" 
    ? `${filterValue} Apartments`
    : filterType === "type"
    ? `Luxury ${filterValue}s`
    : `${filterValue} Projects`;
  
  const countText = count !== undefined && count > 0 ? `${count}+ ` : "";
  
  return `Explore ${countText}${filterLabel.toLowerCase()} in ${microMarketName}, ${cityName}. Premium projects with prices, floor plans, and reviews. Find your perfect home at RE/MAX.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseFilterSlug(slug);
  
  if (!parsed) {
    return { title: "Page Not Found" };
  }

  const { filterType, filterValue, microMarketSlug } = parsed;
  const supabase = await createClient();

  // Fetch micro-market
  const { data: microMarket } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, city_id, hero_image_url")
    .eq("url_slug", microMarketSlug)
    .maybeSingle();

  if (!microMarket) {
    return { title: "Page Not Found" };
  }

  // Fetch city
  const { data: city } = await supabase
    .from("cities")
    .select("city_name, url_slug, hero_image_url")
    .eq("id", microMarket.city_id)
    .maybeSingle();

  if (!city) {
    return { title: "Page Not Found" };
  }

  const pageTitle = getPageTitle(filterType, filterValue, microMarket.micro_market_name, city.city_name);
  const pageDescription = getPageDescription(filterType, filterValue, microMarket.micro_market_name, city.city_name);
  const canonicalUrl = `https://www.westsiderealty.in/homes/${slug}`;

  // Get OG image (prefer micro-market, fallback to city)
  const ogImageUrl = microMarket.hero_image_url || city.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";
  const optimizedOgImage = optimizeSupabaseImage(ogImageUrl, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: optimizedOgImage,
          width: 1200,
          height: 630,
          alt: `${filterValue} in ${microMarket.micro_market_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [optimizedOgImage],
    },
  };
}

export default async function HomesFilterPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseFilterSlug(slug);

  if (!parsed) {
    notFound();
  }

  const { filterType, filterValue, microMarketSlug } = parsed;
  const supabase = await createClient();

  // Fetch micro-market
  const { data: microMarket } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, city_id, url_slug")
    .eq("url_slug", microMarketSlug)
    .maybeSingle();

  if (!microMarket) {
    notFound();
  }

  // Fetch city
  const { data: city } = await supabase
    .from("cities")
    .select("id, city_name, url_slug")
    .eq("id", microMarket.city_id)
    .maybeSingle();

  if (!city) {
    notFound();
  }

  // Fetch all projects for this micro-market
  const { data: projects, error: projError } = await supabase
    .from("projects")
    .select(`
      *,
      city:cities(city_name, url_slug),
      micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `)
    .eq("micro_market_id", microMarket.id)
    .eq("city_id", microMarket.city_id)
    .eq("page_status", "published");

  if (projError) {
    console.error("[HomesFilterPage] Error fetching projects:", projError);
  }

  // Filter projects based on filter type (JavaScript filtering like hyderabad/[slug]/[category])
  const filteredProjects: ProjectWithRelations[] = (projects || [])
    .filter((p: any) => {
      // Basic status filter (published or under construction)
      const status = (p.status || "").toLowerCase();
      const completionStatus = (p.completion_status || "").toLowerCase();
      if (!status.includes("published") && !status.includes("construction") && !completionStatus.includes("construction")) {
        return false;
      }

      // Apply filter based on filterType
      if (filterType === "config") {
        const configs = parseJsonb(p.configurations, []);
        const configArray = asArray<string>(configs);
        const configMatch = configArray.length > 0
          ? configArray.some((c: string) => c?.toUpperCase().includes(filterValue.toUpperCase()))
          : p.unit_size_range?.toUpperCase().includes(filterValue.toUpperCase());
        if (!configMatch) return false;
      } else if (filterType === "type") {
        const types = parseJsonb(p.property_types, []);
        const typeArray = asArray<string>(types);
        const typeMatch = Array.isArray(typeArray)
          ? typeArray.some((t: string) => t?.toLowerCase().includes(filterValue.toLowerCase()))
          : (typeof p.property_types === 'string' && p.property_types.toLowerCase().includes(filterValue.toLowerCase()));
        if (!typeMatch) return false;
      } else if (filterType === "status") {
        const status1 = (p.completion_status || "").toLowerCase();
        const status2 = (p.status || "").toLowerCase();
        const target = filterValue.toLowerCase();
        if (!status1.includes(target) && !status2.includes(target)) return false;
      }

      return true;
    })
    .map((p: any) => {
      // Normalize relations
      if (p.city) p.city = Array.isArray(p.city) ? p.city[0] : p.city;
      if (p.micro_market) p.micro_market = Array.isArray(p.micro_market) ? p.micro_market[0] : p.micro_market;
      if (p.developer) p.developer = Array.isArray(p.developer) ? p.developer[0] : p.developer;
      return p;
    }) as ProjectWithRelations[];

  // Sort by display_order, then project_name
  filteredProjects.sort((a, b) => {
    const orderA = (a as any).display_order || 9999;
    const orderB = (b as any).display_order || 9999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.project_name || "").localeCompare(b.project_name || "");
  });

  // Fetch backup projects if needed (sparse content handling)
  let backupProjects: ProjectWithRelations[] = [];
  if (filteredProjects.length < 3) {
    try {
      const { data: backupData, error: backupError } = await supabase
        .from("projects")
        .select(`
          *,
          city:cities(city_name, url_slug),
          micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
          developer:developers(developer_name, url_slug)
        `)
        .eq("city_id", city.id)
        .neq("micro_market_id", microMarket.id)
        .eq("page_status", "published")
        .or("status.ilike.published,status.ilike.%under construction%")
        .order("display_order", { ascending: true })
        .order("project_name", { ascending: true })
        .limit(3);

      if (!backupError && backupData) {
        backupProjects = backupData.map((p: any) => {
          // Normalize relations
          if (p.city) p.city = Array.isArray(p.city) ? p.city[0] : p.city;
          if (p.micro_market) p.micro_market = Array.isArray(p.micro_market) ? p.micro_market[0] : p.micro_market;
          if (p.developer) p.developer = Array.isArray(p.developer) ? p.developer[0] : p.developer;
          return p;
        }) as ProjectWithRelations[];
      }
    } catch (err) {
      console.error("[HomesFilterPage] Error fetching backup projects:", err);
    }
  }

  // Generate page title
  const pageTitle = filterType === "config"
    ? `${filterValue} Apartments in ${microMarket.micro_market_name}`
    : filterType === "type"
    ? `Luxury ${filterValue}s in ${microMarket.micro_market_name}`
    : `${filterValue} Projects in ${microMarket.micro_market_name}`;

  // Build breadcrumbs
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: city.city_name, href: `/${city.url_slug}` },
    { label: microMarket.micro_market_name, href: `/${city.url_slug}/${microMarket.url_slug}` },
    { label: pageTitle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-base text-gray-600">
            Showing {filteredProjects.length} {filteredProjects.length === 1 ? "result" : "results"}
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} citySlug={city.url_slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 mb-12">
            No projects found matching this filter.
          </div>
        )}

        {/* Backup Projects Section (Sparse Content Handling) */}
        {backupProjects.length > 0 && (
          <>
            <hr className="my-12 border-gray-200" />
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular in {city.city_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {backupProjects.map((project) => (
                <ProjectCard key={project.id} project={project} citySlug={city.url_slug} />
              ))}
            </div>
          </>
        )}

        {/* Smart Link Grid (Recirculation) */}
        <SmartLinkGrid
          microMarketId={microMarket.id}
          cityId={city.id}
          microMarketName={microMarket.micro_market_name}
          microMarketSlug={microMarket.url_slug}
          citySlug={city.url_slug}
          cityName={city.city_name}
        />
      </div>
    </div>
  );
}

// Revalidate every hour
export const revalidate = 3600;
