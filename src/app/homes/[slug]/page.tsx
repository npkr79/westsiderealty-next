import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parseFilterSlug } from "@/lib/utils/localityStats";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ProjectCard from "@/components/properties/ProjectCard";
import SmartLinkGrid from "@/components/shared/SmartLinkGrid";
import type { ProjectWithRelations } from "@/services/projectService";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { JsonLd } from "@/components/common/SEO";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 20;

/**
 * Check if project has valid images
 */
function hasImages(project: any): boolean {
  if (project.hero_image_url || project.main_image_url) return true;
  const galleryImages = parseJsonb(project.gallery_images_json, []);
  const galleryArray = asArray<string | { url?: string; image_url?: string; src?: string }>(galleryImages);
  return galleryArray.length > 0 && galleryArray.some((img: any) => {
    const url = typeof img === 'string' ? img : (img?.url || img?.image_url || img?.src);
    return url && typeof url === 'string' && url.trim() !== '';
  });
}

/**
 * Generate page title from filter type and value
 */
function getPageTitle(filterType: "residential" | "commercial" | "price" | "status", filterValue: string, microMarketName: string, cityName: string, count?: number): string {
  const countText = count !== undefined && count > 0 ? ` - ${count} Listings` : "";
  
  if (filterType === "residential") {
    return `${filterValue} in ${microMarketName}, ${cityName}${countText} | RE/MAX`;
  } else if (filterType === "commercial") {
    const pluralType = filterValue.endsWith("s") ? filterValue : `${filterValue}s`;
    return `${pluralType} in ${microMarketName}, ${cityName}${countText} | RE/MAX`;
  } else if (filterType === "price") {
    return `Properties ${filterValue} in ${microMarketName}, ${cityName}${countText} | RE/MAX`;
  } else {
    return `${filterValue} Projects in ${microMarketName}, ${cityName}${countText} | RE/MAX`;
  }
}

/**
 * Generate page description
 */
