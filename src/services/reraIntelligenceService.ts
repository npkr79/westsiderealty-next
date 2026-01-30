import { createClient } from "@/lib/supabase/server";
import { computeVillaIntelligence } from "@/intelligence/villaIntelligence";

export interface ResidentialIntelligenceResult {
  rera_project: Record<string, unknown>;
  structural_profile: Record<string, unknown> | null;
  land_summary: Record<string, unknown> | null;
  address: Record<string, unknown> | null;
  type?: "villa" | "apartment";
  villaIntelligence?: ReturnType<typeof computeVillaIntelligence> | null;
}

export const reraIntelligenceService = {
  async getResidentialIntelligence(
    city: string,
    slug: string
  ): Promise<ResidentialIntelligenceResult | null> {
    const normalizedCity = decodeURIComponent(city).toLowerCase();
    const normalizedSlug = decodeURIComponent(slug).toLowerCase();
    const supabase = await createClient();

    const project = await supabase
      .from("rera_projects")
      .select("*")
      .eq("city_slug", normalizedCity)
      .eq("url_slug", normalizedSlug)
      .maybeSingle();

    if (project.error) {
      console.error("[INTEL-ROUTE] RERA project fetch error:", project.error);
      return null;
    }

    let reraProject = project.data as Record<string, unknown> | null;

    if (!reraProject) {
      const fallbackSlug = normalizedSlug.replace(/-/g, "%");
      const fallback = await supabase
        .from("rera_projects")
        .select("*")
        .ilike("city_slug", normalizedCity)
        .ilike("url_slug", fallbackSlug)
        .limit(1)
        .maybeSingle();
      reraProject = fallback.data as Record<string, unknown> | null;
    }

    if (!reraProject) {
      const nameHint = normalizedSlug.replace(/-/g, " ");
      const fallbackByName = await supabase
        .from("rera_projects")
        .select("*")
        .ilike("city_slug", normalizedCity)
        .ilike("project_name", `%${nameHint}%`)
        .limit(1)
        .maybeSingle();
      reraProject = fallbackByName.data as Record<string, unknown> | null;
    }

    if (!reraProject) {
      const samples = await supabase
        .from("rera_projects")
        .select("id, city_slug, url_slug, project_name")
        .ilike("city_slug", normalizedCity)
        .ilike("project_name", "%muppas%")
        .limit(5);
      console.log("[RI SAMPLE SLUGS]", samples.data ?? []);
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

    console.log("[INTEL-ROUTE]", {
      city,
      slug,
      rera_project_id: reraProjectId,
      apartment_tower_count: (structuralProfile as any)?.apartment_tower_count ?? null,
    });

    if (
      (reraProject as any)?.url_slug?.includes("aparna-zenon") ||
      (reraProject as any)?.project_name?.toLowerCase().includes("aparna")
    ) {
      const { data: normalizedBuildings } = await supabase
        .from("rera_buildings_normalized")
        .select("derived_building_type,total_units,villa_unit_count")
        .eq("rera_project_id", reraProjectId);

      const aggregates = (normalizedBuildings ?? []).reduce(
        (acc: any, row: any) => {
          const type = row?.derived_building_type ?? "unknown";
          acc.by_type[type] = (acc.by_type[type] ?? 0) + 1;
          if (type === "apartment_tower") {
            acc.apartment_units += Number(row?.total_units ?? 0);
          }
          if (Number(row?.villa_unit_count ?? 0) > 0) {
            acc.villa_units += Number(row?.villa_unit_count ?? 0);
          }
          return acc;
        },
        { by_type: {}, apartment_units: 0, villa_units: 0 }
      );

      console.log("[APARTMENT BASELINE TRACE]", {
        source: "rera_buildings_normalized",
        rera_project_id: reraProjectId,
        by_type: aggregates.by_type,
        apartment_units: aggregates.apartment_units,
        villa_units: aggregates.villa_units,
      });
      console.log("[APARTMENT BASELINE TRACE]", {
        source: "project_structural_profile",
        rera_project_id: reraProjectId,
        apartment_tower_count: (structuralProfile as any)?.apartment_tower_count ?? null,
        residential_structures: (structuralProfile as any)?.residential_structures ?? null,
        total_units: (structuralProfile as any)?.total_units ?? null,
        min_floors: (structuralProfile as any)?.min_floors ?? null,
        max_floors: (structuralProfile as any)?.max_floors ?? null,
        avg_floors: (structuralProfile as any)?.avg_floors ?? null,
        vertical_applicable: (structuralProfile as any)?.vertical_applicable ?? null,
        density_applicable: (structuralProfile as any)?.density_applicable ?? null,
      });
    }

    if ((structuralProfile as any)?.physical_typology === "villa_project") {
      const villaCount = Number((structuralProfile as any)?.total_units ?? 0);
      const structuralProfileResolved = {
        ...(structuralProfile as Record<string, unknown>),
        vertical_applicable: false,
        density_applicable: true,
      };
      const villaIntelligence = computeVillaIntelligence(
        structuralProfileResolved ?? null,
        (landSummary as Record<string, unknown>) ?? null
      );

      console.log("[VILLA INTELLIGENCE ACTIVE]", {
        villa_count: villaCount,
        total_land_area: (landSummary as any)?.total_land_area ?? null,
        villas_per_acre: villaIntelligence.villasPerAcre,
        land_per_villa_sqft: villaIntelligence.landPerVillaSqft,
        density_class: villaIntelligence.densityClass,
        scale_class: villaIntelligence.scaleClass,
      });

      console.log("[VILLA RAW SOURCES]", {
        project_structural_profile: structuralProfile ?? null,
        rera_project_land_summary: landSummary ?? null,
        rera_projects: reraProject ?? null,
      });

      console.log("[VILLA DERIVATION INPUTS]", {
        villa_unit_count: (structuralProfile as any)?.villa_unit_count ?? null,
        total_land_area: (landSummary as any)?.total_land_area ?? null,
        net_land_area: (landSummary as any)?.net_land_area ?? null,
        builtup_area:
          (structuralProfile as any)?.villa_residential_built_up_area ??
          (landSummary as any)?.total_builtup_area ??
          (landSummary as any)?.total_builtup_area_sqm ??
          (landSummary as any)?.total_built_up_area ??
          null,
      });

      return {
        type: "villa",
        rera_project: reraProject as Record<string, unknown>,
        structural_profile: structuralProfileResolved ?? null,
        land_summary: (landSummary as Record<string, unknown>) ?? null,
        address: (address as Record<string, unknown>) ?? null,
        villaIntelligence,
      };
    }

    return {
      type: "apartment",
      rera_project: reraProject as Record<string, unknown>,
      structural_profile: (structuralProfile as Record<string, unknown>) ?? null,
      land_summary: (landSummary as Record<string, unknown>) ?? null,
      address: (address as Record<string, unknown>) ?? null,
    };
  },
};
