import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import type { Metadata } from "next";
import BrochurePageClient from "@/components/brochure/BrochurePageClient";

export const dynamic = "force-dynamic";

interface BrochureFilters {
  city?: string;
  type?: string;
  status?: string;
  microMarket?: string;       // legacy single
  microMarkets?: string[];    // new multi-select
  budgetMinCr?: number;
  budgetMaxCr?: number;
  configs?: string[];         // unit config filter
}

async function getBrochureData(token: string) {
  const supabase = createServiceClient();

  const { data: brochure, error } = await supabase
    .from("brochure_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !brochure) return null;
  if (!brochure.is_active) return null;
  if (new Date(brochure.expires_at) < new Date()) return null;

  // Fetch projects: either explicit slugs or by filters
  let projects: any[] = [];
  if (brochure.project_slugs?.length) {
    const { data } = await supabase
      .from("advisor_project_intelligence")
      .select("project_name, project_slug, project_type, current_status, developer_brand, micro_market, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, hero_image_url, primary_differentiator, investment_verdict, possession_date, rera_id, pool_details, special_amenities, dist_airport_km")
      .in("project_slug", brochure.project_slugs)
      .eq("is_focus_project", true);
    projects = data ?? [];
    // Preserve order
    const slugOrder = brochure.project_slugs as string[];
    projects.sort((a, b) => slugOrder.indexOf(a.project_slug) - slugOrder.indexOf(b.project_slug));
  } else {
    const f = (brochure.filters ?? {}) as BrochureFilters;
    let q = supabase
      .from("advisor_project_intelligence")
      .select("project_name, project_slug, project_type, current_status, developer_brand, micro_market, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, price_min_cr, price_max_cr, unit_configs, total_units, hero_image_url, primary_differentiator, investment_verdict, possession_date, rera_id, pool_details, special_amenities, dist_airport_km")
      .eq("is_focus_project", true)
      .eq("sale_status", "active");

    if (f.city && f.city !== "all") q = q.eq("city_slug", f.city);
    if (f.type && f.type !== "all") q = q.eq("project_type", f.type);
    // Multi-select markets (new) takes priority over legacy single microMarket
    if (f.microMarkets?.length) {
      q = q.in("micro_market", f.microMarkets);
    } else if (f.microMarket) {
      q = q.ilike("micro_market", `%${f.microMarket}%`);
    }
    if (f.status === "ready") q = q.eq("current_status", "ready_to_move");
    if (f.status === "construction") q = q.eq("current_status", "under_construction");
    if (f.budgetMinCr != null) q = q.lte("price_min_cr", f.budgetMaxCr ?? 9999);
    if (f.budgetMaxCr != null) q = q.gte("price_max_cr", f.budgetMinCr ?? 0);
    if (f.configs?.length) q = q.overlaps("unit_configs", f.configs);

    const { data } = await q.order("quality_score", { ascending: false }).limit(20);
    projects = data ?? [];
  }

  return { brochure, projects };
}

// ─── North/South Goa market classification (mirrors brochure generator) ─────
const NORTH_GOA_MARKETS = new Set([
  "Aldona","Anjuna","Assagao","Ashwem","Bicholim","Calangute",
  "Candolim","Mapusa","Mandrem","Morjim","Parra","Pernem",
  "Pilerne","Porvorim","Reis Magos","Siolim","Socorro","Vagator",
]);
const SOUTH_GOA_MARKETS = new Set([
  "Benaulim","Cavelossim","Colva","Dabolim","Majorda",
  "Margao","Palolem","Varca","Vasco",
]);

function deriveRegion(filters: BrochureFilters): "north" | "south" | "" {
  const markets = filters.microMarkets ?? (filters.microMarket ? [filters.microMarket] : []);
  if (markets.length === 0) return "";
  const north = markets.filter((m) => NORTH_GOA_MARKETS.has(m));
  const south = markets.filter((m) => SOUTH_GOA_MARKETS.has(m));
  if (north.length > 0 && south.length === 0) return "north";
  if (south.length > 0 && north.length === 0) return "south";
  return "";
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const result = await getBrochureData(token);
  const title = result?.brochure?.title ?? "Property Options";
  const count = result?.projects?.length ?? 0;
  const filters = (result?.brochure?.filters ?? {}) as BrochureFilters;
  const city   = filters.city ?? "";
  const region = deriveRegion(filters);

  // Build budget label
  const budgetMin = filters.budgetMinCr;
  const budgetMax = filters.budgetMaxCr;
  let budget = "";
  if (budgetMin != null && budgetMax != null) {
    if (budgetMax >= 999) budget = `₹${budgetMin}Cr+`;
    else budget = `₹${budgetMin}–${budgetMax} Cr`;
  }

  // Build config label
  const configs = filters.configs?.join(" / ") ?? "";

  // Dynamic OG image URL
  const BASE = "https://www.westsiderealty.in";
  const ogUrl = new URL(`${BASE}/api/og/brochure`);
  ogUrl.searchParams.set("title", title);
  ogUrl.searchParams.set("count", String(count));
  if (city)   ogUrl.searchParams.set("city",   city);
  if (region) ogUrl.searchParams.set("region", region);
  if (budget) ogUrl.searchParams.set("budget", budget);
  if (configs) ogUrl.searchParams.set("configs", configs);

  const description = `${count} ${count === 1 ? "property" : "properties"} curated by your advisor — pricing, RERA details and more.`;

  return {
    title: `${title} | Westside Realty`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | Westside Realty`,
      description,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
      type: "website",
      siteName: "Westside Realty",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Westside Realty`,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function BrochurePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getBrochureData(token);
  if (!result) notFound();

  return (
    <BrochurePageClient
      brochure={result.brochure}
      projects={result.projects}
      token={token}
    />
  );
}
