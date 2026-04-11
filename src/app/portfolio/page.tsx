import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { PortfolioClient, type FocusProject } from "@/components/portfolio/PortfolioClient";
import { JsonLd } from "@/components/common/SEO";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Featured Projects | Apartments & Villas in Hyderabad & Goa | Westside Realty",
  description:
    "Handpicked RERA-verified projects in Hyderabad's Financial District, Kokapet, Tellapur & Goa. Developer-direct pricing, floor plans & dedicated advisor for every project.",
  alternates: { canonical: "https://www.westsiderealty.in/portfolio" },
  keywords: "featured projects hyderabad, rera verified apartments hyderabad, kokapet projects, financial district apartments, goa villas for sale, westside realty projects, luxury apartments hyderabad 2025",
  openGraph: {
    title: "Featured Projects — Hyderabad & Goa | Westside Realty",
    description: "RERA-verified apartments, villas & plots. Developer-direct pricing, floor plans & dedicated advisory for every project.",
    url: "https://www.westsiderealty.in/portfolio",
    siteName: "RE/MAX Westside Realty",
    type: "website",
    locale: "en_IN",
    images: [{ url: "https://www.westsiderealty.in/placeholder.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Featured Projects — Hyderabad & Goa | Westside Realty",
    description: "RERA-verified apartments & villas with developer-direct pricing. Dedicated advisor for every project.",
  },
};

async function getFocusProjects(): Promise<FocusProject[]> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("advisor_project_intelligence")
      .select(
        "id, project_name, project_slug, project_type, current_status, developer_brand, micro_market, micro_market_slug, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, primary_differentiator, investment_verdict, quality_score, needs_review, hero_image_url, listing_url_slug"
      )
      .eq("is_focus_project", true)
      .eq("sale_status", "active")
      .order("quality_score", { ascending: false });

    if (error) {
      console.error("[Portfolio] Supabase error:", error);
      return [];
    }

    return (data ?? []) as FocusProject[];
  } catch (err) {
    console.error("[Portfolio] Unexpected error:", err);
    return [];
  }
}

export default async function PortfolioPage() {
  const projects = await getFocusProjects();

  // ItemList schema — lets Google show individual projects in rich results
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured Real Estate Projects — RE/MAX Westside Realty",
    description: "Handpicked RERA-verified projects in Hyderabad and Goa with developer-direct pricing",
    url: "https://www.westsiderealty.in/portfolio",
    numberOfItems: projects.length,
    itemListElement: projects.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.project_name,
      url: `https://www.westsiderealty.in/portfolio/${p.project_slug}`,
      ...(p.hero_image_url ? { image: p.hero_image_url } : {}),
      ...(p.current_price_per_sqft_min ? {
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: p.current_price_per_sqft_min,
          availability: "https://schema.org/InStock",
        },
      } : {}),
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: "Featured Projects", item: "https://www.westsiderealty.in/portfolio" },
    ],
  };

  return (
    <>
      <JsonLd jsonLd={[itemListSchema, breadcrumbSchema]} />
      <PortfolioClient projects={projects} />
    </>
  );
}
