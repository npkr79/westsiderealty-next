import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { parseJsonb, safeCapitalize } from "@/lib/parse-jsonb";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import ProjectCard from "@/components/properties/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import { buildMetadata } from "@/components/common/SEO";
import type { ProjectWithRelations } from "@/services/projectService";

// --- CONFIGURATION ---
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
    description: 'Discover premium luxury villas in {market} featuring spacious layouts and exceptional investment potential.',
  },
  '3bhk-apartments': {
    config: '3BHK',
    type: 'Apartment',
    title: 'Premium 3 BHK Flats in',
    intro: 'Spacious 3 bedroom apartments with modern amenities and excellent connectivity.',
    description: 'Explore premium 3 BHK apartments in {market} with top-tier developers and strategic locations.',
  },
  'affordable-flats': {
    maxPrice: 10000000, // 1 Cr
    type: 'Apartment',
    title: 'Affordable Apartments in',
    intro: 'Budget-friendly homes offering excellent value and great investment opportunities.',
    description: 'Find affordable apartments in {market} starting from competitive prices.',
  },
  'ready-to-move': {
    status: 'Ready to Move',
    title: 'Ready to Move Projects in',
    intro: 'Move in immediately to these top projects with completed construction.',
    description: 'Browse ready-to-move projects in {market} - complete your purchase and move in immediately.',
  },
};

