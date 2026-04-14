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

    // Fetch focus projects from advisor table
    const { data, error } = await supabase
      .from("advisor_project_intelligence")
      .select(
        "id, project_name, project_slug, project_type, current_status, developer_brand, micro_market, micro_market_slug, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, primary_differentiator, investment_verdict, quality_score, needs_review, hero_image_url, listing_url_slug, unit_configs"
      )
      .eq("is_focus_project", true)
      .eq("sale_status", "active")
      .order("quality_score", { ascending: false });

    if (error) {
      console.error("[Portfolio] Supabase error:", error);
      return [];
    }

    const projects = (data ?? []) as FocusProject[];

    // Secondary: fetch min_area from projects table for linked projects
    // Used to compute "From ₹X Cr" total flat price instead of per-sqft
    const linkedSlugs = projects
      .map((p) => p.listing_url_slug)
      .filter((s): s is string => !!s);

    if (linkedSlugs.length > 0) {
      const { data: projectRows } = await supabase
        .from("projects")
        .select("url_slug, min_area, max_area")
        .in("url_slug", linkedSlugs);

      const areaMap = new Map(
        (projectRows ?? []).map((r: { url_slug: string; min_area: number | null; max_area: number | null }) => [
          r.url_slug,
          { min_area: r.min_area, max_area: r.max_area },
        ])
      );

      // Attach area data → compute min_flat_price
      for (const p of projects) {
        if (p.listing_url_slug && areaMap.has(p.listing_url_slug)) {
          const { min_area, max_area } = areaMap.get(p.listing_url_slug)!;
          p.min_area_sqft = min_area ?? null;
          p.max_area_sqft = max_area ?? null;
          if (p.current_price_per_sqft_min && min_area) {
            p.min_flat_price = Math.round(p.current_price_per_sqft_min * min_area);
          }
        }
      }
    }

    // For plot-type projects, extract sq yd size range from unit_configs
    for (const p of projects) {
      if (p.project_type === "plot" && p.unit_configs?.length) {
        const raw = p.unit_configs[0]; // e.g. "Plot 180–400 sqyd | ₹28,000/sqyd | From ₹50.4L"
        const sizeMatch = raw.match(/(\d+)[–-](\d+)\s*sqyd/i);
        if (sizeMatch) {
          p.plot_size_min_sqyd = parseInt(sizeMatch[1]);
          p.plot_size_max_sqyd = parseInt(sizeMatch[2]);
        }
      }
    }

    return projects;
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
      ...(p.min_flat_price ? {
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: p.min_flat_price,
          availability: "https://schema.org/InStock",
        },
      } : p.current_price_per_sqft_min ? {
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
