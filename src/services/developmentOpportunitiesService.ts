import { createServiceClient } from "@/lib/supabase/serviceClient";
import {
  type DevelopmentOpportunity,
  OPPORTUNITY_PUBLIC_COLUMNS,
} from "@/lib/opportunities/types";

/**
 * Fetch all published development opportunities, ordered by display_order DESC
 * (highest priority first), then created_at DESC.
 */
export async function getPublishedOpportunities(): Promise<DevelopmentOpportunity[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("development_opportunities")
      .select(OPPORTUNITY_PUBLIC_COLUMNS)
      .eq("is_published", true)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[opportunities] list query error:", error);
      return [];
    }
    return (data ?? []) as unknown as DevelopmentOpportunity[];
  } catch (err) {
    console.error("[opportunities] list unexpected error:", err);
    return [];
  }
}

/**
 * Fetch a single published opportunity by slug. Returns null if not found
 * or unpublished.
 */
export async function getOpportunityBySlug(
  slug: string
): Promise<DevelopmentOpportunity | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("development_opportunities")
      .select(OPPORTUNITY_PUBLIC_COLUMNS)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.error("[opportunities] detail query error:", error);
      return null;
    }
    return (data ?? null) as unknown as DevelopmentOpportunity | null;
  } catch (err) {
    console.error("[opportunities] detail unexpected error:", err);
    return null;
  }
}

/**
 * Slugs of all published opportunities — used by generateStaticParams
 * for [slug] route ISR.
 */
export async function getAllOpportunitySlugs(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("development_opportunities")
      .select("slug")
      .eq("is_published", true);

    if (error || !data) return [];
    return data.map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}
