import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingPageComponent from "./LandingPageComponent";
import { JsonLd } from "@/components/common/SEO";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { supabaseLandingPagesService, type LandingPage, type LandingPageImage, type LandingPageHighlight, type LandingPageConfiguration, type LandingPageSpecification, type LandingPageLocationPoint, type LandingPageFAQ, type LandingPageFloorPlan } from "@/services/admin/supabaseLandingPagesService";
import { supabaseLandingPagesContentService } from "@/services/admin/supabaseLandingPagesContentService";
import type { Amenity, ContentBlock } from "@/types/landingPageTemplate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch all landing page data server-side
async function fetchLandingPageData(slug: string) {
  try {
    const supabase = await createClient();

    // Fetch main landing page
    const pageData = await supabaseLandingPagesService.getLandingPageByUri(slug);

    if (!pageData) {
      console.warn(`[LandingPage] No landing page found with URI: ${slug}`);
      return null;
    }

    if (pageData.status !== 'published') {
      console.warn(`[LandingPage] Landing page found but status is '${pageData.status}', expected 'published'. URI: ${slug}`);
      return null;
    }

  // Fetch all related data in parallel
  const [
    images,
    highlights,
    amenities,
    contentBlocks,
    floorPlans,
    configurations,
    specifications,
    locationPoints,
    faqs
  ] = await Promise.all([
    supabaseLandingPagesService.getLandingPageImages(pageData.id),
    supabaseLandingPagesService.getLandingPageHighlights(pageData.id),
    supabaseLandingPagesContentService.getAmenities(pageData.id),
    supabaseLandingPagesContentService.getContentBlocks(pageData.id),
    supabaseLandingPagesService.getFloorPlans(pageData.id),
    supabaseLandingPagesService.getConfigurations(pageData.id),
    supabaseLandingPagesService.getSpecifications(pageData.id),
    supabaseLandingPagesService.getLocationPoints(pageData.id),
    supabaseLandingPagesService.getFAQs(pageData.id)
  ]);

    return {
      page: pageData,
      images,
      highlights,
      amenities,
      contentBlocks,
      floorPlans,
      configurations,
      specifications,
      locationPoints,
      faqs
    };
  } catch (error) {
    console.error(`[LandingPage] Error fetching landing page data for slug: ${slug}`, error);
    return null;
  }
}

// Helper function to format price for display (e.g., 11300000 -> "₹1.13 Cr*")
function formatPriceForTitle(price: number | null | undefined): string {
  if (!price) return "";
  
  // Convert to crores if >= 1 crore, otherwise lakhs
  if (price >= 10000000) {
    const crores = price / 10000000;
    return `₹${crores.toFixed(2)} Cr*`;
  } else if (price >= 100000) {
    const lakhs = price / 100000;
    return `₹${lakhs.toFixed(2)} Lakhs*`;
  } else {
    return `₹${price.toLocaleString('en-IN')}*`;
  }
}

// Helper to get unit types from configurations (e.g., "3 & 4 BHK")
function getUnitTypes(configurations: LandingPageConfiguration[]): string {
  if (!configurations || configurations.length === 0) return "";
  
  const unitTypes = configurations
    .map(config => config.unit_type)
    .filter(Boolean)
    .sort();
  
  if (unitTypes.length === 0) return "";
  if (unitTypes.length === 1) return unitTypes[0];
  
  // Format as "3 & 4 BHK" or "2, 3 & 4 BHK"
  const uniqueTypes = [...new Set(unitTypes)];
  if (uniqueTypes.length <= 2) {
    return uniqueTypes.join(" & ");
  }
  return uniqueTypes.slice(0, -1).join(", ") + " & " + uniqueTypes[uniqueTypes.length - 1];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchLandingPageData(slug);

  if (!data) {
    return {
      title: "Landing Page Not Found",
    };
  }

  const { page, configurations } = data;
  const extractedLocation = page.location_info?.split(',')[0]?.trim() || 'Hyderabad';
  const canonicalUrl = `https://www.westsiderealty.in/landing/${slug}`;
  const rawOgImage = page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";
  const ogImage = optimizeSupabaseImage(rawOgImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });
  
  // Get starting price (lowest from configurations)
  const startingPrice = configurations && configurations.length > 0
    ? Math.min(...configurations.map(c => c.starting_price || Infinity).filter(p => p !== Infinity))
    : null;
  const priceText = startingPrice ? formatPriceForTitle(startingPrice) : "";
  
  // Get unit types
  const unitTypes = getUnitTypes(configurations || []);
  
  // Build optimized title with price hook
  const seoTitle = page.seo_title || (priceText && unitTypes
    ? `${page.title}: ${unitTypes} Flats from ${priceText} | RE/MAX`
    : `${page.title} - Luxury Property in ${extractedLocation} | RE/MAX Westside`);
  
  // Build optimized description with location-first and 5% down payment hook
  const seoDescription = page.seo_description || (priceText && unitTypes
    ? `${extractedLocation}'s finest: ${page.title}. ${unitTypes} apartments from ${priceText}. Pay just 5% Down Payment. ${page.project_land_area ? `${page.project_land_area} Gated Community` : 'Premium Gated Community'} by ${page.title.includes('Godrej') ? 'Godrej Properties' : 'Leading Developer'}.`
    : `${page.headline}. ${page.subheadline || ''} Exclusive luxury real estate opportunity. Contact RE/MAX Westside Realty for details.`);

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
      type: "website",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
  };
}

// Allow dynamic routes not in generateStaticParams
export const dynamicParams = true;

