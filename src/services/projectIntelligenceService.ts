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
      registration_date?: string | null;
      approved_by?: string | null;
      land_area_sqm?: string | null;
      net_land_area_sqm?: string | null;
      builtup_area_sqft?: number | null;
      builtup_area_sqft_formatted?: string | null;
      total_towers: number | null;
      total_units: number;
      total_floors: number | null;
      min_floors: number | null;
      max_floors: number | null;
      has_landowner_promoter?: boolean | null;
      location: {
        survey_numbers: string[];
      };
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
    land_parcels?: any[];
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
      plots,
      stakeholders,
      developmentWorks,
      landParcels,
    ] = await Promise.all([
      fetchByProjectId("rera_project_addresses"),
      fetchSingleByProjectId("rera_project_land_summary"),
      fetchByProjectId("rera_buildings"),
      fetchByProjectId("rera_plots"),
      fetchByProjectId("rera_stakeholders"),
      fetchByProjectId("rera_project_development_works"),
      fetchByProjectId("rera_land_parcels"),
    ]);

    const { data: unitsRaw, error: unitsError } = await supabase
      .from("rera_units")
      .select("*")
      .or(`project_id.eq.${reraProjectId},rera_project_id.eq.${reraProjectId}`);

    if (unitsError) {
      console.error("[ProjectIntelligence] rera_units fetch error:", unitsError);
    }

    const units = unitsRaw ?? [];

    const approvedUnits = units.filter(
      (unit: any) =>
        unit?.raw_apartment_type?.toUpperCase() !== "CLUBHOUSE"
    ).length;
    const filteredUnits = units.filter(
      (unit: any) => unit?.raw_apartment_type?.toUpperCase() !== "CLUBHOUSE"
    );
    const totalUnitsAll = units.length;
    const totalBuildings = buildings.length;
    const primaryAddress = addresses[0] ?? null;
    const proposedCompletionDate = reraProject?.proposed_completion_date ?? null;
    const registrationDate =
      reraProject?.approved_date ?? reraProject?.project_start_date ?? null;
    const landAreaSqm = landSummary?.total_land_area ?? null;
    const netLandAreaSqm = landSummary?.net_land_area ?? null;

    const builtupAreaSqm = (() => {
      if (!filteredUnits.length) return null;
      let sum = 0;
      let hasValue = false;
      filteredUnits.forEach((unit: any) => {
        const raw = unit?.saleable_area;
        const parsed = raw === null || raw === undefined ? null : Number(raw);
        if (Number.isFinite(parsed)) {
          sum += parsed as number;
          hasValue = true;
        }
      });
      return hasValue ? sum : null;
    })();
    const builtupAreaSqft =
      builtupAreaSqm === null ? null : Math.round(builtupAreaSqm * 10.7639);
    const builtupAreaSqftFormatted =
      builtupAreaSqft === null ? null : builtupAreaSqft.toLocaleString("en-IN");

    const floorValues = units
      .map((unit: any) => Number(unit?.floor_id))
      .filter((value: number) => Number.isFinite(value));
    const totalFloors =
      floorValues.length > 0 ? Math.max(...floorValues) : null;

    const unitBuildingIds = new Set(
      units.map((unit: any) => unit?.rera_building_id).filter(Boolean)
    );
    const validBuildings = buildings.filter((building: any) =>
      unitBuildingIds.has(building.id)
    );
    const totalTowers = new Set(validBuildings.map((building: any) => building.id))
      .size;
    const approvedBy = reraProject?.authority_name ?? null;
    const hasLandownerPromoter = reraProject?.has_landowner_promoter ?? null;
    const surveyNumbers = Array.from(
      new Set(
        (landParcels || [])
          .map((parcel: any) => parcel?.survey_no)
          .filter(Boolean)
          .map((value: string) => value.trim())
      )
    );

    const avgUnitsPerBuilding =
      totalBuildings > 0 ? totalUnitsAll / totalBuildings : null;

    console.log("RERA INTELLIGENCE AUDIT", {
      units_total: units.length,
      approved_units: approvedUnits,
      distinct_unit_buildings: unitBuildingIds.size,
      valid_buildings_used: validBuildings.length,
      total_towers: totalTowers,
      max_floor: totalFloors,
      survey_numbers: surveyNumbers,
    });

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
          registration_date: registrationDate,
          approved_by: approvedBy,
          land_area_sqm: landAreaSqm,
          net_land_area_sqm: netLandAreaSqm,
          builtup_area_sqft: builtupAreaSqft,
          builtup_area_sqft_formatted: builtupAreaSqftFormatted,
          total_towers: totalTowers,
          total_units: approvedUnits,
          total_floors: totalFloors,
          min_floors: null,
          max_floors: null,
          has_landowner_promoter: hasLandownerPromoter,
          location: {
            survey_numbers: surveyNumbers,
          },
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
          min_floors: null,
          max_floors: null,
          avg_floors: null,
        },
        units: {
          raw: units,
          count: totalUnitsAll,
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
        land_parcels: landParcels,
      },
    };

    if (process.env.NODE_ENV === "development" && project.enable_intelligence) {
      console.log("[ProjectIntelligence] Result:", linkedResult);
    }

    return linkedResult;
  },
};
