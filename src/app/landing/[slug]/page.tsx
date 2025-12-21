import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingPageComponent from "./LandingPageComponent";
import { JsonLd } from "@/components/common/SEO";
import { supabaseLandingPagesService, type LandingPage, type LandingPageImage, type LandingPageHighlight, type LandingPageConfiguration, type LandingPageSpecification, type LandingPageLocationPoint, type LandingPageFAQ, type LandingPageFloorPlan } from "@/services/admin/supabaseLandingPagesService";
import { supabaseLandingPagesContentService } from "@/services/admin/supabaseLandingPagesContentService";
import type { Amenity, ContentBlock } from "@/types/landingPageTemplate";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch all landing page data server-side
async function fetchLandingPageData(slug: string) {
  const supabase = await createClient();

  // Fetch main landing page
  const pageData = await supabaseLandingPagesService.getLandingPageByUri(slug);

  if (!pageData || pageData.status !== 'published') {
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
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchLandingPageData(slug);

  if (!data) {
    return {
      title: "Landing Page Not Found",
    };
  }

  const { page } = data;
  const extractedLocation = page.location_info?.split(',')[0]?.trim() || 'Hyderabad';
  const canonicalUrl = `https://www.westsiderealty.in/landing/${slug}`;
  const ogImage = page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";
  const seoTitle = page.seo_title || `${page.title} - Luxury Property in ${extractedLocation} | RE/MAX Westside`;
  const seoDescription = page.seo_description || `${page.headline}. ${page.subheadline || ''} Exclusive luxury real estate opportunity. Contact RE/MAX Westside Realty for details.`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
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

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("uri")
    .eq("status", "published");

  return pages?.map((page) => ({ slug: page.uri })) || [];
}

// Generate JSON-LD structured data
function generateStructuredData(
  page: LandingPage,
  configurations: LandingPageConfiguration[],
  faqs: LandingPageFAQ[]
) {
  const extractedLocation = page.location_info?.split(',')[0]?.trim() || 'Hyderabad';
  const seoDescription = page.seo_description || `${page.headline}. ${page.subheadline || ''} Exclusive luxury real estate opportunity.`;

  // RealEstateListing Schema
  const realEstateListing = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": page.title,
    "description": seoDescription,
    "url": `https://www.westsiderealty.in/landing/${page.uri}`,
    "image": page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": extractedLocation,
      "addressRegion": "Telangana",
      "addressCountry": "IN"
    },
    "offers": configurations.length > 0 
      ? configurations.map(config => ({
          "@type": "Offer",
          "name": `${config.unit_type} Apartment`,
          "description": `${config.unit_type} apartment at ${page.title}`,
          "price": config.starting_price || "Check Price",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "itemOffered": {
            "@type": "Apartment",
            "name": `${config.unit_type} - ${page.title}`,
            ...(config.size_min && {
              "floorSize": {
                "@type": "QuantitativeValue",
                "value": config.size_max ? `${config.size_min}-${config.size_max}` : config.size_min,
                "unitCode": "FTK"
              }
            }),
            ...(config.unit_type && {
              "numberOfRooms": config.unit_type.replace(/[^0-9.]/g, '') || undefined
            })
          }
        }))
      : [{
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "INR",
          "price": "Check Price"
        }],
    "provider": {
      "@type": "RealEstateAgent",
      "name": "RE/MAX Westside Realty",
      "url": "https://www.westsiderealty.in",
      "logo": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
      "telephone": "+919866085831",
      "email": "info@westsiderealty.in"
    }
  };

  // FAQPage Schema
  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.westsiderealty.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Properties",
        "item": "https://www.westsiderealty.in/properties"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": extractedLocation,
        "item": `https://www.westsiderealty.in/properties/${extractedLocation.toLowerCase()}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": page.title,
        "item": `https://www.westsiderealty.in/landing/${page.uri}`
      }
    ]
  };

  const schemas: object[] = [];
  schemas.push(realEstateListing);
  schemas.push(breadcrumbSchema);
  if (faqSchema) {
    schemas.push(faqSchema);
  }
  return schemas;
}

export default async function LandingPageWrapper({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch all data server-side
  const data = await fetchLandingPageData(slug);

  if (!data) {
    notFound();
  }

  const { page, images, highlights, amenities, contentBlocks, floorPlans, configurations, specifications, locationPoints, faqs } = data;

  // Generate structured data
  const structuredData = generateStructuredData(page, configurations, faqs);

  return (
    <>
      {/* JSON-LD Structured Data */}
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

