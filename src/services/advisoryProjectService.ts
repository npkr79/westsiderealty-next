import { createServiceClient } from "@/lib/supabase/serviceClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdvisoryProject {
  id: string;
  project_slug: string;
  project_name: string;
  developer_brand: string | null;
  developer_legal_entity: string | null;
  micro_market: string | null;
  micro_market_slug: string | null;
  city: string;
  city_slug: string;
  project_segment: string | null;
  project_type: string | null;
  current_status: string | null;
  total_units: number | null;
  land_area_acres: string | null;
  current_price_per_sqft_min: string | null;
  current_price_per_sqft_max: string | null;
  launch_price_per_sqft: string | null;
  total_appreciation_pct: string | null;
  rental_yield_pct: string | null;
  primary_differentiator: string | null;
  target_buyer_segment: string | null;
  investment_verdict: string | null;
  rera_id: string | null;
  rera_verified: boolean;
  approval_authority: string | null;
  needs_review: boolean;
  inserted_at: string;
  enrichment_source: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatSegment(segment: string | null): string {
  if (!segment) return "";
  return segment
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatStatus(status: string | null): string {
  if (!status) return "Under Construction";
  const map: Record<string, string> = {
    under_construction: "Under Construction",
    ready_to_move: "Ready to Move",
    new_launch: "New Launch",
    pre_launch: "Pre-Launch",
    completed: "Completed",
    nearing_possession: "Nearing Possession",
  };
  return map[status] ?? formatSegment(status);
}

export function formatProjectType(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    villa: "Villa",
    apartment: "Apartment",
    plot: "Plot",
    townhouse: "Townhouse",
    penthouse: "Penthouse",
    studio: "Studio",
    rowhouse: "Row House",
  };
  return map[type] ?? formatSegment(type);
}

export function formatPriceRange(
  min: string | null,
  max: string | null
): string {
  if (!min && !max) return "Price on Request";
  const fmt = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L/sqft`;
    return `₹${n.toLocaleString("en-IN")}/sqft`;
  };
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return "Price on Request";
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAdvisoryProjectBySlug(
  citySlug: string,
  projectSlug: string
): Promise<AdvisoryProject | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("advisor_project_intelligence")
      .select("*")
      .eq("city_slug", citySlug)
      .eq("project_slug", projectSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data as AdvisoryProject;
  } catch {
    return null;
  }
}

export async function getAllAdvisoryProjectSlugs(): Promise<
  Array<{ citySlug: string; projectSlug: string }>
> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("advisor_project_intelligence")
      .select("city_slug, project_slug");

    if (!data) return [];
    return (data as Array<{ city_slug: string; project_slug: string }>).map(
      (row) => ({
        citySlug: row.city_slug,
        projectSlug: row.project_slug,
      })
    );
  } catch {
    return [];
  }
}

export async function getAdvisoryProjectsByMarket(
  citySlug: string,
  marketSlug: string,
  excludeSlug?: string
): Promise<AdvisoryProject[]> {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("advisor_project_intelligence")
      .select(
        "id, project_slug, project_name, developer_brand, project_segment, project_type, current_status, current_price_per_sqft_min, current_price_per_sqft_max, rental_yield_pct, total_units, investment_verdict, city_slug, micro_market, micro_market_slug"
      )
      .eq("city_slug", citySlug)
      .eq("micro_market_slug", marketSlug)
      .limit(5);

    if (excludeSlug) {
      query = query.neq("project_slug", excludeSlug);
    }

    const { data } = await query;
    return (data as AdvisoryProject[]) ?? [];
  } catch {
    return [];
  }
}
