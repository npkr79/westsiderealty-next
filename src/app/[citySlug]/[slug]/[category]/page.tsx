import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { microMarketPagesService } from "@/services/microMarketPagesService";
import { parseJsonb, asArray, safeCapitalize } from "@/lib/parse-jsonb";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ProjectCard from "@/components/properties/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import { buildMetadata } from "@/components/common/SEO";
import type { ProjectWithRelations } from "@/services/projectService";

// Category Filter Configuration
const CATEGORY_FILTERS: Record<string, {
  type?: string;
  config?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  title: string;
  intro: string;
  description: string;
}> = {
  'luxury-villas': {
    type: 'Villa',
    minPrice: 30000000, // 3 Cr
    title: 'Luxury Villas for Sale in',
    intro: 'Exclusive gated community villas offering premium lifestyle and world-class amenities.',
    description: 'Discover premium luxury villas in {market} featuring spacious layouts, modern design, and exceptional investment potential.',
  },
  '3bhk-apartments': {
    config: '3BHK',
    type: 'Apartment',
    title: 'Premium 3 BHK Flats in',
    intro: 'Spacious 3 bedroom apartments with modern amenities and excellent connectivity.',
    description: 'Explore premium 3 BHK apartments in {market} with top-tier developers, strategic locations, and high appreciation potential.',
  },
  'affordable-flats': {
    maxPrice: 10000000, // 1 Cr
    type: 'Apartment',
    title: 'Affordable Apartments in',
    intro: 'Budget-friendly homes offering excellent value and great investment opportunities.',
    description: 'Find affordable apartments in {market} starting from competitive prices with quality construction and modern amenities.',
  },
  'ready-to-move': {
    status: 'Ready to Move',
    title: 'Ready to Move Projects in',
    intro: 'Move in immediately to these top projects with completed construction and immediate possession.',
    description: 'Browse ready-to-move projects in {market} - complete your purchase and move in immediately with no waiting period.',
  },
};

