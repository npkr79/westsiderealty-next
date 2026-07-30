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
        "id, project_name, project_slug, project_type, current_status, developer_brand, developer_brand_slug, micro_market, micro_market_slug, city, city_slug, locality, current_price_per_sqft_min, current_price_per_sqft_max, total_units, primary_differentiator, investment_verdict, quality_score, needs_review, hero_image_url, listing_url_slug, unit_configs, price_min_cr, price_max_cr, rera_id, rera_verified, possession_date, land_area_acres, total_towers, total_floors_max, official_website, gallery_image_urls, special_amenities, sports_amenities, clubhouse_sqft"
      )
      .eq("is_focus_project", true)
      .eq("sale_status", "active")
      .order("quality_score", { ascending: false });

    if (error) {
      console.error("[Portfolio] Supabase error:", error);
      return [];
    }

    const projects = (data ?? []) as FocusProject[];

    // Secondary: fetch linked project details in one batch for table details/export.
    const linkedSlugs = projects
      .map((p) => p.listing_url_slug)
      .filter((s): s is string => !!s);

    if (linkedSlugs.length > 0) {
      const { data: projectRows } = await supabase
        .from("projects")
        .select("url_slug, project_overview_seo, meta_description, unit_size_range, price_range_text, completion_status, total_land_area, total_towers, total_units, brochure_url, floor_plan_images, gallery_images_json, amenities_json, google_maps_embed_url, hero_image_url")
        .in("url_slug", linkedSlugs);

      const areaMap = new Map(
        (projectRows ?? []).map((r: Record<string, unknown> & { url_slug: string }) => [
          r.url_slug,
          r,
        ])
      );

      // Attach project detail fields and compute a card price where possible.
      for (const p of projects) {
        if (p.listing_url_slug && areaMap.has(p.listing_url_slug)) {
          const detail = areaMap.get(p.listing_url_slug)!;
          p.project_detail = detail as FocusProject["project_detail"];

          const sizeText = typeof detail.unit_size_range === "string" ? detail.unit_size_range : "";
          const numbers = Array.from(sizeText.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)/g))
            .map((m) => Number(m[1]))
            .filter((n) => Number.isFinite(n) && n >= 100 && n <= 20000);

          if (numbers.length > 0) {
            p.min_area_sqft = Math.min(...numbers);
            p.max_area_sqft = Math.max(...numbers);
          }
          if (p.current_price_per_sqft_min && p.min_area_sqft) {
            p.min_flat_price = Math.round(p.current_price_per_sqft_min * p.min_area_sqft);
          }
        }
      }
    }

    // For plot-type projects, extract sq yd size range + set min_flat_price from price_min_cr
    for (const p of projects) {
      if (p.project_type === "plot") {
        // Set total starting price so priceLabel shows "From ₹50.4 Lakh"
        if (p.price_min_cr) {
          p.min_flat_price = Math.round(p.price_min_cr * 1_00_00_000);
        }
        // Extract plot size range from unit_configs
        if (p.unit_configs?.length) {
          const raw = p.unit_configs[0]; // e.g. "Plot 180–400 sqyd | ₹28,000/sqyd | From ₹50.4L"
          const sizeMatch = raw.match(/(\d+)[–-](\d+)\s*sqyd/i);
          if (sizeMatch) {
            p.plot_size_min_sqyd = parseInt(sizeMatch[1]);
            p.plot_size_max_sqyd = parseInt(sizeMatch[2]);
          }
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
