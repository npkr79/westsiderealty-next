import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { PortfolioDetailClient } from "@/components/portfolio/PortfolioDetailClient";
import { JsonLd } from "@/components/common/SEO";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FocusProjectDetail {
  id: string;
  project_name: string;
  project_slug: string;
  rera_id: string | null;
  project_type: string | null;
  current_status: string | null;
  developer_brand: string | null;
  developer_brand_slug: string | null;
  developer_years_in_business: number | null;
  developer_total_projects: number | null;
  developer_reputation_notes: string | null;
  micro_market: string | null;
  city: string | null;
  city_slug: string | null;
  locality: string | null;
  latitude: number | null;
  longitude: number | null;
  current_price_per_sqft_min: number | null;
  current_price_per_sqft_max: number | null;
  total_units: number | null;
  land_area_acres: number | null;
  possession_date: string | null;
  total_floors_max: number | null;
  primary_differentiator: string | null;
  investment_verdict: string | null;
  verdict_bull_case: string | null;
  verdict_bear_case: string | null;
  verdict_risk_factors: string[] | null;
  sub_zone: string | null;
  target_buyer_segment: string | null;
  developer_reputation_notes: string | null;
  developer_years_in_business: number | null;
  developer_total_projects: number | null;
  pool_details: string | null;
  clubhouse_sqft: number | null;
  special_amenities: string[] | null;
  sports_amenities: string[] | null;
  dist_airport_km: number | null;
  dist_financial_district_km: number | null;
  infra_upcoming: string[] | null;
  hero_image_url: string | null;
  gallery_image_urls: string[] | null;
  official_website: string | null;
  needs_review: boolean;
  review_notes: string | null;
  // Additional advisor intelligence fields
  project_segment: string | null;
  target_buyer_segment: string | null;
  rera_verified: boolean;
  total_appreciation_pct: number | null;
  rental_yield_pct: number | null;
  launch_price_per_sqft: number | null;
  approval_authority: string | null;
}

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getProject(slug: string): Promise<FocusProjectDetail | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("advisor_project_intelligence")
    .select("*")
    .eq("project_slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as FocusProjectDetail;
}

// ─── Static params (pre-render all focus projects) ───────────────────────────

export async function generateStaticParams() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("advisor_project_intelligence")
    .select("project_slug")
    .eq("is_focus_project", true);

  return (data ?? []).map((p: { project_slug: string }) => ({ slug: p.project_slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found | Westside Realty" };

  const city = project.city ?? "Hyderabad";
  const market = project.micro_market ?? city;
  const developer = project.developer_brand ?? "Top Developer";
  const priceMin = project.current_price_per_sqft_min;
  const priceMax = project.current_price_per_sqft_max;
  const type = project.project_type ?? "Project";
  const canonicalUrl = `https://www.westsiderealty.in/portfolio/${slug}`;

  // Build price signal string
  const priceSignal = priceMin
    ? priceMax && priceMax !== priceMin
      ? `₹${Number(priceMin).toLocaleString("en-IN")}–${Number(priceMax).toLocaleString("en-IN")}/sqft`
      : `₹${Number(priceMin).toLocaleString("en-IN")}/sqft`
    : null;

  // Title: max 60 chars — project name + location + price or RERA
  const titleWithPrice = priceSignal
    ? `${project.project_name}, ${market} | ${priceSignal}`
    : `${project.project_name}, ${market} | ${type} by ${developer}`;
  const title = titleWithPrice.length <= 60
    ? titleWithPrice
    : `${project.project_name}, ${market} | Westside Realty`;

  // Description: max 155 chars — differentiator + price + RERA CTA
  const reraTag = project.rera_id ? "RERA verified." : "";
  const baseDesc = project.primary_differentiator
    ? `${project.primary_differentiator}${priceSignal ? ` Priced at ${priceSignal}.` : ""} ${reraTag} Get floor plans & expert advisory.`
    : `${project.project_name} by ${developer} in ${market}. ${priceSignal ? `Priced at ${priceSignal}.` : ""} ${reraTag} Talk to a dedicated advisor today.`;
  const description = baseDesc.trim().slice(0, 155);

  const keywords = [
    project.project_name,
    developer,
    market,
    city,
    type,
    project.rera_id ? "RERA verified" : null,
    priceSignal ? `${market} property price` : null,
    "westside realty",
    "advisory project",
    `${market} apartments`,
  ].filter(Boolean).join(", ");

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: project.hero_image_url
        ? [{ url: project.hero_image_url, width: 1200, height: 630, alt: project.project_name }]
        : [{ url: "https://www.westsiderealty.in/placeholder.svg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: project.hero_image_url ? [project.hero_image_url] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const canonicalUrl = `https://www.westsiderealty.in/portfolio/${slug}`;
  const city = project.city ?? "Hyderabad";
  const market = project.micro_market ?? city;
  const priceMin = project.current_price_per_sqft_min;
  const priceMax = project.current_price_per_sqft_max;

  // ApartmentComplex schema with Offer/price for rich snippets
  const apartmentSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    "@id": `${canonicalUrl}#project`,
    name: project.project_name,
    description: project.primary_differentiator ?? `${project.project_name} by ${project.developer_brand} in ${market}`,
    url: canonicalUrl,
    image: project.hero_image_url ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: market,
      addressRegion: city,
      addressCountry: "IN",
    },
    ...(project.latitude && project.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: project.latitude,
        longitude: project.longitude,
      },
    } : {}),
    ...(priceMin ? {
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: priceMin,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: priceMin,
          priceCurrency: "INR",
          ...(priceMax && priceMax !== priceMin ? { maxPrice: priceMax } : {}),
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: 1,
            unitCode: "SQF",
          },
        },
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "RealEstateAgent",
          name: "RE/MAX Westside Realty",
          url: "https://www.westsiderealty.in",
        },
      },
    } : {}),
    ...(project.rera_id ? {
      identifier: {
        "@type": "PropertyValue",
        name: "RERA Registration Number",
        value: project.rera_id,
      },
    } : {}),
    ...(project.developer_brand ? {
      developer: {
        "@type": "Organization",
        name: project.developer_brand,
      },
    } : {}),
    numberOfAvailableAccommodationUnits: project.total_units ?? undefined,
    tourBookingPage: canonicalUrl,
  };

  // BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: "Portfolio", item: "https://www.westsiderealty.in/portfolio" },
      { "@type": "ListItem", position: 3, name: project.project_name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <JsonLd jsonLd={[apartmentSchema, breadcrumbSchema]} />
      <PortfolioDetailClient project={project} />
    </>
  );
}
