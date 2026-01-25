import { createClient } from "@/lib/supabase/server";

type IntelligenceStatus = "linked" | "unlinked";

export interface ProjectIntelligenceResult {
  status: IntelligenceStatus;
  commercial: any;
  intelligence_snapshot?: {
    project: {
      id: string;
      name: string;
      url_slug: string | null;
      city_slug: string | null;
    };
    mapping_id: string | null;
    rera_project_id: string | null;
    fetched_at: string;
    core?: {
      locality?: string | null;
      mandal?: string | null;
      district?: string | null;
      land_area?: string | null;
      builtup_area?: string | null;
      total_buildings: number;
      total_units: number;
      promoter_count: number;
      proposed_completion_date?: string | null;
    };
  };
  project_dna?: {
    land_summary: { raw: any | null };
    development_works: { raw: any[]; count: number };
    buildings?: {
      raw: any[];
      count: number;
      min_floors: number | null;
      max_floors: number | null;
      avg_floors: number | null;
    };
    units?: {
      raw: any[];
      count: number;
      avg_units_per_building: number | null;
    };
  };
  regulatory?: {
    rera_project: { raw: any | null };
  };
  developer_intelligence?: {
    stakeholders: { raw: any[]; count: number };
  };
  micro_market_intelligence?: {
    addresses: { raw: any[]; count: number };
  };
  official_rera?: {
    project: any | null;
    addresses: any[];
    land_summary: any | null;
    buildings: any[];
    units: any[];
    plots: any[];
    stakeholders: any[];
    development_works: any[];
  };
}

export const projectIntelligenceService = {
  async getProjectIntelligenceBySlug(
    citySlug: string,
    projectSlug: string
  ): Promise<ProjectIntelligenceResult | null> {
    const supabase = await createClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        city:cities(url_slug)
      `
      )
      .eq("url_slug", projectSlug)
      .maybeSingle();

    if (projectError) {
      if (projectError.code !== "PGRST116") {
        console.error("[ProjectIntelligence] Project fetch error:", projectError);
      }
      return null;
    }

    if (!project) {
      return null;
    }

    const projectCity = Array.isArray(project.city) ? project.city[0] : project.city;
    const projectCitySlug = projectCity?.url_slug ?? null;

    if (!projectCitySlug || projectCitySlug !== citySlug) {
      return null;
    }

    if (!project.enable_intelligence) {
      return null;
    }

    const { data: mapping, error: mappingError } = await supabase
      .from("project_rera_links")
      .select("*")
      .eq("project_id", project.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (mappingError) {
      if (mappingError.code !== "PGRST116") {
        console.error("[ProjectIntelligence] Mapping fetch error:", mappingError);
      }
      return null;
    }

    if (!mapping) {
      const unlinkedResult: ProjectIntelligenceResult = {
        status: "unlinked",
        commercial: project,
      };

      if (process.env.NODE_ENV === "development" && project.enable_intelligence) {
        console.log("[ProjectIntelligence] Result:", unlinkedResult);
      }

      return unlinkedResult;
    }

    const { data: reraProject, error: reraProjectError } = await supabase
      .from("rera_projects")
      .select("*")
      .eq("id", mapping.rera_project_id)
      .maybeSingle();

    if (reraProjectError) {
      if (reraProjectError.code !== "PGRST116") {
        console.error("[ProjectIntelligence] RERA project fetch error:", reraProjectError);
      }
      return null;
    }

    const reraProjectId = reraProject?.id ?? null;

    const fetchByProjectId = async (table: string) => {
      if (!reraProjectId) return [];
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("rera_project_id", reraProjectId);
      if (error) {
        console.error(`[ProjectIntelligence] ${table} fetch error:`, error);
        return [];
      }
      return data ?? [];
    };

    const fetchSingleByProjectId = async (table: string) => {
      if (!reraProjectId) return null;
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("rera_project_id", reraProjectId)
        .maybeSingle();
      if (error) {
        console.error(`[ProjectIntelligence] ${table} fetch error:`, error);
        return null;
      }
      return data ?? null;
    };

    const [
      addresses,
      landSummary,
      buildings,
      units,
      plots,
      stakeholders,
      developmentWorks,
    ] = await Promise.all([
      fetchByProjectId("rera_project_addresses"),
      fetchSingleByProjectId("rera_project_land_summary"),
      fetchByProjectId("rera_buildings"),
      fetchByProjectId("rera_units"),
      fetchByProjectId("rera_plots"),
      fetchByProjectId("rera_stakeholders"),
      fetchByProjectId("rera_project_development_works"),
    ]);

    const totalUnits = units.length;
    const totalBuildings = buildings.length;
    const promoterCount = stakeholders.length;
    const primaryAddress = addresses[0] ?? null;
    const landArea = landSummary?.total_land_area ?? null;
    const builtupArea = landSummary?.total_builtup_area ?? null;
    const proposedCompletionDate = reraProject?.proposed_completion_date ?? null;

    const floors = buildings
      .map((building: any) => {
        const raw =
          building?.total_floors ??
          building?.floors ??
          building?.number_of_floors ??
          building?.no_of_floors ??
          null;
        const parsed = raw === null || raw === undefined ? null : Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value: number | null): value is number => value !== null);

    const minFloors = floors.length > 0 ? Math.min(...floors) : null;
    const maxFloors = floors.length > 0 ? Math.max(...floors) : null;
    const avgFloors =
      floors.length > 0
        ? floors.reduce((sum, value) => sum + value, 0) / floors.length
        : null;
    const avgUnitsPerBuilding =
      totalBuildings > 0 ? totalUnits / totalBuildings : null;

    const linkedResult: ProjectIntelligenceResult = {
      status: "linked",
      commercial: project,
      intelligence_snapshot: {
        project: {
          id: project.id,
          name: project.project_name,
          url_slug: project.url_slug ?? null,
          city_slug: projectCitySlug,
        },
        mapping_id: mapping.id ?? null,
        rera_project_id: reraProjectId,
        fetched_at: new Date().toISOString(),
        core: {
          locality: primaryAddress?.locality ?? null,
          mandal: primaryAddress?.mandal ?? null,
          district: primaryAddress?.district ?? null,
          land_area: landArea,
          builtup_area: builtupArea,
          total_buildings: totalBuildings,
          total_units: totalUnits,
          promoter_count: promoterCount,
          proposed_completion_date: proposedCompletionDate,
        },
      },
      project_dna: {
        land_summary: { raw: landSummary },
        development_works: {
          raw: developmentWorks,
          count: developmentWorks.length,
        },
        buildings: {
          raw: buildings,
          count: totalBuildings,
          min_floors: minFloors,
          max_floors: maxFloors,
          avg_floors: avgFloors,
        },
        units: {
          raw: units,
          count: totalUnits,
          avg_units_per_building: avgUnitsPerBuilding,
        },
      },
      regulatory: {
        rera_project: { raw: reraProject },
      },
      developer_intelligence: {
        stakeholders: { raw: stakeholders, count: stakeholders.length },
      },
      micro_market_intelligence: {
        addresses: { raw: addresses, count: addresses.length },
      },
      official_rera: {
        project: reraProject,
        addresses,
        land_summary: landSummary,
        buildings,
        units,
        plots,
        stakeholders,
        development_works: developmentWorks,
      },
    };

    if (process.env.NODE_ENV === "development" && project.enable_intelligence) {
      console.log("[ProjectIntelligence] Result:", linkedResult);
    }

    return linkedResult;
  },
};
