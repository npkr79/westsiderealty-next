// Public-facing shape of a development opportunity.
// Internal columns (internal_owner_name, internal_full_address,
// internal_feasibility_doc_url, internal_notes) are intentionally NOT included
// here — they should never reach the client.

export interface OpportunityHighlight {
  label: string;
  value: string;
}

export interface OpportunityNarrativeItem {
  title: string;
  description: string;
}

export interface DevelopmentOpportunity {
  id: number;
  slug: string;

  // Identity
  title: string;
  city: string;
  city_slug: string;
  micro_market: string | null;
  micro_market_slug: string | null;

  // Asset
  asset_type: string | null;
  asset_subtype: string | null;

  // Listing classification + price display
  listing_type: string | null;         // e.g. "Land for Sale", "Redevelopment Opportunity"
  asking_price_label: string | null;   // display string, e.g. "₹3.92 Cr", "Price on Request"

  // Sanitised metrics
  plot_area_sqm: number | null;
  plot_area_acres: number | null;
  saleable_potential_sqft: number | null;

  // Indicative financials (public ranges)
  indicative_project_cost_cr: number | null;
  indicative_revenue_cr: number | null;
  indicative_gross_margin_pct_min: number | null;
  indicative_gross_margin_pct_max: number | null;
  indicative_sale_rate_per_sqft: number | null;
  indicative_timeline_months: number | null;

  // Lifecycle
  stage: string | null;
  rera_status: string | null;
  approvals_status: string | null;

  // Deal structures
  deal_structures: string[] | null;

  // Marketing
  hero_image_url: string | null;
  headline: string | null;
  summary: string | null;
  highlights: OpportunityHighlight[] | null;
  why_attractive: OpportunityNarrativeItem[] | null;
  risks_disclosed: OpportunityNarrativeItem[] | null;

  // Confidentiality flags
  is_published: boolean;
  nda_required_for_details: boolean;
  owner_visibility: "gated" | "public";

  // Display
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Columns selected from Supabase. Excludes all internal_* columns by design.
export const OPPORTUNITY_PUBLIC_COLUMNS = [
  "id", "slug", "title",
  "city", "city_slug", "micro_market", "micro_market_slug",
  "asset_type", "asset_subtype",
  "listing_type", "asking_price_label",
  "plot_area_sqm", "plot_area_acres", "saleable_potential_sqft",
  "indicative_project_cost_cr", "indicative_revenue_cr",
  "indicative_gross_margin_pct_min", "indicative_gross_margin_pct_max",
  "indicative_sale_rate_per_sqft", "indicative_timeline_months",
  "stage", "rera_status", "approvals_status", "deal_structures",
  "hero_image_url", "headline", "summary",
  "highlights", "why_attractive", "risks_disclosed",
  "is_published", "nda_required_for_details", "owner_visibility",
  "display_order", "created_at", "updated_at",
].join(", ");

// City label map for the opportunities filter UI
export const OPPORTUNITY_CITY_LABELS: Record<string, string> = {
  mumbai: "Mumbai",
  hyderabad: "Hyderabad",
  goa: "Goa",
  sindhudurg: "Sindhudurg",
  bangalore: "Bangalore",
  pune: "Pune",
  delhi: "Delhi NCR",
};

export function formatStage(stage: string | null): string {
  if (!stage) return "";
  if (stage === "land_available") return "Land Available";
  if (stage === "feasibility") return "Feasibility Complete";
  if (stage === "approvals_in_progress") return "Approvals In Progress";
  if (stage === "ready_to_launch") return "Ready to Launch";
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatReraStatus(status: string | null): string {
  if (!status) return "";
  if (status === "not_registered") return "Pre-RERA";
  if (status === "in_progress") return "RERA In Progress";
  if (status === "registered") return "RERA Registered";
  return status;
}
