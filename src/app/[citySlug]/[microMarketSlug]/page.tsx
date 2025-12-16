import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { microMarketPagesService, type MicroMarketPage, type FeaturedProject } from "@/services/microMarketPagesService";
import { projectService, ProjectWithRelations } from "@/services/projectService";
import BreadcrumbNav from "@/components/layout/BreadcrumbNav";
import { Building2, TrendingUp, MapPin, School, Hospital, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import MasterPlanSection from "@/components/micro-market/MasterPlanSection";
import InfrastructureTimeline from "@/components/micro-market/InfrastructureTimeline";
import MarketUpdateBanner from "@/components/city/MarketUpdateBanner";
import ProjectCard from "@/components/properties/ProjectCard";
import QuickFactsModule from "@/components/micro-market/QuickFactsModule";
import StrategicInfrastructureSection from "@/components/micro-market/StrategicInfrastructureSection";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { getHeroImageUrl } from "@/utils/imageOptimization";

interface PageProps {
  params: Promise<{ citySlug: string; microMarketSlug: string }>;
}

// Helper to determine the final, absolute canonical URL with fallback
const getCanonicalUrl = (pageData: MicroMarketPage | null, citySlug: string, slug: string): string => {
  if (pageData?.canonical_url) {
    return pageData.canonical_url;
  }
  return `https://www.westsiderealty.in/${citySlug}/${slug}`;
};

// Helper function to highlight financial metrics in text
const highlightMetrics = (html: string): string => {
  if (!html) return "";

  // Highlight percentage patterns (e.g., "12-15% YoY", "3.5%")
  let highlighted = html.replace(/(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%)/g, '<span class="metric-positive">$1</span>');

  // Highlight price patterns (e.g., "₹8,500", "₹12,000-₹15,000")
  highlighted = highlighted.replace(/(₹[\d,]+-?[\d,]*)/g, '<span class="metric-highlight">$1</span>');

  return highlighted;
};

// Helper function to robustly generate the final, stringified FAQ Schema content
const getFaqSchemaJsonString = (pageData: MicroMarketPage | null): string => {
  if (!pageData || (!pageData.faq_schema_json && !pageData.faqs?.length)) {
    return "";
  }

  let schemaData: any;

  // SCENARIO 1: Pre-generated content exists in faq_schema_json (PREFERRED PATH - Faster)
  if (pageData.faq_schema_json) {
    schemaData = pageData.faq_schema_json;

    // If the data is a string (TEXT column), attempt to parse it back into an object
    if (typeof schemaData === "string") {
      try {
        schemaData = JSON.parse(schemaData);
      } catch (e) {
        schemaData = null;
      }
    }
  }

  // SCENARIO 2: FALLBACK (GENERATED DYNAMICALLY from clean faqs array)
  if (!schemaData && pageData.faqs && pageData.faqs.length > 0) {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pageData.faqs.map((faq: any) => ({
        "@type": "Question",
        name: faq.question || faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer || faq.a,
        },
      })),
    };
  }

  // Final step: Ensure the data is returned as a guaranteed stringified JSON for injection
  return typeof schemaData === "object" && schemaData !== null ? JSON.stringify(schemaData) : "";
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam, microMarketSlug: microMarketSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const microMarketSlug = Array.isArray(microMarketSlugParam) ? microMarketSlugParam[0] : microMarketSlugParam;
  const pageData = await microMarketPagesService.getMicroMarketPageBySlug(microMarketSlug);

  if (!pageData) {
    return {
      title: "Micro Market Not Found",
    };
  }

  // Neopolis-specific metadata overrides
  const isNeopolis = microMarketSlug.toLowerCase() === "neopolis";
  const seoTitle = isNeopolis
    ? "Neopolis, Kokapet: Ultra-Luxury Apartments & Investment Guide | RE/MAX Westside"
    : pageData.seo_title;
  const seoDescription = isNeopolis
    ? "Discover Neopolis, Hyderabad's premier ultra-luxury hub. Find high-rise apartments and sky-villas near the Financial District with expert market analysis and RERA-verified listings."
    : pageData.meta_description;
  const canonicalUrl = isNeopolis
    ? `https://www.westsiderealty.in/${citySlug}/neopolis`
    : getCanonicalUrl(pageData, citySlug, microMarketSlug);

  return buildMetadata({
    title: seoTitle,
    description: seoDescription,
    canonicalUrl,
    keywords: pageData.seo_keywords?.join(", "),
    imageUrl: pageData.hero_image_url || undefined,
  });
}

export async function generateStaticParams() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: microMarkets } = await supabase
    .from("micro_markets")
    .select("url_slug, cities!inner(url_slug)")
    .eq("status", "published");

  return (
    microMarkets?.map((mm: any) => ({
      citySlug: mm.cities.url_slug,
      microMarketSlug: mm.url_slug,
    })) || []
  );
}

