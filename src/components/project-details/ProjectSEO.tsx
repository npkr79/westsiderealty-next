"use client";

import { JsonLd } from "@/components/common/SEO";
import type { ProjectWithRelations } from "@/services/projectService";
import { buildProjectAbsoluteUrl } from "@/lib/routes";

interface ProjectSEOProps {
  project: ProjectWithRelations;
  citySlug: string;
  microMarketSlug?: string | null;
  projectSlug: string;
}

/**
 * Client-side SEO helper for project pages that injects JSON-LD for the specific project.
 * In the App Router, the main meta tags are handled via generateMetadata; this focuses on structured data.
 */
export default function ProjectSEO({
  project,
  citySlug,
  microMarketSlug,
  projectSlug,
}: ProjectSEOProps) {
  // Use canonical project URL: /citySlug/projects/projectSlug
  const canonicalUrl = buildProjectAbsoluteUrl(citySlug, projectSlug);

  const cityName = project.city?.city_name ?? citySlug;
  const microMarketName = project.micro_market?.micro_market_name ?? microMarketSlug;
  const microMarketUrl = microMarketSlug
    ? `https://www.westsiderealty.in/${citySlug}/${microMarketSlug}`
    : null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.project_name,
    description:
      (project as any).long_description_html ||
      (project as any).project_overview_seo ||
      project.meta_description,
    url: canonicalUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: microMarketName,
      addressRegion: cityName,
      addressCountry: "IN",
    },
    // Add geo coordinates if available
    ...(project.latitude && project.longitude &&
        !isNaN(project.latitude) && !isNaN(project.longitude) && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: project.latitude,
        longitude: project.longitude,
      },
    }),
    // Price range from micro-market data if available
    ...((project.micro_market as any)?.price_per_sqft_min && {
      priceRange: `₹${(project.micro_market as any).price_per_sqft_min.toLocaleString("en-IN")} – ₹${((project.micro_market as any).price_per_sqft_max ?? (project.micro_market as any).price_per_sqft_min).toLocaleString("en-IN")} per sq ft`,
    }),
    // Offer/price schema for price rich snippets in SERP
    ...((project.micro_market as any)?.price_per_sqft_min && {
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: (project.micro_market as any).price_per_sqft_min,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: (project.micro_market as any).price_per_sqft_min,
          priceCurrency: "INR",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "SQF",
          },
        },
        availability: "https://schema.org/InStock",
      },
    }),
    // RERA identifier if available
    ...((project as any).rera_id && {
      identifier: {
        "@type": "PropertyValue",
        name: "RERA",
        value: (project as any).rera_id,
      },
    }),
  };

  // BreadcrumbList for rich results in Google
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: cityName, item: `https://www.westsiderealty.in/${citySlug}` },
      ...(microMarketUrl && microMarketName
        ? [{ "@type": "ListItem", position: 3, name: microMarketName, item: microMarketUrl },
           { "@type": "ListItem", position: 4, name: project.project_name, item: canonicalUrl }]
        : [{ "@type": "ListItem", position: 3, name: project.project_name, item: canonicalUrl }]),
    ],
  };

  return <JsonLd jsonLd={[schema, breadcrumbSchema]} />;
}