// Revalidate pages every 60 seconds (ISR)
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const supabase = await createClient();
    const { data: pages, error } = await supabase
      .from("landing_pages")
      .select("uri")
      .eq("status", "published");

    if (error) {
      console.error("Error fetching landing pages for static params:", error);
      return [];
    }

    return pages?.map((page) => ({ slug: page.uri })) || [];
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

// Generate unified @graph JSON-LD structured data
function generateStructuredData(
  page: LandingPage,
  configurations: LandingPageConfiguration[],
  faqs: LandingPageFAQ[]
) {
  const baseUrl = "https://www.westsiderealty.in";
  const pageUrl = `https://www.westsiderealty.in/landing/${page.uri}`;
  const extractedLocation = page.location_info?.split(',')[0]?.trim() || 'Hyderabad';
  const seoDescription = page.seo_description || `${page.headline}. ${page.subheadline || ''} Exclusive luxury real estate opportunity.`;
  
  // URL-encode location for breadcrumb (replace spaces with hyphens, lowercase)
  const locationSlug = extractedLocation.toLowerCase().replace(/\s+/g, '-');

  // Get starting price (lowest from configurations)
  const startingPrice = configurations && configurations.length > 0
    ? Math.min(...configurations.map(c => c.starting_price || Infinity).filter(p => p !== Infinity))
    : null;
  
  // Get unit types
  const unitTypes = getUnitTypes(configurations || []);
  
  // Extract developer name from title (e.g., "Godrej Regal Pavilion" -> "Godrej Properties")
  const developerName = page.title.includes('Godrej') ? 'Godrej Properties' 
    : page.title.includes('Prestige') ? 'Prestige Group'
    : page.title.includes('Brigade') ? 'Brigade Group'
    : page.title.includes('My Home') ? 'My Home Group'
    : 'Leading Developer';

  // Build unified @graph schema
  const unifiedGraphSchema = {
    "@context": "https://schema.org",
    "@graph": [
      // Organization
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "RE/MAX Westside Realty",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
        },
        "image": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
        "telephone": "+919866085831",
        "email": "info@westsiderealty.in",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "415, 4th Floor, Kokapet Terminal, Kokapet",
          "addressLocality": "Hyderabad",
          "addressRegion": "Telangana",
          "postalCode": "500075",
          "addressCountry": "IN",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 17.3851,
          "longitude": 78.3270,
        },
        "areaServed": [
          { "@type": "City", "name": "Hyderabad" },
          { "@type": "City", "name": "Goa" },
          { "@type": "City", "name": "Dubai" },
        ],
        "openingHours": "Mo-Sa 09:00-18:00",
        "priceRange": "₹₹₹",
      },
      // Website
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "RE/MAX Westside Realty",
        "publisher": { "@id": `${baseUrl}/#organization` },
      },
      // WebPage
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        "url": pageUrl,
        "name": page.seo_title || `${page.title}: ${unitTypes || ''} Flats from ${startingPrice ? formatPriceForTitle(startingPrice) : ''} | RE/MAX`,
        "description": seoDescription,
        "isPartOf": { "@id": `${baseUrl}/#website` },
        "publisher": { "@id": `${baseUrl}/#organization` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": baseUrl,
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Properties",
              "item": `${baseUrl}/properties`,
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": extractedLocation,
              "item": `${baseUrl}/properties/${locationSlug}`,
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": page.title,
              "item": pageUrl,
            },
          ],
        },
        ...(page.hero_image_url && {
          "image": {
            "@type": "ImageObject",
            "url": page.hero_image_url,
          },
        }),
      },
      // Product
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        "name": page.title,
        "description": seoDescription,
        "image": page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg",
        "brand": {
          "@type": "Brand",
          "name": developerName,
        },
        "offers": startingPrice ? {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": startingPrice.toString(),
          "offerCount": configurations?.length?.toString() || "1",
          "availability": "https://schema.org/InStock",
        } : {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
        },
        "category": "Real Estate",
      },
      // RealEstateListing
      {
        "@type": "RealEstateListing",
        "@id": `${pageUrl}#listing`,
        "name": page.title,
        "description": seoDescription,
        "url": pageUrl,
        "image": page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg",
        "mainEntity": { "@id": `${pageUrl}#product` },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": extractedLocation,
          "addressRegion": "Telangana",
          "addressCountry": "IN",
        },
        "provider": { "@id": `${baseUrl}/#organization` },
      },
      // FAQPage (if available)
      ...(faqs && faqs.length > 0 ? [{
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
        "isPartOf": { "@id": `${pageUrl}#webpage` },
      }] : []),
    ],
  };

  return [unifiedGraphSchema];
}

export default async function LandingPageWrapper({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch all data server-side
  const data = await fetchLandingPageData(slug);

  if (!data) {
    notFound();
  }

  const { page, images, highlights, amenities, contentBlocks, floorPlans, configurations, specifications, locationPoints, faqs } = data;

  // Generate unified structured data (includes Organization, Website, WebPage, Product, RealEstateListing, FAQPage)
  const structuredData = generateStructuredData(page, configurations, faqs);

  return (
    <>
      {/* Unified JSON-LD Structured Data (@graph) */}
      {structuredData.map((schema, index) => (
        <JsonLd key={index} jsonLd={schema} />
      ))}

      {/* Server-rendered content - pass all data as props */}
      <LandingPageComponent
        landingPage={page}
        images={images}
        highlights={highlights}
        amenities={amenities}
        contentBlocks={contentBlocks}
        floorPlans={floorPlans}
        configurations={configurations}
        specifications={specifications}
        locationPoints={locationPoints}
        faqs={faqs}
      />
    </>
  );
}