export default async function MicroMarketPage({ params }: PageProps) {
  const { citySlug: citySlugParam, microMarketSlug: microMarketSlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const microMarketSlug = Array.isArray(microMarketSlugParam) ? microMarketSlugParam[0] : microMarketSlugParam;

  const pageData = await microMarketPagesService.getMicroMarketPageBySlug(microMarketSlug);

  if (!pageData) {
    notFound();
  }

  // Fetch featured projects
  const featuredProjects = await microMarketPagesService.getFeaturedProjectsForPage(pageData.id);

  // Fetch projects for this micro-market
  const mmProjects = await projectService.getProjectsByMicroMarket(citySlug, microMarketSlug);

  // For Neopolis, show all projects; for other micro-markets, limit to 9 random projects
  const microMarketProjects =
    microMarketSlug.toLowerCase() === "neopolis"
      ? mmProjects
      : [...mmProjects].sort(() => Math.random() - 0.5).slice(0, 9);

  // Neopolis-specific metadata overrides
  const isNeopolis = microMarketSlug.toLowerCase() === "neopolis";
  const seoTitle = isNeopolis
    ? "Neopolis, Kokapet: Ultra-Luxury Apartments & Investment Guide | RE/MAX Westside"
    : pageData.seo_title;
  const seoDescription = isNeopolis
    ? "Discover Neopolis, Hyderabad's premier ultra-luxury hub. Find high-rise apartments and sky-villas near the Financial District with expert market analysis and RERA-verified listings."
    : pageData.meta_description;
  const canonicalUrl = isNeopolis
    ? `https://www.westsiderealty.in/${citySlug}/neopolis`
    : getCanonicalUrl(pageData, citySlug, microMarketSlug);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: citySlug.charAt(0).toUpperCase() + citySlug.slice(1), href: `/${citySlug}` },
    { label: pageData.micro_market_name, href: "" },
  ];

  // Generate JSON-LD schemas
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.westsiderealty.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: citySlug.charAt(0).toUpperCase() + citySlug.slice(1),
        item: `https://www.westsiderealty.in/${citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pageData.micro_market_name,
        item: canonicalUrl,
      },
    ],
  };

  const realEstateListingSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `Properties in ${pageData.micro_market_name}, ${citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
    description: seoDescription,
    url: canonicalUrl,
    image: pageData.hero_image_url || pageData.connectivity_map_url,
    address: {
      "@type": "PostalAddress",
      addressLocality: pageData.micro_market_name,
      addressRegion: citySlug.charAt(0).toUpperCase() + citySlug.slice(1),
      addressCountry: "IN",
      ...(pageData.locality_pincode && { postalCode: pageData.locality_pincode }),
    },
    ...(pageData.price_per_sqft_min &&
      pageData.price_per_sqft_max && {
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: pageData.price_per_sqft_min,
          highPrice: pageData.price_per_sqft_max,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "INR",
            unitText: "per sq.ft.",
          },
        },
      }),
    areaServed: {
      "@type": "City",
      name: citySlug.charAt(0).toUpperCase() + citySlug.slice(1),
    },
  };

  const faqSchema = getFaqSchemaJsonString(pageData);
  const jsonLdSchemas = [breadcrumbSchema, realEstateListingSchema];
  if (faqSchema) {
    try {
      jsonLdSchemas.push(JSON.parse(faqSchema));
    } catch (e) {
      // Ignore parse errors
    }
  }

  const safeImageSrc = (src: string | null | undefined) => (src && src.trim() ? src : "/placeholder.svg");

  return (
    <>
      <JsonLd jsonLd={jsonLdSchemas} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <BreadcrumbNav items={breadcrumbItems} />

          {/* Hero Section */}
          <section className="mb-12 mt-8">
            {pageData.hero_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={safeImageSrc(getHeroImageUrl(pageData.hero_image_url))}
                  alt={`Aerial view of ${pageData.micro_market_name} ultra-luxury residential township in ${pageData.key_adjacent_areas?.[0] || "West " + citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}, ${citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`}
                  width={1200}
                  height={400}
                  className="w-full h-64 object-cover"
                  priority
                />
              </div>
            )}

            <h1 className="text-4xl font-bold mb-6 text-foreground">{pageData.h1_title}</h1>
            <p
              className="text-lg text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: pageData.hero_hook || "" }}
            />

            {/* Key Stats Badges */}
            {pageData.price_per_sqft_min && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price Range</p>
                        <p className="text-xl font-bold">
                          ₹{pageData.price_per_sqft_min?.toLocaleString()} - ₹{pageData.price_per_sqft_max?.toLocaleString()}/sqft
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {pageData.annual_appreciation_min && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Annual Appreciation</p>
                          <p className="text-xl font-bold">
                            {pageData.annual_appreciation_min}% - {pageData.annual_appreciation_max}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {pageData.rental_yield_min && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Rental Yield</p>
                          <p className="text-xl font-bold">
                            {pageData.rental_yield_min}% - {pageData.rental_yield_max}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Connectivity Map */}
            {pageData.connectivity_map_url && (
              <div className="mt-8 max-w-md mx-auto">
                <div className="rounded-lg overflow-hidden shadow-md border border-border">
                  <Image
                    src={safeImageSrc(pageData.connectivity_map_url)}
                    alt={`${pageData.micro_market_name} Connectivity Map`}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Market Update Banner */}
          <MarketUpdateBanner citySlug={citySlug} microMarketSlug={microMarketSlug} />

          {/* Authority Content Block */}
          {pageData.mm_authority_content && (
            <section className="mb-8">
              <div className="authority-content-block" dangerouslySetInnerHTML={{ __html: pageData.mm_authority_content }} />
            </section>
          )}

          {/* Quick Facts Module */}
          <QuickFactsModule
            localityPincode={pageData.locality_pincode}
            pricePerSqftMin={pageData.price_per_sqft_min}
            pricePerSqftMax={pageData.price_per_sqft_max}
            keyAdjacentAreas={pageData.key_adjacent_areas}
            annualAppreciationMin={pageData.annual_appreciation_min}
            annualAppreciationMax={pageData.annual_appreciation_max}
            nearestMmtsStatus={pageData.nearest_mmts_status}
            microMarketName={pageData.micro_market_name}
          />

          {/* Growth Story */}
          {pageData.growth_story && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Why Invest in {pageData.micro_market_name}?</h2>
              <Card>
                <CardContent className="pt-6">
                  <div
                    className="prose prose-lg max-w-none rich-content"
                    dangerouslySetInnerHTML={{ __html: highlightMetrics(pageData.growth_story) }}
                  />

                  {pageData.connectivity_details && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Strategic Connectivity
                      </h3>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.connectivity_details }} />
                    </div>
                  )}

                  {pageData.infrastructure_details && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-3">Future Infrastructure</h3>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.infrastructure_details }} />
                    </div>
                  )}

                  {pageData.it_corridor_influence && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-3">IT Corridor Influence</h3>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.it_corridor_influence }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Master Plan & Zoning Section */}
          {pageData.master_plan_json && <MasterPlanSection data={pageData.master_plan_json} />}

          {/* Infrastructure Roadmap Timeline */}
          {pageData.infrastructure_json && pageData.infrastructure_json.length > 0 && (
            <InfrastructureTimeline data={pageData.infrastructure_json} />
          )}

          {/* Strategic Infrastructure & Social Amenities */}
          <StrategicInfrastructureSection
            microMarketName={pageData.micro_market_name}
            nearestMmtsStatus={pageData.nearest_mmts_status}
          />

          {/* Quick-Reference Project Table */}
          {microMarketProjects.length > 0 && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Featured Projects in {pageData.micro_market_name}</h2>

              {/* Price Trend Chart */}
              {pageData.market_analysis_chart_url && (
                <div className="chart-container mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {pageData.micro_market_name} Price Trend (2020-2025)
                  </h3>
                  <Image
                    src={safeImageSrc(pageData.market_analysis_chart_url)}
                    alt={`${pageData.micro_market_name} real estate price trend analysis chart showing year-over-year appreciation from 2020 to 2025`}
                    width={1200}
                    height={600}
                    className="mx-auto"
                    loading="lazy"
                  />
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    *Data compiled from internal market research and public records. Chart shows average price per sq. ft. trends.
                  </p>
                </div>
              )}

              <p className="text-muted-foreground mb-6">
                We specialize in showcasing the finest properties in the region. Here is a quick, at-a-glance overview of some of
                the key <strong className="metric-highlight">{pageData.micro_market_name} projects</strong> currently listed with
                us, demonstrating the variety of luxury and premium inventory available:
              </p>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="table-header-accent">
                          <TableHead className="font-bold">Project Name</TableHead>
                          <TableHead className="font-bold">Configuration</TableHead>
                          <TableHead className="font-bold">Developer</TableHead>
                          <TableHead className="font-bold">Price Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {microMarketProjects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <Link
                                href={`/${citySlug}/${microMarketSlug}/projects/${project.url_slug}`}
                                className="font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary"
                              >
                                {project.project_name}
                              </Link>
                            </TableCell>
                            <TableCell>{project.unit_size_range || "—"}</TableCell>
                            <TableCell>
                              {project.developer?.url_slug ? (
                                <Link
                                  href={`/developers/${project.developer.url_slug}`}
                                  className="text-primary/80 underline decoration-primary/30 underline-offset-2 hover:text-primary hover:decoration-primary"
                                >
                                  {project.developer.developer_name}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">{project.developer?.developer_name || "—"}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {project.price_range_text || "Enquire for Price"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Inventory Snapshot with CTA */}
          {pageData.inventory_description && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Find Your Perfect Home</h2>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: pageData.inventory_description }} />

                  {pageData.filtered_properties_url && (
                    <div className="flex justify-center">
                      <Link href={pageData.filtered_properties_url}>
                        <Button size="lg" className="text-lg px-8">
                          View All {pageData.micro_market_name} Properties
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Leading Developers Section */}
          {pageData.developer_pillar_urls && Object.keys(pageData.developer_pillar_urls).length > 0 && (
            <section className="mb-12">
              <h2 className="micro-market-h2">
                Leading Developers and Their Landmark Projects in {pageData.micro_market_name}
              </h2>
              <p className="text-muted-foreground mb-8">
                This section is your definitive guide to the developers shaping the {pageData.micro_market_name} micro-market.
                The presence of these top-tier national and regional builders confirms the area's high-value proposition, driven by
                quality construction and strategic location.
              </p>

              <div className="space-y-8">
                {Object.entries(pageData.developer_pillar_urls)
                  .sort(([, a], [, b]) => a.displayOrder - b.displayOrder)
                  .map(([key, developer]) => (
                    <Card key={key} className="overflow-hidden">
                      <CardHeader>
                        <CardTitle>
                          <div className="flex items-center gap-4">
                            {pageData.developer_logo_urls?.[developer.name] && (
                              <Image
                                src={safeImageSrc(pageData.developer_logo_urls[developer.name])}
                                alt={`${developer.name} logo`}
                                width={100}
                                height={50}
                                className="developer-logo"
                              />
                            )}
                            <h3 className="text-2xl">{developer.name}</h3>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: developer.bio }} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {developer.projects.map((project, idx) => (
                            <div key={idx} className="block">
                              <Button variant="outline" className="w-full h-auto py-4 px-4 flex flex-col items-center gap-2 cursor-default opacity-90" disabled>
                                <span className="font-semibold text-base text-center">{project.name}</span>
                                <span className="text-xs text-muted-foreground">{project.label}</span>
                                {project.status === "under-construction" && (
                                  <Badge variant="secondary" className="text-xs">
                                    U/C
                                  </Badge>
                                )}
                                {project.status === "upcoming" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Upcoming
                                  </Badge>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}

          {/* Featured Projects */}
          {featuredProjects.length > 0 && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Featured Projects in {pageData.micro_market_name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle>
                        <span className="text-foreground">{project.project_name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.project_summary && <p className="text-muted-foreground mb-4">{project.project_summary}</p>}
                      <Button variant="outline" className="w-full" disabled>
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Social Infrastructure */}
          {(pageData.top_schools?.length || pageData.top_hospitals?.length || pageData.entertainment_centers?.length) && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Essential Infrastructure</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pageData.top_schools && pageData.top_schools.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5 text-primary" />
                        Top Schools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pageData.top_schools.map((school, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {school}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {pageData.top_hospitals && pageData.top_hospitals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hospital className="h-5 w-5 text-primary" />
                        Healthcare
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pageData.top_hospitals.map((hospital, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {hospital}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {pageData.entertainment_centers && pageData.entertainment_centers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        Entertainment & Retail
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pageData.entertainment_centers.map((center, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {center}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Projects Section */}
          <section className="mb-12">
            <h2 className="micro-market-h2">Explore Projects in {pageData.micro_market_name}</h2>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Discover premium residential projects in {pageData.micro_market_name}. Each project offers world-class amenities
              and excellent investment potential.
            </p>

            {microMarketProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {microMarketProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} citySlug={citySlug} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No projects found in this micro-market.</p>
            )}
          </section>

          {/* FAQ Section */}
          {pageData.faqs && pageData.faqs.length > 0 && (
            <section className="mb-12" id="faqs">
              <h2 className="micro-market-h2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground mb-6">
                Get answers to common questions about investing in {pageData.micro_market_name}.
              </p>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {pageData.faqs.map((faq: any, idx) => {
                      const question = faq.question || faq.q;
                      const answer = faq.answer || faq.a;
                      return (
                        <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-border last:border-0">
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium text-foreground">{question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            <p className="leading-relaxed">{answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Final CTA */}
          <section className="text-center py-12 bg-primary/5 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Ready to Invest in {pageData.micro_market_name}?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Contact us today to schedule a site visit and explore the best properties in {pageData.micro_market_name}.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {pageData.filtered_properties_url && (
                <Link href={pageData.filtered_properties_url}>
                  <Button size="lg">Browse Properties</Button>
                </Link>
              )}
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <CityHubBacklink citySlug={citySlug} cityName={citySlug.charAt(0).toUpperCase() + citySlug.slice(1)} />
    </>
  );
}
