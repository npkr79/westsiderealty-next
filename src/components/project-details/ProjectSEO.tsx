"use client";

import { JsonLd } from "@/components/common/SEO";
import type { ProjectWithRelations } from "@/services/projectService";

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
  const canonicalUrl = `https://www.westsiderealty.in/${citySlug}/projects/${projectSlug}`;

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
      addressLocality: project.micro_market?.micro_market_name,
      addressRegion: project.city?.city_name,
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
  };

  return <JsonLd jsonLd={schema} />;
}