interface PageProps {
  params: Promise<{
    citySlug: string;
    slug: string;
    category: string;
  }>;
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug, slug, category } = await params;
  
  // Validate category
  const categoryConfig = CATEGORY_FILTERS[category];
  if (!categoryConfig) {
    return {
      title: "Page Not Found",
    };
  }
  
  // Fetch micro market details
  const microMarket = await microMarketPagesService.getMicroMarketPageBySlug(slug, citySlug);
  if (!microMarket) {
    return {
      title: "Page Not Found",
    };
  }
  
  const marketName = microMarket.micro_market_name;
  const cityName = safeCapitalize(citySlug) || "City";
  const title = `${categoryConfig.title} ${marketName}, ${cityName} | RE/MAX Westside Realty`;
  const description = categoryConfig.description.replace('{market}', marketName);
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/${slug}/${category}`;
  
  return buildMetadata({
    title,
    description,
    canonicalUrl,
  });
}

export default async function CategoryComparisonPage({ params }: PageProps) {
  const { citySlug, slug, category } = await params;
  
  // Normalize params
  const safeCitySlug = typeof citySlug === "string" ? citySlug : "";
  const safeSlug = typeof slug === "string" ? slug : "";
  const safeCategory = typeof category === "string" ? category : "";
  
  // Validate category
  const categoryConfig = CATEGORY_FILTERS[safeCategory];
  if (!categoryConfig) {
    notFound();
  }
  
  // Fetch micro market details - the slug should be a micro-market slug
  const microMarket = await microMarketPagesService.getMicroMarketPageBySlug(safeSlug, safeCitySlug);
  if (!microMarket) {
    notFound();
  }
  
  // Get city and micro market IDs
  const supabase = await createClient();
  
  // Get city
  const { data: city } = await supabase
    .from("cities")
    .select("id, city_name, url_slug")
    .eq("url_slug", safeCitySlug)
    .maybeSingle();
  
  if (!city) {
    notFound();
  }
  
  // Get micro market with city_id
  const { data: mm } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, url_slug, city_id")
    .eq("url_slug", safeSlug)
    .eq("city_id", city.id)
    .maybeSingle();
  
  if (!mm) {
    notFound();
  }
  
  // Build query for filtered projects
  let query = supabase
    .from("projects")
    .select(`
      *,
      city:cities!inner(city_name, url_slug),
      micro_market:micro_markets!projects_micromarket_id_fkey!inner(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `)
    .eq("city_id", city.id)
    .eq("micro_market_id", mm.id)
    .or("status.ilike.published,status.ilike.%under construction%");
  
  // Apply category filters - Note: JSONB filtering in Supabase can be complex
  // We'll do server-side filtering where possible and client-side filtering for JSONB fields
  
  // Basic filters that work with Supabase
  if (categoryConfig.status) {
    // Filter by completion status
    query = query.or(`completion_status.ilike.%${categoryConfig.status}%,status.ilike.%${categoryConfig.status}%`);
  }
  
  const { data: projects, error } = await query
    .order("display_order", { ascending: true })
    .order("project_name", { ascending: true });
  
  if (error) {
    console.error("[CategoryComparisonPage] Error fetching projects:", error);
  }
  
  const filteredProjects: ProjectWithRelations[] = (projects || [])
    .filter((p: any) => {
      // Client-side filtering for JSONB fields and complex logic
      
      // Filter by property type
      if (categoryConfig.type) {
        const propertyTypes = parseJsonb(p.property_types, []);
        if (Array.isArray(propertyTypes) && propertyTypes.length > 0) {
          // Check if any property type matches (case-insensitive)
          const hasType = propertyTypes.some((type: string) => 
            type?.toLowerCase().includes(categoryConfig.type!.toLowerCase())
          );
          if (!hasType) return false;
        } else if (typeof p.property_types === 'string') {
          // If it's a string, check direct match
          if (!p.property_types.toLowerCase().includes(categoryConfig.type.toLowerCase())) {
            return false;
          }
        }
      }
      
      // Filter by configuration
      if (categoryConfig.config) {
        const configs = parseJsonb(p.configurations, []);
        if (Array.isArray(configs) && configs.length > 0) {
          // Check if configuration matches (case-insensitive)
          const hasConfig = configs.some((config: string) => 
            config?.toUpperCase().includes(categoryConfig.config!.toUpperCase())
          );
          if (!hasConfig) return false;
        } else if (p.unit_size_range) {
          // Check unit_size_range if configurations is not available
          if (!p.unit_size_range.toUpperCase().includes(categoryConfig.config.toUpperCase())) {
            return false;
          }
        }
      }
      
      // Filter by price range (client-side fallback)
      if (categoryConfig.minPrice) {
        const minPrice = (p as any).min_price;
        if (minPrice && minPrice < categoryConfig.minPrice) {
          return false;
        }
        // Also check price_range_text for approximate matching
        if (!minPrice && p.price_range_text) {
          // Try to extract price from text (e.g., "3 Cr - 5 Cr")
          const priceMatch = p.price_range_text.match(/(\d+\.?\d*)\s*Cr/i);
          if (priceMatch) {
            const priceInCr = parseFloat(priceMatch[1]);
            const priceInRupees = priceInCr * 10000000;
            if (priceInRupees < categoryConfig.minPrice) {
              return false;
            }
          }
        }
      }
      
      if (categoryConfig.maxPrice) {
        const maxPrice = (p as any).max_price;
        if (maxPrice && maxPrice > categoryConfig.maxPrice) {
          return false;
        }
        // Also check price_range_text for approximate matching
        if (!maxPrice && p.price_range_text) {
          const priceMatch = p.price_range_text.match(/(\d+\.?\d*)\s*Cr/i);
          if (priceMatch) {
            const priceInCr = parseFloat(priceMatch[1]);
            const priceInRupees = priceInCr * 10000000;
            if (priceInRupees > categoryConfig.maxPrice) {
              return false;
            }
          }
        }
      }
      
      // Filter by status (already done in query, but double-check)
      if (categoryConfig.status) {
        const status = (p as any).completion_status || p.status;
        if (status && !status.toLowerCase().includes(categoryConfig.status.toLowerCase())) {
          return false;
        }
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
  
  const marketName = microMarket.micro_market_name;
  const cityName = safeCapitalize(safeCitySlug) || "City";
  const pageTitle = `${categoryConfig.title} ${marketName}`;
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: cityName, href: `/${safeCitySlug}` },
    { label: marketName, href: `/${safeCitySlug}/${safeSlug}` },
    { label: categoryConfig.title.replace(' in', ''), href: "" },
  ];
  
  // Format configurations for display
  const formatConfigs = (project: ProjectWithRelations): string => {
    if ((project as any).configurations) {
      const configs = parseJsonb((project as any).configurations, []);
      if (Array.isArray(configs) && configs.length > 0) {
        return configs.join(' | ');
      }
    }
    return project.unit_size_range || 'N/A';
  };
  
  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Header */}
          <header className="mb-12 mt-8">
            <h1 className="text-4xl font-bold mb-6 text-foreground">{pageTitle}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {categoryConfig.intro}
            </p>
          </header>
          
          {/* Project Grid */}
          {filteredProjects.length > 0 ? (
            <>
              <section className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => {
                    const projectCity = Array.isArray(project.city) ? project.city[0] : project.city;
                    const projectCitySlug = projectCity?.url_slug || safeCitySlug;
                    const validProjectSlug = project.url_slug || project.id;
                    
                    return (
                      <ProjectCard
                        key={project.id}
                        project={{
                          id: project.id,
                          project_name: project.project_name,
                          url_slug: validProjectSlug,
                          hero_image_url: project.hero_image_url,
                          price_range_text: project.price_range_text,
                          status: project.status || (project as any).completion_status || null,
                          city: projectCity || { city_name: safeCitySlug, url_slug: safeCitySlug },
                          micro_market: Array.isArray(project.micro_market) ? project.micro_market[0] : project.micro_market,
                          developer: Array.isArray(project.developer) ? project.developer[0] : project.developer,
                        }}
                        citySlug={projectCitySlug}
                      />
                    );
                  })}
                </div>
              </section>
              
              {/* Comparison Table */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Compare Projects</h2>
                <Card>
                  <CardContent className="pt-6 p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="table-header-accent">
                            <TableHead className="font-bold">Project Name</TableHead>
                            <TableHead className="font-bold">Price Range</TableHead>
                            <TableHead className="font-bold">Configurations</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProjects.map((project) => {
                            const projectCity = Array.isArray(project.city) ? project.city[0] : project.city;
                            const projectCitySlug = projectCity?.url_slug || safeCitySlug;
                            const validProjectSlug = project.url_slug || project.id;
                            
                            return (
                              <TableRow key={project.id}>
                                <TableCell>
                                  {validProjectSlug ? (
                                    <Link
                                      href={`/${projectCitySlug}/projects/${validProjectSlug}`}
                                      className="font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary hover:text-primary transition-colors"
                                    >
                                      {project.project_name || "Project"}
                                    </Link>
                                  ) : (
                                    <span className="font-medium text-foreground">{project.project_name || "Project"}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-foreground">
                                    {project.price_range_text || "Enquire for Price"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-muted-foreground">
                                    {formatConfigs(project)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-muted-foreground">
                                    {project.status || (project as any).completion_status || "N/A"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No projects found matching your criteria in {marketName}.
                </p>
                <Link href={`/${safeCitySlug}/${safeSlug}`} className="mt-4 inline-block">
                  <span className="text-primary hover:underline">View all projects in {marketName}</span>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <CityHubBacklink citySlug={safeCitySlug} cityName={cityName} />
    </>
  );
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;
