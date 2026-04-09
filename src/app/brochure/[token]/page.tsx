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

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const result = await getBrochureData(token);
  const title = result?.brochure?.title ?? "Property Options";
  return {
    title: `${title} | Westside Realty`,
    description: `View curated property options shared by Westside Realty — ${result?.projects?.length ?? 0} projects selected for you.`,
    robots: { index: false, follow: false },
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