interface PageProps {
  params: Promise<{
    citySlug?: string; // Optional because folder might be hardcoded
    slug: string;
    category: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  // 🟢 FIX: Default to 'hyderabad' if param is missing
  const citySlug = resolvedParams.citySlug || "hyderabad";
  const { slug, category } = resolvedParams;

  const categoryConfig = CATEGORY_FILTERS[category];
  if (!categoryConfig) return { title: "Page Not Found" };

  const supabase = await createClient();
  
  // Lightweight Metadata Query
  const { data: mm } = await supabase
    .from("micro_markets")
    .select("micro_market_name")
    .eq("url_slug", slug)
    .single();

  const marketName = mm?.micro_market_name || safeCapitalize(slug);
  const cityName = safeCapitalize(citySlug);

  return buildMetadata({
    title: `${categoryConfig.title} ${marketName}, ${cityName} | RE/MAX Westside Realty`,
    description: categoryConfig.description.replace('{market}', marketName),
    canonicalUrl: `https://www.westsiderealty.in/${citySlug}/${slug}/${category}`,
  });
}

export default async function CategoryComparisonPage({ params }: PageProps) {
  const resolvedParams = await params;
  // 🟢 FIX: Default to 'hyderabad'
  const citySlug = resolvedParams.citySlug || "hyderabad";
  const { slug, category } = resolvedParams;

  console.log(`[Page] Loading: ${citySlug}/${slug}/${category}`);

  const categoryConfig = CATEGORY_FILTERS[category];
  if (!categoryConfig) notFound();

  const supabase = await createClient();

  // 1. Fetch Market & City (Single Query)
  const { data: microMarket, error: mmError } = await supabase
    .from("micro_markets")
    .select(`
      id, 
      micro_market_name, 
      url_slug, 
      city_id,
      city:cities!inner(id, city_name, url_slug)
    `)
    .eq("url_slug", slug)
    .eq("city.url_slug", citySlug) 
    .maybeSingle();

  if (mmError) console.error("[Page] Market Error:", mmError);
  if (!microMarket) notFound();
  
  const cityData = Array.isArray(microMarket.city) ? microMarket.city[0] : microMarket.city;

  // 2. Fetch Projects
  let query = supabase
    .from("projects")
    .select(`
      *,
      city:cities!inner(city_name, url_slug),
      micro_market:micro_markets!inner(micro_market_name, url_slug),
      developer:developers(developer_name, url_slug)
    `)
    .eq("micro_market_id", microMarket.id)
    .or("status.ilike.published,status.ilike.%under construction%");

  // Apply DB-level Status filter
  if (categoryConfig.status) {
    query = query.or(`completion_status.ilike.%${categoryConfig.status}%,status.ilike.%${categoryConfig.status}%`);
  }

  const { data: projects, error: projError } = await query
    .order("display_order", { ascending: true });

  if (projError) console.error("[Page] Project Error:", projError);

  // 3. Filter Logic (In-Memory)
  const filteredProjects: ProjectWithRelations[] = (projects || [])
    .filter((p: any) => {
      // Type Filter
      if (categoryConfig.type) {
        const pTypes = parseJsonb(p.property_types, []);
        const typeMatch = Array.isArray(pTypes) 
          ? pTypes.some((t: string) => t?.toLowerCase().includes(categoryConfig.type!.toLowerCase()))
          : (typeof p.property_types === 'string' && p.property_types.toLowerCase().includes(categoryConfig.type!.toLowerCase()));
        if (!typeMatch) return false;
      }
      
      // Config Filter
      if (categoryConfig.config) {
        const configs = parseJsonb(p.configurations, []);
        const configMatch = Array.isArray(configs) && configs.length > 0
          ? configs.some((c: string) => c?.toUpperCase().includes(categoryConfig.config!.toUpperCase()))
          : p.unit_size_range?.toUpperCase().includes(categoryConfig.config!.toUpperCase());
        if (!configMatch) return false;
      }
      
      // Price Filter (Min)
      if (categoryConfig.minPrice) {
        if (p.min_price && p.min_price >= categoryConfig.minPrice) return true;
        if (!p.min_price && p.price_range_text) {
           const match = p.price_range_text.match(/(\d+\.?\d*)\s*Cr/i);
           if (match && (parseFloat(match[1]) * 10000000) >= categoryConfig.minPrice) return true;
        }
        if (p.min_price && p.min_price < categoryConfig.minPrice) return false;
      }

      // Price Filter (Max)
      if (categoryConfig.maxPrice) {
        if (p.max_price && p.max_price <= categoryConfig.maxPrice) return true;
        if (p.max_price && p.max_price > categoryConfig.maxPrice) return false;
      }
      
      return true;
    }) as ProjectWithRelations[];

  // 4. Render
  const pageTitle = `${categoryConfig.title} ${microMarket.micro_market_name}`;
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: cityData.city_name, href: `/${cityData.url_slug}` },
    { label: microMarket.micro_market_name, href: `/${cityData.url_slug}/${microMarket.url_slug}` },
    { label: categoryConfig.title.replace(' in', ''), href: "" },
  ];

  const formatConfigs = (p: any) => {
    const c = parseJsonb(p.configurations, []);
    return Array.isArray(c) && c.length ? c.join(' | ') : (p.unit_size_range || 'N/A');
  };

  return (
    <>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <header className="mb-12 mt-8">
            <h1 className="text-4xl font-bold mb-6 text-foreground">{pageTitle}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {categoryConfig.intro}
            </p>
          </header>
          
          {filteredProjects.length > 0 ? (
            <>
              <section className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={{
                        ...project,
                        city: cityData,
                        micro_market: microMarket
                      }}
                      citySlug={cityData.url_slug}
                    />
                  ))}
                </div>
              </section>
              
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
                          {filteredProjects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium text-primary">
                                <Link href={`/${cityData.url_slug}/projects/${project.url_slug}`}>
                                  {project.project_name}
                                </Link>
                              </TableCell>
                              <TableCell className="font-semibold">{project.price_range_text || "Enquire"}</TableCell>
                              <TableCell className="text-muted-foreground">{formatConfigs(project)}</TableCell>
                              <TableCell className="text-muted-foreground">{project.completion_status || project.status}</TableCell>
                            </TableRow>
                          ))}
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
                  No projects found matching your criteria in {microMarket.micro_market_name}.
                </p>
                <Link href={`/${cityData.url_slug}/${microMarket.url_slug}`} className="mt-4 inline-block text-primary hover:underline">
                  View all projects in {microMarket.micro_market_name}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <CityHubBacklink citySlug={cityData.url_slug} cityName={cityData.city_name} />
    </>
  );
}

export const revalidate = 60;