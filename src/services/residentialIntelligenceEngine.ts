import { createClient } from "@/lib/supabase/server";
export interface ResidentialIntelligenceBase {
  rera_project: Record<string, unknown>;
  structural_profile: Record<string, unknown> | null;
  land_summary: Record<string, unknown> | null;
  address: Record<string, unknown> | null;
}

export const residentialIntelligenceEngine = {
  async getResidentialIntelligenceBase(
    city: string,
    slug: string
  ): Promise<ResidentialIntelligenceBase | null> {
    const supabase = await createClient();

    const { data: reraProject, error: projectError } = await supabase
      .from("rera_projects")
      .select("*")
      .eq("city_slug", city)
      .eq("url_slug", slug)
      .maybeSingle();

    if (projectError) {
      console.error("[INTEL-ROUTE] RERA project fetch error:", projectError);
      return null;
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
        .eq("rera_project_id", reraProjectId)
        .maybeSingle(),
      supabase
        .from("rera_project_addresses")
        .select("*")
        .eq("rera_project_id", reraProjectId)
        .maybeSingle(),
    ]);

    return {
      rera_project: reraProject as Record<string, unknown>,
      structural_profile: (structuralProfile as Record<string, unknown>) ?? null,
      land_summary: (landSummary as Record<string, unknown>) ?? null,
      address: (address as Record<string, unknown>) ?? null,
    };
  },
};
