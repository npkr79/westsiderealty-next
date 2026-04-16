import type { Metadata } from "next";
import { OpportunitiesClient } from "@/components/opportunities/OpportunitiesClient";
import { getPublishedOpportunities } from "@/services/developmentOpportunitiesService";
import { JsonLd } from "@/components/common/SEO";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Development Opportunities | For Builders & Investors | Westside Realty",
  description:
    "Curated redevelopment, joint-development, and land opportunities sourced for builders, investors, and family offices. Detailed feasibility shared under NDA.",
  alternates: { canonical: "https://www.westsiderealty.in/opportunities" },
  keywords:
    "development opportunities, redevelopment mumbai, joint development, land for builders, real estate investment opportunity india",
  openGraph: {
    title: "Development Opportunities — For Builders & Investors | Westside Realty",
    description:
      "Curated redevelopment, JD, and land opportunities. Detailed feasibility under NDA.",
    url: "https://www.westsiderealty.in/opportunities",
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
};

export default async function OpportunitiesPage() {
  const opportunities = await getPublishedOpportunities();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Development Opportunities",
        item: "https://www.westsiderealty.in/opportunities",
      },
    ],
  };

  return (
    <>
      <JsonLd jsonLd={[breadcrumbSchema]} />
      <OpportunitiesClient opportunities={opportunities} />
    </>
  );
}
