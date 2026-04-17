import type { Metadata } from "next";
import { OpportunitiesClient } from "@/components/opportunities/OpportunitiesClient";
import { getPublishedOpportunities } from "@/services/developmentOpportunitiesService";
import { JsonLd } from "@/components/common/SEO";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("development_opportunities")
    .select("hero_image_url")
    .eq("is_published", true)
    .not("hero_image_url", "is", null)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ogImage = data?.hero_image_url as string | null;

  return {
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
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: "Development Opportunities" }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: "Development Opportunities — For Builders & Investors | Westside Realty",
      description: "Curated redevelopment, JD, and land opportunities. Detailed feasibility under NDA.",
      ...(ogImage && { images: [ogImage] }),
    },
    robots: { index: true, follow: true },
  };
}

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
