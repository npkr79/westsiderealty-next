import { createClient } from "@/lib/supabase/server";

export interface ResidentialIntelligenceResult {
  rera_project: Record<string, unknown>;
  structural_profile: Record<string, unknown> | null;
  land_summary: Record<string, unknown> | null;
  address: Record<string, unknown> | null;
}

export const reraIntelligenceService = {
  async getResidentialIntelligence(
    city: string,
    slug: string
  ): Promise<ResidentialIntelligenceResult | null> {
    const supabase = await createClient();

    let reraProject: Record<string, unknown> | null = null;

    const { data: projectByCity, error: projectError } = await supabase
      .from("rera_projects")
      .select("*")
      .ilike("city_slug", city)
      .eq("url_slug", slug)
      .maybeSingle();

    if (projectError) {
      console.error("[INTEL-ROUTE] RERA project fetch error:", projectError);
      return null;
    }

    reraProject = projectByCity as Record<string, unknown> | null;

    if (!reraProject) {
      const { data: projectBySlug, error: projectSlugError } = await supabase
        .from("rera_projects")
        .select("*")
        .eq("url_slug", slug)
        .maybeSingle();

      if (projectSlugError) {
        console.error("[INTEL-ROUTE] RERA project slug fallback error:", projectSlugError);
        return null;
      }

      reraProject = projectBySlug as Record<string, unknown> | null;
    }

    if (!reraProject) {
      return null;
    }

    const reraProjectId = (reraProject as any).id;

    const [{ data: structuralProfile }, { data: landSummary }, { data: address }] =
      await Promise.all([
        supabase
          .from("project_structural_profile")
          .select("*")
          .eq("rera_project_id", reraProjectId)
          .maybeSingle(),
        supabase
          .from("rera_project_land_summary")
          .select("*")
          .eq("rera_project_id", reraProjectId)
          .maybeSingle(),
        supabase
          .from("rera_project_addresses")
          .select("*")
          .eq("rera_project_id", reraProjectId)
          .maybeSingle(),
      ]);

    console.log("[INTEL-ROUTE]", {
      city,
      slug,
      rera_project_id: reraProjectId,
      apartment_tower_count: (structuralProfile as any)?.apartment_tower_count ?? null,
    });

    return {
      rera_project: reraProject as Record<string, unknown>,
      structural_profile: (structuralProfile as Record<string, unknown>) ?? null,
      land_summary: (landSummary as Record<string, unknown>) ?? null,
      address: (address as Record<string, unknown>) ?? null,
    };
  },
};
