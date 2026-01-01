import { notFound, redirect } from "next/navigation";
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
import NeopolisEditorialContent from "@/components/micro-market/NeopolisEditorialContent";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { getHeroImageUrl } from "@/utils/imageOptimization";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";

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
  if (!schemaData && Array.isArray(pageData.faqs) && pageData.faqs.length > 0) {
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
  const pageData = await microMarketPagesService.getMicroMarketPageBySlug(microMarketSlug, citySlug);

  if (!pageData) {
    return {
      title: "Micro Market Not Found",
    };
  }

  // Neopolis-specific metadata overrides
  const isNeopolis = microMarketSlug.toLowerCase() === "neopolis";
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  
  // SEO-optimized title and description for Neopolis
  const seoTitle = isNeopolis
    ? "Neopolis Hyderabad – Kokapet Projects, Prices, Map, HMDA & Buyer Guide | RE/MAX"
    : pageData.seo_title || `${pageData.micro_market_name} ${cityName}: Real Estate Prices, Trends & Master Plan | RE/MAX`;
  
  const seoDescription = isNeopolis
    ? "Neopolis Hyderabad (Kokapet) buyer guide: HMDA-planned layout, infrastructure, price trends, top luxury projects (My Home, Rajapushpa, Prestige, Sattva, Brigade, MSN), RERA details, map and FAQs."
    : pageData.meta_description;
  
  const canonicalUrl = isNeopolis
    ? `https://www.westsiderealty.in/${citySlug}/neopolis`
    : getCanonicalUrl(pageData, citySlug, microMarketSlug);

  // Priority order for OG image:
  // 1. Micro-market hero image
  // 2. Connectivity map image
  // 3. City hero image (high-quality banner)
  // 4. Fallback to default (only if none available)
  let ogImageUrl: string | undefined;
  if (pageData.hero_image_url) {
    ogImageUrl = pageData.hero_image_url;
  } else if (pageData.connectivity_map_url) {
    ogImageUrl = pageData.connectivity_map_url;
  } else {
    // Fetch city hero image as fallback
    const { cityService } = await import("@/services/cityService");
    const city = await cityService.getCityBySlug(citySlug);
    if (city?.hero_image_url) {
      ogImageUrl = city.hero_image_url;
    }
  }

  // Optimize OG image
  const optimizedOgImage = ogImageUrl
    ? optimizeSupabaseImage(ogImageUrl, { width: 1200, height: 630, quality: 80, format: "webp" })
    : "https://www.westsiderealty.in/placeholder.svg";

  // Handle seo_keywords - could be array or string
  const keywordsString = Array.isArray(pageData.seo_keywords)
    ? pageData.seo_keywords.join(", ")
    : typeof pageData.seo_keywords === "string"
    ? pageData.seo_keywords
    : undefined;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: keywordsString,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: optimizedOgImage,
          width: 1200,
          height: 630,
          alt: `${pageData.micro_market_name} ${cityName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [optimizedOgImage],
    },
  };
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

  // Try to resolve as a micro-market first (pass citySlug to ensure correct city match)
  const pageData = await microMarketPagesService.getMicroMarketPageBySlug(microMarketSlug, citySlug);

  if (!pageData) {
    // If no micro-market page found, this might be an old or direct property URL like:
    // /hyderabad/3bhk-apartment-for-sale-in-hallmark-treasor-kokapet
    // Try to find a matching property slug and redirect to /[citySlug]/buy/[listingSlug]
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      // Determine property table based on city
      const tableName =
        citySlug === "hyderabad"
          ? "hyderabad_properties"
          : citySlug === "goa"
          ? "goa_holiday_properties"
          : citySlug === "dubai"
          ? "dubai_properties"
          : null;

      if (tableName) {
        // Check direct match in current properties (seo_slug or slug)
        const { data: property } = await supabase
          .from(tableName)
          .select("seo_slug, slug")
          .or(`seo_slug.eq.${microMarketSlug},slug.eq.${microMarketSlug}`)
          .maybeSingle();

        if (property) {
          redirect(`/${citySlug}/buy/${microMarketSlug}`);
        }

        // Check redirects table for legacy slugs
        const { data: redirectRow } = await supabase
          .from("property_slug_redirects")
          .select("new_slug")
          .eq("old_slug", microMarketSlug)
          .eq("location", citySlug)
          .maybeSingle();

        if (redirectRow?.new_slug) {
          redirect(`/${citySlug}/buy/${redirectRow.new_slug}`);
        }
      }
    } catch (error) {
      console.error("[MicroMarketPage] Error checking property redirect for slug:", microMarketSlug, error);
    }

    // If still unresolved, return a 404
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
    ? "Neopolis Hyderabad: Kokapet Projects, Prices & Master Plan | RE/MAX"
    : pageData.seo_title;
  const seoDescription = isNeopolis
    ? "The ultimate guide to Neopolis Hyderabad. Explore master plans, record-breaking auction prices, and luxury project listings (Prestige, My Home) by RE/MAX."
    : pageData.meta_description;
  const canonicalUrl = isNeopolis
    ? `https://www.westsiderealty.in/${citySlug}/neopolis`
    : getCanonicalUrl(pageData, citySlug, microMarketSlug);
  
  // Neopolis-specific H1 override - single primary H1 for SEO
  // Aligned with title tag for stronger topical alignment
  const h1Title = isNeopolis
    ? "Neopolis Hyderabad – Projects, Prices, Auctions & Buyer Guide"
    : pageData.h1_title;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: citySlug.charAt(0).toUpperCase() + citySlug.slice(1), href: `/${citySlug}` },
    { label: pageData.micro_market_name, href: "" },
  ];

  // Parse FAQ data - include Neopolis-specific FAQs if applicable
  let faqItems: { question: string; answer: string }[] = [];
  
  // For Neopolis, use consolidated FAQs (8-12 strong questions)
  // All FAQs here will appear in both visible section and JSON-LD schema
  if (isNeopolis) {
    faqItems = [
      {
        question: "What is the difference between Neopolis and Kokapet?",
        answer: "Neopolis is a designated ultra-luxury high-rise corridor created by HMDA through record-breaking land auctions, while Kokapet is a broader established area with mixed development (plotted, mid-rise, villas). Neopolis specifically favors high-rise construction with significantly higher FSI allocations than typical Hyderabad micro-markets, encouraging vertical growth and high-rise development, whereas Kokapet includes diverse property types and price points."
      },
      {
        question: "Is Neopolis a gated community or an HMDA layout?",
        answer: "Neopolis is an HMDA-planned layout, not a single gated community. It's a master-planned zone spanning approximately 1,200 acres where multiple developers build independently within a unified regulatory framework. Each project maintains its own security and amenities, but all adhere to HMDA's height norms, setback requirements, and infrastructure standards."
      },
      {
        question: "What is the FSI policy and zoning in Neopolis?",
        answer: "Neopolis features significantly higher FSI (Floor Space Index) allocations than typical Hyderabad micro-markets, encouraging vertical growth and high-rise development. The HMDA master plan designates specific zones for residential high-rise construction, with FSI policies that enable developers to build sky-scraping residential towers. This is part of HMDA's vision to create an ultra-luxury residential enclave with vertical density."
      },
      {
        question: "What is the current price range per sq.ft. in Neopolis?",
        answer: "Current price ranges are ₹8,500-12,000 per sq.ft. for ready-to-move and under-construction projects. Premium sky villas and penthouses command ₹12,000-18,000+ per sq.ft. Prices have appreciated 12-18% year-over-year since HMDA auctions (2021-2022), driven by limited supply, premium developer branding, and infrastructure momentum."
      },
      {
        question: "How far is Neopolis from Financial District, Hitec City, and Airport?",
        answer: "Neopolis is approximately 8-10 km from Financial District (15-20 min drive), 12-15 km from Hitec City (20-25 min), and 35-40 km from Rajiv Gandhi International Airport (35-40 min via ORR). The Outer Ring Road (ORR) provides seamless access with multiple entry points including the Trumpet Interchange, and upcoming metro connectivity will further reduce commute times."
      },
      {
        question: "Are there any environmental / GO 111 concerns still applicable?",
        answer: "HMDA has partially relaxed GO 111 restrictions for Neopolis, allowing development while maintaining environmental safeguards. Developers must implement sustainable practices including rainwater harvesting, sewage treatment plants, and green building certifications. Buffer zones and green belts protect nearby water bodies (Gandipet Lake, Osman Sagar). All projects require environmental clearances and pollution control board compliance."
      },
      {
        question: "What is the rental yield in Neopolis?",
        answer: "Rental yields in Neopolis are typically 3-4%, which is lower than other areas but reflects the capital appreciation focus rather than rental income generation. The target buyer profile prioritizes long-term wealth preservation and lifestyle enhancement over immediate rental returns. Strong demand exists from expatriates, senior IT professionals, and corporate executives working in Financial District and Hitec City."
      },
      {
        question: "Are NRIs allowed to invest in Neopolis?",
        answer: "Yes, NRIs are allowed to invest in Neopolis properties under FEMA regulations. NRIs represent a significant buyer segment, particularly those with roots in Hyderabad or Telangana. Many developers offer NRI-friendly payment plans and documentation support, making the investment process streamlined for overseas buyers."
      },
      {
        question: "Which developers have projects in Neopolis?",
        answer: "Neopolis has attracted Hyderabad's most prestigious developers including My Home Group (My Home 99), Rajapushpa Properties (Rajapushpa Skyra), Prestige Group (Prestige Clairemont), Sattva Group, Brigade Group (Brigade Gateway), MSN Group (MSN One), and Yula Globus (Neo by Yula Globus). The presence of these tier-1 developers ensures construction quality, timely delivery, and post-possession maintenance."
      },
      {
        question: "What are typical apartment and sky-villa sizes in Neopolis?",
        answer: "Standard apartments range from 2,000-5,000 sq.ft. (3-4 BHK), priced ₹3-8 Crores. Sky villas are duplex/triplex units (4,000-7,000 sq.ft.) on higher floors, priced ₹8-15 Crores. Penthouses are ultra-luxury top-floor residences (6,000-10,000+ sq.ft.) with private terraces, priced above ₹15 Crores."
      }
    ];
  } else {
    const faqSchemaString = getFaqSchemaJsonString(pageData);
    if (faqSchemaString) {
      try {
        const faqData = JSON.parse(faqSchemaString);
        if (faqData.mainEntity && Array.isArray(faqData.mainEntity)) {
          faqItems = faqData.mainEntity.map((item: any) => ({
            question: item.name || "",
            answer: item.acceptedAnswer?.text || "",
          }));
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  // Build primary entity based on page type
  let primaryEntity: Record<string, any> | null = null;
  let primaryEntityType: "Place" | "RealEstateListing" = "RealEstateListing";
  const cityName = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  if (isNeopolis) {
    // For Neopolis, use Place schema with master plan data
    primaryEntityType = "Place";
    let masterPlanData: any = {};
    if (pageData.master_plan_json) {
      try {
        masterPlanData = typeof pageData.master_plan_json === "string" 
          ? JSON.parse(pageData.master_plan_json) 
          : pageData.master_plan_json;
      } catch (e) {
        console.error("Error parsing master plan JSON:", e);
      }
    }

    primaryEntity = {
      "@type": "Place",
      name: `${pageData.micro_market_name} Master Plan & Zoning`,
      description: `Master Plan and Zoning information for ${pageData.micro_market_name}, ${cityName}. ${(Array.isArray(masterPlanData.zones) ? masterPlanData.zones.map((zone: any) => `${zone.zone}: ${zone.purpose} - ${zone.description}`).join(". ") : "") || ""}${masterPlanData.fsi_policy ? ` FSI Policy: ${masterPlanData.fsi_policy}.` : ""}${masterPlanData.total_area ? ` Total Area: ${masterPlanData.total_area}.` : ""}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: pageData.micro_market_name,
        addressRegion: cityName,
        addressCountry: "IN",
        ...(pageData.locality_pincode && { postalCode: pageData.locality_pincode }),
      },
      ...(Array.isArray(masterPlanData.zones) && masterPlanData.zones.length > 0 && {
        containsPlace: masterPlanData.zones.map((zone: any) => ({
          "@type": "Place",
          name: zone.zone,
          description: `${zone.purpose}: ${zone.description}`,
        })),
      }),
      ...(masterPlanData.fsi_policy && {
        additionalProperty: {
          "@type": "PropertyValue",
          name: "FSI Policy",
          value: masterPlanData.fsi_policy,
        },
      }),
      ...((pageData as any).latitude && (pageData as any).longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: (pageData as any).latitude,
          longitude: (pageData as any).longitude,
        },
      }),
    };
  } else {
    // For other micro-markets, use RealEstateListing
    primaryEntity = {
      "@type": "RealEstateListing",
      name: `Properties in ${pageData.micro_market_name}, ${cityName}`,
      description: seoDescription,
      url: canonicalUrl,
      image: pageData.hero_image_url || pageData.connectivity_map_url || undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: pageData.micro_market_name,
        addressRegion: cityName,
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
        name: cityName,
      },
    };
  }

  // Generate unified schema using the utility
  const unifiedSchema = generateUnifiedSchema({
    pageUrl: canonicalUrl,
    title: seoTitle,
    description: seoDescription,
    heroImageUrl: pageData.hero_image_url || pageData.connectivity_map_url || undefined,
    primaryEntityType,
    primaryEntity,
    faqItems,
    breadcrumbs: [
      { name: "Home", item: "https://www.westsiderealty.in" },
      { name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
      { name: pageData.micro_market_name, item: canonicalUrl },
    ],
  });

  const safeImageSrc = (src: string | null | undefined) => (src && src.trim() ? src : "/placeholder.svg");

  // For Neopolis, use the same FAQ items for both visible section and JSON-LD
  // This ensures perfect synchronization between visible FAQs and schema markup
  const finalFAQs = isNeopolis 
    ? (Array.isArray(faqItems) ? faqItems : [])
    : (Array.isArray(pageData.faqs) ? pageData.faqs : []);

  return (
    <>
      <JsonLd jsonLd={unifiedSchema} />

      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <BreadcrumbNav items={breadcrumbItems} />

          {/* Hero Section */}
          <header className="mb-12 mt-8">
            {pageData.hero_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <Image
                  src={safeImageSrc(getHeroImageUrl(pageData.hero_image_url))}
                  alt={isNeopolis 
                    ? "Aerial view of Neopolis Hyderabad high-rise corridor showing ultra-luxury residential towers in Kokapet"
                    : `Aerial view of ${pageData.micro_market_name} ultra-luxury residential township in ${pageData.key_adjacent_areas?.[0] || "West " + citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}, ${citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`
                  }
                  width={1200}
                  height={400}
                  className="w-full h-64 object-cover"
                  priority
                />
              </div>
            )}

            <h1 className="text-4xl font-bold mb-6 text-foreground">{h1Title}</h1>
            {isNeopolis ? (
              <p className="text-lg text-muted-foreground leading-relaxed">
                <strong>Neopolis Hyderabad</strong> is the pinnacle of Hyderabad's luxury real estate and the premier destination for apartments for sale in the city. Located adjacent to the already established Kokapet area, this exclusive, designated zone was created by the HMDA following record-breaking land auctions. Neopolis offers an investment opportunity in ultra-luxury high-rise apartments where land values are secured by the highest auction prices in Hyderabad's history.
              </p>
            ) : (
              <p
                className="text-lg text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pageData.hero_hook || "" }}
              />
            )}

            {/* Key Stats Badges */}
            {pageData.price_per_sqft_min && (
              <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {/* Pricing Disclaimer */}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Indicative values as of late 2025. Actual prices and returns vary by project, tower, floor, view and market conditions.
                </p>
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
          </header>

          {/* Market Update Banner */}
          <MarketUpdateBanner citySlug={citySlug} microMarketSlug={microMarketSlug} />

          {/* Neopolis Editorial Guide Section - Top of Page, Before Projects */}
          {isNeopolis && (
            <section className="mb-12" id="neopolis-guide">
              <NeopolisEditorialContent citySlug={citySlug} />
            </section>
          )}

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
          {pageData.master_plan_json && (
            <MasterPlanSection 
              data={pageData.master_plan_json} 
              microMarketName={pageData.micro_market_name}
              latitude={(pageData as any).latitude}
              longitude={(pageData as any).longitude}
              skipSchema={isNeopolis} // Skip schema for Neopolis (included in unified graph)
            />
          )}

          {/* Infrastructure Roadmap Timeline */}
          {Array.isArray(pageData.infrastructure_json) && pageData.infrastructure_json.length > 0 && (
            <InfrastructureTimeline data={pageData.infrastructure_json} />
          )}

          {/* Strategic Infrastructure & Social Amenities */}
          <StrategicInfrastructureSection
            microMarketName={pageData.micro_market_name}
            nearestMmtsStatus={pageData.nearest_mmts_status}
          />

          {/* Featured Projects Section - Below the Fold */}
          {microMarketProjects.length > 0 && (
            <section className="mb-12" id="featured-projects">
              <h2 className="micro-market-h2">Featured Projects in {pageData.micro_market_name}</h2>
              
              {isNeopolis ? (
                <p className="text-muted-foreground mb-6">
                  This is a curated list of premium projects in Neopolis Hyderabad. The following table provides an at-a-glance overview of key luxury developments, including configurations, developers, and price ranges. This is not an exhaustive inventory—contact us for complete project listings and availability.
                </p>
              ) : (
                <p className="text-muted-foreground mb-6">
                  We specialize in showcasing the finest properties in the region. Here is a quick, at-a-glance overview of some of
                  the key <strong className="metric-highlight">{pageData.micro_market_name} projects</strong> currently listed with
                  us, demonstrating the variety of luxury and premium inventory available:
                </p>
              )}

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
                                href={`/${citySlug}/projects/${project.url_slug}`}
                                className="font-medium text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary hover:text-primary transition-colors"
                              >
                                {project.project_name}
                              </Link>
                            </TableCell>
                            <TableCell>{project.unit_size_range || "—"}</TableCell>
                            <TableCell>
                              {project.developer?.url_slug ? (
                                <Link
                                  href={`/developers/${project.developer.url_slug}`}
                                  className="text-primary/80 underline decoration-primary/30 underline-offset-2 hover:text-primary hover:decoration-primary transition-colors"
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
          {pageData.developer_pillar_urls && 
           typeof pageData.developer_pillar_urls === 'object' && 
           !Array.isArray(pageData.developer_pillar_urls) &&
           Object.keys(pageData.developer_pillar_urls).length > 0 && (
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
                  .sort(([, a], [, b]) => (a as any).displayOrder - (b as any).displayOrder)
                  .map(([key, developer]: [string, any]) => (
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
                          {Array.isArray(developer.projects) && developer.projects.map((project: any, idx: number) => (
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
          {((Array.isArray(pageData.top_schools) && pageData.top_schools.length > 0) ||
            (Array.isArray(pageData.top_hospitals) && pageData.top_hospitals.length > 0) ||
            (Array.isArray(pageData.entertainment_centers) && pageData.entertainment_centers.length > 0)) && (
            <section className="mb-12">
              <h2 className="micro-market-h2">Essential Infrastructure</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.isArray(pageData.top_schools) && pageData.top_schools.length > 0 && (
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

                {Array.isArray(pageData.top_hospitals) && pageData.top_hospitals.length > 0 && (
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

                {Array.isArray(pageData.entertainment_centers) && pageData.entertainment_centers.length > 0 && (
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
          {Array.isArray(finalFAQs) && finalFAQs.length > 0 && (
            <section className="mb-12" id="faqs">
              <h2 className="micro-market-h2">
                {isNeopolis ? "Neopolis FAQs" : "Frequently Asked Questions"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isNeopolis 
                  ? "Get answers to common questions about Neopolis Hyderabad, including HMDA layout details, pricing, infrastructure, and investment considerations."
                  : `Get answers to common questions about investing in ${pageData.micro_market_name}.`
                }
              </p>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {finalFAQs.map((faq: any, idx) => {
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
      </main>

      <CityHubBacklink citySlug={citySlug} cityName={citySlug.charAt(0).toUpperCase() + citySlug.slice(1)} />
    </>
  );
}
