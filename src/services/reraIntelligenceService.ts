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

    console.log("[INTEL-DEBUG] input", { city, slug });

    const sample = await supabase
      .from("rera_projects")
      .select("id, city_slug, url_slug")
      .limit(5);

    console.log("[INTEL-DEBUG] sample projects", sample.data);

    let reraProject: Record<string, unknown> | null = null;

    const normalizedCity = city?.trim().toLowerCase();
    const normalizedSlug = slug?.trim().toLowerCase();

    const project = await supabase
      .from("rera_projects")
      .select("*")
      .eq("city_slug", normalizedCity)
      .eq("url_slug", normalizedSlug)
      .maybeSingle();

    console.log("[INTEL-DEBUG] filtered project", project);

    if (project.error) {
      console.error("[INTEL-ROUTE] RERA project fetch error:", project.error);
      return null;
    }

    reraProject = project.data as Record<string, unknown> | null;

    if (!reraProject) {
      const fallback = await supabase
        .from("rera_projects")
        .select("*")
        .ilike("city_slug", normalizedCity)
        .ilike("url_slug", normalizedSlug)
        .maybeSingle();

      console.log("[INTEL-DEBUG] fallback project", fallback);

      if (fallback.error) {
        console.error(
          "[INTEL-ROUTE] RERA project slug fallback error:",
          fallback.error
        );
        return null;
      }

      reraProject = fallback.data as Record<string, unknown> | null;
    }

    if (!reraProject) {
      return null;
    }

    const reraProjectId = (reraProject as any).id;

    const [
      { data: structuralProfile },
      { data: landSummary },
      { data: address },
    ] = await Promise.all([
      supabase
        .from("project_structural_profile")
        .select("*")
        .eq("rera_project_id", reraProjectId)
        .maybeSingle(),
      supabase
        .from("rera_project_land_summary")
        .select("*")
        .eq("project_id", reraProjectId)
        .maybeSingle(),
      supabase
        .from("rera_project_addresses")
        .select("*")
        .eq("rera_project_id", reraProjectId)
        .maybeSingle(),
    ]);

    console.log("[INTEL-DEBUG] structural profile", structuralProfile);
    console.log("[INTEL-DEBUG] land summary", landSummary);
    console.log("[INTEL-DEBUG] address", address);

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
