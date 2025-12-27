import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingPageComponent from "./LandingPageComponent";
import { JsonLd } from "@/components/common/SEO";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { generateUnifiedSchema } from "@/lib/seo-utils";
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
  
  // Godrej Regal Pavilion specific overrides
  const isGodrejRegalPavilion = slug === 'godrej-regal-pavilion-rajendra-nagar-hyderabad';
  
  // Standardized SEO title:
  // "{Project Name} {Location}: Price & Review | RE/MAX"
  // For Godrej Regal Pavilion: "Godrej Regal Pavilion Hyderabad – 2, 3, 3.5 & 4 BHK Flats in Rajendra Nagar"
  const seoTitle = isGodrejRegalPavilion
    ? "Godrej Regal Pavilion Hyderabad – 2, 3, 3.5 & 4 BHK Flats in Rajendra Nagar | RE/MAX"
    : page.seo_title || `${page.title} ${extractedLocation}: Price & Review | RE/MAX`;
  
  // Build optimized description with location-first and pricing hook when available
  // For Godrej Regal Pavilion: specific meta description
  const seoDescription = isGodrejRegalPavilion
    ? "Godrej Regal Pavilion Rajendra Nagar: 2, 3, 3.5 & 4 BHK luxury flats near airport & ORR. RERA P02400009910. Starting ₹1.10 Cr. Book with 5% down payment."
    : page.seo_description || (priceText && unitTypes
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

// Wrapper to build unified @graph schema for landing pages using the central utility
function generateStructuredData(
  page: LandingPage,
  configurations: LandingPageConfiguration[],
  faqs: LandingPageFAQ[]
) {
  const pageUrl = `https://www.westsiderealty.in/landing/${page.uri}`;
  const extractedLocation = page.location_info?.split(",")[0]?.trim() || "Hyderabad";
  const isGodrejRegalPavilion = page.uri === 'godrej-regal-pavilion-rajendra-nagar-hyderabad';
  
  const description = isGodrejRegalPavilion
    ? "Godrej Regal Pavilion Rajendra Nagar: 2, 3, 3.5 & 4 BHK luxury flats near airport & ORR. RERA P02400009910. Starting ₹1.10 Cr. Book with 5% down payment."
    : page.seo_description ||
      `${page.headline}. ${page.subheadline || ""} Exclusive luxury real estate opportunity.`;

  // Build primary RealEstateListing entity
  const startingPrice =
    configurations && configurations.length > 0
      ? Math.min(
          ...configurations
            .map((c) => c.starting_price || Infinity)
            .filter((p) => p !== Infinity)
        )
      : null;

  // For Godrej Regal Pavilion: update description to include ~2,000 units
  const primaryEntity: Record<string, any> = {
    "@type": "RealEstateListing",
    name: isGodrejRegalPavilion ? "Godrej Regal Pavilion Hyderabad – 2, 3, 3.5 & 4 BHK Flats in Rajendra Nagar" : page.title,
    url: pageUrl,
    image: page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg",
    description: isGodrejRegalPavilion 
      ? "Godrej Regal Pavilion offers ~2,000 premium residences across 13 acres in Rajendra Nagar, Hyderabad. 2, 3, 3.5 & 4 BHK luxury flats with India's largest 75,000 sq.ft residential clubhouse. RERA P02400009910. Starting ₹1.10 Cr. 5-90-5 payment plan."
      : description,
    address: {
      "@type": "PostalAddress",
      addressLocality: extractedLocation,
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
  };

  if (startingPrice) {
    primaryEntity.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: startingPrice.toString(),
      availability: "https://schema.org/InStock",
      ...(isGodrejRegalPavilion && {
        offerCount: "~2000",
        highPrice: (startingPrice * 4).toString(), // Approximate high price
      }),
    };
  }

  // Filter FAQs for Godrej Regal Pavilion - remove legacy questions and ensure Rajendra Nagar-specific
  let filteredFaqs = faqs || [];
  if (isGodrejRegalPavilion) {
    // Remove legacy questions about Nanakramguda, TSPA Hyderabad
    filteredFaqs = filteredFaqs.filter(faq => 
      !faq.question.toLowerCase().includes('nanakramguda') &&
      !faq.question.toLowerCase().includes('tspa hyderabad')
    );
    
    // Add/ensure Rajendra Nagar-specific FAQs
    const requiredFaqs = [
      {
        question: "What is the RERA number for Godrej Regal Pavilion Rajendra Nagar?",
        answer: "P02400009910, approved 16 July 2025, valid till 16 July 2030."
      },
      {
        question: "What payment plans are available for Godrej Regal Pavilion?",
        answer: "Flexible 5-90-5 plans: 5% down payment, 90% bank loan, remaining 5% after 18 months."
      },
      {
        question: "How far is Godrej Regal Pavilion from RGIA airport?",
        answer: "Just 12 minutes via NH-44, with upcoming Airport Metro Express connectivity."
      }
    ];
    
    // Check if these FAQs already exist, if not add them
    requiredFaqs.forEach(reqFaq => {
      const exists = filteredFaqs.some(f => 
        f.question.toLowerCase().includes(reqFaq.question.toLowerCase().split(' ')[0].toLowerCase())
      );
      if (!exists) {
        filteredFaqs.push(reqFaq as LandingPageFAQ);
      }
    });
  }

  const faqItems =
    filteredFaqs?.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })) || [];

  return generateUnifiedSchema({
    pageUrl,
    title: isGodrejRegalPavilion ? "Godrej Regal Pavilion Hyderabad – 2, 3, 3.5 & 4 BHK Flats in Rajendra Nagar" : page.title,
    description,
    heroImageUrl: page.hero_image_url || undefined,
    primaryEntityType: "RealEstateListing",
    primaryEntity,
    faqItems,
  });
}

export default async function LandingPageWrapper({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch all data server-side
  const data = await fetchLandingPageData(slug);

  if (!data) {
    notFound();
  }

  const { page, images, highlights, amenities, contentBlocks, floorPlans, configurations, specifications, locationPoints, faqs } = data;

  // Generate unified structured data via central SEO utility
  const unifiedSchema = generateStructuredData(page, configurations, faqs);

  return (
    <>
      {/* Unified JSON-LD Structured Data (@graph) */}
      <JsonLd jsonLd={unifiedSchema} />

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

