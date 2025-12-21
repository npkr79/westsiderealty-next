import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cityService, CityInfo } from "@/services/cityService";
import { projectService, ProjectInfo } from "@/services/projectService";
import { goaHolidayPropertyService } from "@/services/goaHolidayPropertyService";
import { microMarketService, MicroMarketGridItem } from "@/services/microMarketService";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";
import type { UnifiedProperty } from "@/types/unifiedProperty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, MapPin, Building2 } from "lucide-react";
import ProjectCard from "@/components/properties/ProjectCard";
import GoaPropertyCard from "@/components/properties/GoaPropertyCard";
import CityLifestyleHub from "@/components/city/CityLifestyleHub";
import CityOverviewSection from "@/components/city/CityOverviewSection";
import BuyerPersonasSection from "@/components/city/BuyerPersonasSection";
import MarketTrendsSection from "@/components/city/MarketTrendsSection";
import WhyInvestSection from "@/components/city/WhyInvestSection";
import HyderabadInvestmentGuide from "@/components/city/HyderabadInvestmentGuide";
import MicroMarketGrid from "@/components/city/MicroMarketGrid";
import CityFAQSchema from "@/components/seo/CityFAQSchema";
import CityFAQSection from "@/components/city/CityFAQSection";
import MarketPulseBanner from "@/components/city/MarketPulseBanner";
import MarketUpdateBanner from "@/components/city/MarketUpdateBanner";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const city = await cityService.getCityBySlug(citySlug);

  if (!city) {
    return {
      title: "City Not Found",
    };
  }

  const canonicalUrl = city.canonical_url || `https://www.westsiderealty.in/${citySlug}`;

  return buildMetadata({
    title: city.seo_title,
    description: city.meta_description,
    canonicalUrl,
    imageUrl: city.hero_image_url || undefined,
  });
}

export async function generateStaticParams() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("url_slug")
    .eq("page_status", "published");

  return cities?.map((city) => ({ citySlug: city.url_slug })) || [];
}