function getPageDescription(filterType: "residential" | "commercial" | "price" | "status", filterValue: string, microMarketName: string, cityName: string, count?: number): string {
  let filterLabel = "";
  if (filterType === "residential") {
    filterLabel = filterValue;
  } else if (filterType === "commercial") {
    const pluralType = filterValue.endsWith("s") ? filterValue : `${filterValue}s`;
    filterLabel = pluralType;
  } else if (filterType === "price") {
    filterLabel = `Properties ${filterValue}`;
  } else {
    filterLabel = `${filterValue} Projects`;
  }
  
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

  // Fetch project count for metadata (simplified query to get count quickly)
  let projectCount = 0;
  try {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, property_types, min_price, completion_status, status, page_status")
      .eq("micro_market_id", microMarket.id)
      .eq("city_id", microMarket.city_id)
      .eq("page_status", "published");
    
    // Apply same filtering logic as main page
    if (projects && projects.length > 0) {
      const filtered = projects.filter((p: any) => {
        const status = (p.status || "").toLowerCase();
        const completionStatus = (p.completion_status || "").toLowerCase();
        if (!status.includes("published") && !status.includes("construction") && !completionStatus.includes("construction")) {
          return false;
        }

        if (filterType === "residential") {
          const types = parseJsonb(p.property_types, []);
          const typeArray = asArray<string>(types);
          return typeArray.some((t: string) => {
            const normalizedType = t.toLowerCase().replace(/^luxury\s+/i, "").trim();
            return normalizedType.includes(filterValue.toLowerCase()) || 
                   t.toLowerCase().includes(filterValue.toLowerCase());
          });
        } else if (filterType === "commercial") {
          const types = parseJsonb(p.property_types, []);
          const typeArray = asArray<string>(types);
          return typeArray.some((t: string) => {
            const normalizedType = t.toLowerCase().replace(/^luxury\s+/i, "").trim();
            return normalizedType.includes(filterValue.toLowerCase()) ||
                   t.toLowerCase().includes(filterValue.toLowerCase());
          });
        } else if (filterType === "price") {
          const priceText = filterValue.toLowerCase();
          const projectPrice = p.min_price || 0;
          if (priceText.includes("under 1")) return projectPrice < 10000000;
          if (priceText.includes("1-2")) return projectPrice >= 10000000 && projectPrice < 20000000;
          if (priceText.includes("2-3")) return projectPrice >= 20000000 && projectPrice < 30000000;
          if (priceText.includes("3-5")) return projectPrice >= 30000000 && projectPrice < 50000000;
          if (priceText.includes("5+")) return projectPrice >= 50000000;
          return false;
        } else if (filterType === "status") {
          const status1 = (p.completion_status || "").toLowerCase();
          const status2 = (p.status || "").toLowerCase();
          const target = filterValue.toLowerCase();
          return status1.includes(target) || status2.includes(target);
        }
        return true;
      });
      projectCount = filtered.length;
    }
  } catch (error) {
    console.error("[generateMetadata] Error fetching project count:", error);
  }

  const pageTitle = getPageTitle(filterType, filterValue, microMarket.micro_market_name, city.city_name, projectCount);
  const pageDescription = getPageDescription(filterType, filterValue, microMarket.micro_market_name, city.city_name, projectCount);
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

export default async function HomesFilterPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const parsed = parseFilterSlug(slug);

  if (!parsed) {
    notFound();
  }

  const { filterType, filterValue, microMarketSlug } = parsed;
  const supabase = await createClient();

  // Get current page number
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));

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

  // Filter projects based on filter type
  let filteredProjects: ProjectWithRelations[] = (projects || [])
    .filter((p: any) => {
      // Basic status filter (published or under construction)
      const status = (p.status || "").toLowerCase();
      const completionStatus = (p.completion_status || "").toLowerCase();
      if (!status.includes("published") && !status.includes("construction") && !completionStatus.includes("construction")) {
        return false;
      }

      // Apply filter based on filterType
      if (filterType === "residential") {
        const types = parseJsonb(p.property_types, []);
        const typeArray = asArray<string>(types);
        const typeMatch = typeArray.some((t: string) => {
          const normalizedType = t.toLowerCase().replace(/^luxury\s+/i, "").trim();
          return normalizedType.includes(filterValue.toLowerCase()) || 
                 t.toLowerCase().includes(filterValue.toLowerCase());
        });
        if (!typeMatch) return false;
      } else if (filterType === "commercial") {
        const types = parseJsonb(p.property_types, []);
        const typeArray = asArray<string>(types);
        const typeMatch = typeArray.some((t: string) => {
          const normalizedType = t.toLowerCase().replace(/^luxury\s+/i, "").trim();
          return normalizedType.includes(filterValue.toLowerCase()) ||
                 t.toLowerCase().includes(filterValue.toLowerCase());
        });
        if (!typeMatch) return false;
      } else if (filterType === "price") {
        // Parse price range from filterValue (e.g., "Under 1 Cr", "1-2 Cr")
        const priceText = filterValue.toLowerCase();
        const projectPrice = p.min_price || 0; // FIXED: Use min_price instead of price_min
        
        if (priceText.includes("under 1")) {
          if (projectPrice >= 10000000) return false;
        } else if (priceText.includes("1-2")) {
          if (projectPrice < 10000000 || projectPrice >= 20000000) return false;
        } else if (priceText.includes("2-3")) {
          if (projectPrice < 20000000 || projectPrice >= 30000000) return false;
        } else if (priceText.includes("3-5")) {
          if (projectPrice < 30000000 || projectPrice >= 50000000) return false;
        } else if (priceText.includes("5+")) {
          if (projectPrice < 50000000) return false;
        }
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

  // Sort by image availability first (projects with images at top), then display_order, then project_name
  filteredProjects.sort((a, b) => {
    const aHasImages = hasImages(a);
    const bHasImages = hasImages(b);
    if (aHasImages !== bHasImages) {
      return bHasImages ? 1 : -1; // Projects with images first
    }
    const orderA = (a as any).display_order || 9999;
    const orderB = (b as any).display_order || 9999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.project_name || "").localeCompare(b.project_name || "");
  });

  // Calculate pagination
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Fetch backup projects if needed (sparse content handling) - only on first page
  let backupProjects: ProjectWithRelations[] = [];
  if (currentPage === 1 && paginatedProjects.length < 3) {
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
  let pageTitle = "";
  if (filterType === "residential") {
    pageTitle = `${filterValue} in ${microMarket.micro_market_name}`;
  } else if (filterType === "commercial") {
    const pluralType = filterValue.endsWith("s") ? filterValue : `${filterValue}s`;
    pageTitle = `${pluralType} in ${microMarket.micro_market_name}`;
  } else if (filterType === "price") {
    pageTitle = `Properties ${filterValue} in ${microMarket.micro_market_name}`;
  } else {
    pageTitle = `${filterValue} Projects in ${microMarket.micro_market_name}`;
  }

  // Build breadcrumbs
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: city.city_name, href: `/${city.url_slug}` },
    { label: microMarket.micro_market_name, href: `/${city.url_slug}/${microMarket.url_slug}` },
    { label: pageTitle },
  ];

  // Generate pagination URLs
  const getPageUrl = (page: number) => {
    if (page === 1) return `/homes/${slug}`;
    return `/homes/${slug}?page=${page}`;
  };

  // Build JSON-LD schemas
  const canonicalUrl = `https://www.westsiderealty.in/homes/${slug}`;
  
  // ItemList schema for collection page
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    numberOfItems: totalItems,
    itemListElement: paginatedProjects.map((project, index) => {
      const projectCity = (project as any).city;
      const citySlug = projectCity?.url_slug || city.url_slug;
      const projectUrl = `https://www.westsiderealty.in/${citySlug}/projects/${project.url_slug}`;
      
      return {
        "@type": "ListItem",
        position: startIndex + index + 1,
        url: projectUrl,
        name: project.project_name || "Project",
      };
    }),
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `https://www.westsiderealty.in${item.href}` : canonicalUrl,
    })),
  };

  return (
    <>
      <JsonLd jsonLd={[itemListSchema, breadcrumbSchema]} />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BreadcrumbNav items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-base text-gray-600">
            Showing {totalItems} {totalItems === 1 ? "result" : "results"}
          </p>
        </div>

        {/* Projects Grid */}
        {paginatedProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {paginatedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} citySlug={city.url_slug} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination className="mb-12">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href={getPageUrl(currentPage - 1)} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink href={getPageUrl(page)} isActive={page === currentPage}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext href={getPageUrl(currentPage + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
    </>
  );
}

// Revalidate every hour
export const revalidate = 3600;