export default async function CityPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  const slug = citySlug || "hyderabad";

  // First, check if this is a landing page
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: landingPage, error: landingPageError } = await supabase
    .from("landing_pages")
    .select("uri, status")
    .eq("uri", slug)
    .eq("status", "published")
    .maybeSingle();

  if (landingPageError) {
    console.error("[CityPage] Error checking for landing page:", landingPageError);
  }

  if (landingPage) {
    // Redirect to the /landing/[slug] route to use the proper landing page component
    const { redirect } = await import("next/navigation");
    redirect(`/landing/${slug}`);
  }

  const city = await cityService.getCityBySlug(slug);

  if (!city) {
    notFound();
  }

  // Fetch data based on city type
  let featuredProjects: ProjectInfo[] = [];
  let featuredGoaProperties: UnifiedProperty[] = [];
  let microMarkets: MicroMarketGridItem[] = [];
  let totalListings = 0;

  // Check if this is Goa city
  if (city.city_name.toLowerCase() === "goa") {
    // Fetch featured Goa properties using UnifiedPropertyService
    featuredGoaProperties = await UnifiedPropertyService.getProperties('goa');
    featuredGoaProperties = featuredGoaProperties
      .filter(p => p.is_featured)
      .slice(0, 6);
    
    // Also fetch projects for Goa if they exist
    const goaProjects = await projectService.getProjectsByCity(city.id, true);
    featuredProjects = goaProjects.slice(0, 6);
  } else {
    // Fetch featured projects for other cities
    const projects = await projectService.getProjectsByCity(city.id, true);
    featuredProjects = projects.slice(0, 6);

    // Fetch micro-markets for the city
    const markets = await microMarketService.getMicroMarketsByCity(slug);
    microMarkets = Array.isArray(markets) ? markets : [];

    // Fetch total property count for Hyderabad
    if (slug === "hyderabad") {
      totalListings = await cityService.getPublishedPropertyCount(slug);
    }
  }

  const marketSnapshot = city.market_snapshot_json || {};
  const featuredMicromarkets = Array.isArray(city.featured_micromarkets_json) ? city.featured_micromarkets_json : [];
  const propertyTypes = Array.isArray(city.top_property_types_json) ? city.top_property_types_json : [];
  const faqs = Array.isArray(city.city_faqs_json) ? city.city_faqs_json : [];

  // Generate canonical URL
  const canonicalUrl = city.canonical_url || `https://www.westsiderealty.in/${slug}`;

  // Generate JSON-LD structured data
  const cityJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: city.h1_title || `Real Estate in ${city.city_name}`,
    description: city.meta_description,
    url: canonicalUrl,
    areaServed: Array.isArray(microMarkets) ? microMarkets.map((m) => m.micro_market_name) : [],
    provider: {
      "@type": "RealEstateAgent",
      name: "RE/MAX Westside Realty",
      url: "https://www.westsiderealty.in",
      address: {
        "@type": "PostalAddress",
        addressLocality: city.city_name,
        addressCountry: city.country || "IN",
      },
    },
  };

  // Breadcrumb structured data
  const breadcrumbJsonLd = {
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
        name: city.city_name,
        item: canonicalUrl,
      },
    ],
  };

  const safeImageSrc = (src: string | null | undefined) =>
    src && src.trim() ? src : "/fallback-hero.jpg";

  return (
    <>
      {/* FAQ Schema for all cities */}
      {Array.isArray(faqs) && faqs.length > 0 && <CityFAQSchema faqData={faqs} />}

      <JsonLd jsonLd={[cityJsonLd, breadcrumbJsonLd]} />

      {/* Hero Section */}
      <section className="relative py-0 overflow-hidden">
        <div className="relative h-[60vh] w-full">
          <Image
            src={safeImageSrc(city.hero_image_url)}
            alt={`${city.city_name} Real Estate`}
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

          {/* Hero content */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="container mx-auto">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold text-white mb-4">
                  {city.country}
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                  {city.h1_title}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
                  {city.hero_hook}
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
                    asChild
                  >
                    <Link
                      href={
                        city.city_name.toLowerCase() === "goa"
                          ? "/goa/buy"
                          : `/${slug}/buy`
                      }
                    >
                      View All Properties <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
                    asChild
                  >
                    <Link href="/contact">Talk to Our Team</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Stats Bar - Hyderabad Only */}
      {slug === "hyderabad" && (
        <section className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-b border-border py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {city.average_price_sqft && (
                <div className="px-4 py-2 rounded-lg bg-background border border-border shadow-sm">
                  <span className="text-sm font-semibold text-foreground">
                    ₹{city.average_price_sqft.toLocaleString()} Avg. Price/sft
                  </span>
                </div>
              )}
              {totalListings > 0 && (
                <div className="px-4 py-2 rounded-lg bg-background border border-border shadow-sm">
                  <span className="text-sm font-semibold text-foreground">
                    {totalListings}+ Active Properties
                  </span>
                </div>
              )}
              {microMarkets.length > 0 && (() => {
                const neopolis = microMarkets.find(mm => mm.micro_market_name?.toLowerCase().includes('neopolis'));
                if (neopolis) {
                  return (
                    <div className="px-4 py-2 rounded-lg bg-background border border-border shadow-sm">
                      <span className="text-sm font-semibold text-foreground">
                        Neopolis (+15% YoY) Top Growth Area
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Market Pulse Banner - Hyderabad Only */}
      {slug === "hyderabad" && microMarkets.length > 0 && (
        <MarketPulseBanner microMarkets={microMarkets} totalListings={totalListings} />
      )}

      {/* Market Update Banner */}
      {slug === "hyderabad" && <MarketUpdateBanner citySlug={slug} />}

      {/* Market Snapshot */}
      {(city.average_price_sqft || city.annual_appreciation_pct || city.rental_yield_pct) && (
        <section className="py-16 bg-secondary/10">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[hsl(var(--heading-blue))]">
              Market Snapshot
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {city.average_price_sqft && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Building2 className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <p className="text-3xl font-bold mb-2">₹{city.average_price_sqft.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Avg. Price per Sq.Ft.</p>
                  </CardContent>
                </Card>
              )}
              {city.annual_appreciation_pct && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <p className="text-3xl font-bold mb-2">{city.annual_appreciation_pct}%</p>
                    <p className="text-sm text-muted-foreground">Annual Appreciation</p>
                  </CardContent>
                </Card>
              )}
              {city.rental_yield_pct && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <MapPin className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <p className="text-3xl font-bold mb-2">{city.rental_yield_pct}%</p>
                    <p className="text-sm text-muted-foreground">Rental Yield</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* City Overview Section */}
      {city.city_overview_sections_json && (
        <CityOverviewSection overviewData={city.city_overview_sections_json as any} />
      )}

      {/* City Lifestyle Hub */}
      {city.lifestyle_infrastructure_json && (
        <CityLifestyleHub lifestyleData={city.lifestyle_infrastructure_json as any} cityName={city.city_name} />
      )}

      {/* Why Invest Section */}
      <WhyInvestSection cityName={city.city_name} cityData={city} />

      {/* Buyer Personas Section */}
      {Array.isArray(city.buyer_personas_json) && city.buyer_personas_json.length > 0 && (
        <BuyerPersonasSection personas={city.buyer_personas_json} cityName={city.city_name} />
      )}

      {/* Market Trends Section */}
      {city.market_trends_json && (
        <MarketTrendsSection
          trends={city.market_trends_json}
          cityName={city.city_name}
          cityData={{
            average_price_sqft: city.average_price_sqft,
            annual_appreciation_pct: city.annual_appreciation_pct,
            rental_yield_pct: city.rental_yield_pct,
          }}
        />
      )}

      {/* Micro-Markets Grid */}
      <MicroMarketGrid microMarkets={microMarkets} citySlug={slug} />

      {/* Hyderabad Investment Guide - from investment_zones_json */}
      {slug === "hyderabad" && city.investment_zones_json && (
        <HyderabadInvestmentGuide zones={city.investment_zones_json} />
      )}

      {/* Featured Developers - Removed per requirements */}

      {/* Featured Projects - for cities with regular projects */}
      {featuredProjects.length > 0 && (
        <section className="py-16 bg-secondary/10">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))] mb-8 text-center">
              Featured Projects in {city.city_name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} citySlug={slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Properties - for Goa */}
      {featuredGoaProperties.length > 0 && (
        <section className="py-16 bg-secondary/10">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))] mb-8 text-center">
              Featured Properties in {city.city_name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGoaProperties.map((property) => (
                <GoaPropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button variant="outline" asChild>
                <Link href="/goa/buy">View All Properties</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Micro-Markets */}
      {featuredMicromarkets.length > 0 && (
        <section className="py-16">
          <div className="container px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--heading-blue))]">Popular Micro-Markets</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredMicromarkets.map((mm: any, idx: number) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{mm.name}</h3>
                    {mm.description && <p className="text-sm text-muted-foreground">{mm.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {Array.isArray(faqs) && faqs.length > 0 && (
        <CityFAQSection faqs={faqs} cityName={city.city_name} />
      )}

    </>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
