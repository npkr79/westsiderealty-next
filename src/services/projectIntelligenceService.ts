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
    developer?: {
      name: string | null;
      office_address?: string | null;
      district?: string | null;
      state?: string | null;
      pincode?: string | null;
      past_experience_flag?: boolean | null;
      criminal_cases_flag?: boolean | null;
      has_landowner_promoter?: boolean | null;
    };
    land_and_project_scale?: {
      land_area: string | null;
      net_land_area: string | null;
      builtup_area_sqft: string | null;
      total_towers: number | null;
      total_floors: number | null;
      total_units: number | null;
    };
    core?: {
      locality?: string | null;
      mandal?: string | null;
      district?: string | null;
      village?: string | null;
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
      physical_typology?: string | null;
      vertical_applicable?: boolean | null;
      density_applicable?: boolean | null;
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
  structural_intelligence?: {
    profile: any | null;
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
    console.log("[INTEL] Requested:", { citySlug, projectSlug });
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

    /*
      SQL helper: find projects with RERA IDs but missing links
      --------------------------------------------------------
      SELECT
        p.id AS project_id,
        p.project_name,
        p.rera_id,
        rp.id AS rera_project_id,
        rp.registration_number
      FROM projects p
      LEFT JOIN project_rera_links prl
        ON prl.project_id = p.id
       AND prl.is_primary = true
      LEFT JOIN rera_projects rp
        ON rp.registration_number = p.rera_id
      WHERE p.enable_intelligence = true
        AND p.rera_id IS NOT NULL
        AND prl.project_id IS NULL;

      SQL template: create a primary link
      -----------------------------------
      INSERT INTO project_rera_links (
        project_id,
        rera_project_id,
        is_primary,
        created_at
      )
      VALUES (
        '<PROJECT_UUID>',
        '<RERA_PROJECT_UUID>',
        true,
        NOW()
      );
    */

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
      console.warn("[INTEL] Project is UNLINKED to RERA:", {
        project_id: project.id,
        slug: project.url_slug,
        rera_id: (project as any).rera_id,
      });
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

    const { data: promoter } = await supabase
      .from("rera_promoters")
      .select("*")
      .eq("rera_project_id", reraProjectId)
      .maybeSingle();

    const { data: unitStats } = await supabase
      .from("rera_project_unit_stats")
      .select("*")
      .eq("project_id", reraProjectId)
      .maybeSingle();

    const { data: structuralProfile } = await supabase
      .from("project_structural_profile")
      .select("*")
      .eq("rera_project_id", reraProjectId)
      .maybeSingle();
    console.log("[INTEL] Structural profile:", structuralProfile);

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

    const [{ data: unitsByProjectId, error: err1 }, { data: unitsByReraProjectId, error: err2 }] =
      await Promise.all([
        supabase
          .from("rera_units")
          .select("*")
          .eq("project_id", reraProjectId)
          .range(0, 10000),
        supabase
          .from("rera_units")
          .select("*")
          .eq("rera_project_id", reraProjectId)
          .range(0, 10000),
      ]);

    if (err1) console.error("Units fetch (project_id) error:", err1);
    if (err2) console.error("Units fetch (rera_project_id) error:", err2);

    const units = [
      ...(unitsByProjectId ?? []),
      ...(unitsByReraProjectId ?? []),
    ];
    const unitRowCount = units.length;
    const sumUnitsFromRows = units.reduce((sum: number, unit: any) => {
      const rawValue = unit?.total_units;
      const numericValue =
        rawValue === null || rawValue === undefined || rawValue === ""
          ? null
          : Number(rawValue);
      if (Number.isFinite(numericValue as number)) {
        return sum + (numericValue as number);
      }
      return sum + 1;
    }, 0);

    if (sumUnitsFromRows > unitRowCount * 1.2) {
      console.warn("[INTEL] Non-atomic unit rows detected — using expanded total_units", {
        project_id: project.id,
        rera_project_id: reraProjectId,
        unit_rows: unitRowCount,
        summed_units: sumUnitsFromRows,
      });
    }
    const totalBuildings = buildings.length;
    const primaryAddress = addresses[0] ?? null;
    const proposedCompletionDate = reraProject?.proposed_completion_date ?? null;
    const registrationDate =
      reraProject?.approved_date ?? reraProject?.project_start_date ?? null;
    const landAreaSqm = landSummary?.total_land_area ?? null;
    const netLandAreaSqm = landSummary?.net_land_area ?? null;
    const sqmToAcres = (sqm: number) => sqm / 4046.8564224;
    const landAreaAcres =
      landAreaSqm ? `${sqmToAcres(Number(landAreaSqm)).toFixed(2)} acres` : null;
    const netLandAreaAcres =
      netLandAreaSqm ? `${sqmToAcres(Number(netLandAreaSqm)).toFixed(2)} acres` : null;

    const totalUnits =
      unitRowCount > 0 ? sumUnitsFromRows : (unitStats?.total_units ?? null);
    const totalTowers = structuralProfile?.apartment_tower_count ?? null;
    const totalFloors = structuralProfile?.max_floors ?? null;
    const minFloors = structuralProfile?.min_floors ?? null;
    const avgFloors = structuralProfile?.avg_floors ?? null;
    const physicalTypology = structuralProfile?.physical_typology ?? null;
    const verticalApplicable = structuralProfile?.vertical_applicable ?? false;
    const densityApplicable = structuralProfile?.density_applicable ?? false;
    const minUnitSize = unitStats?.min_unit_size ?? null;
    const maxUnitSize = unitStats?.max_unit_size ?? null;
    const builtupSqm = unitStats?.total_saleable_area_sqm ?? null;
    const builtupSqft = builtupSqm ? Math.round(builtupSqm * 10.7639) : null;
    const formatIndianNumber = (num: number) => num.toLocaleString("en-IN");
    const builtupSqftFormatted = builtupSqft
      ? `${formatIndianNumber(builtupSqft)} sq.ft`
      : null;
    const approvedBy = reraProject?.authority_name ?? null;
    const hasLandownerPromoter = reraProject?.has_landowner_promoter ?? null;
    const surveyNumbers = landSummary?.survey_numbers
      ? String(landSummary.survey_numbers)
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean)
      : [];

    const avgUnitsPerBuilding =
      totalBuildings > 0 && totalUnits !== null ? totalUnits / totalBuildings : null;

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
        developer: {
          name: promoter?.organization_name ?? null,
          office_address: promoter?.office_address ?? null,
          district: promoter?.district ?? null,
          state: promoter?.state ?? null,
          pincode: promoter?.pincode ?? null,
          past_experience_flag: promoter?.past_experience_flag ?? null,
          criminal_cases_flag: promoter?.criminal_cases_flag ?? null,
          has_landowner_promoter: reraProject?.has_landowner_promoter ?? null,
        },
        land_and_project_scale: {
          land_area: landAreaAcres,
          net_land_area: netLandAreaAcres,
          builtup_area_sqft: builtupSqftFormatted,
          total_towers: totalTowers,
          total_floors: totalFloors,
          total_units: totalUnits,
        },
        core: {
          locality: primaryAddress?.locality ?? null,
          mandal: primaryAddress?.mandal ?? null,
          district: primaryAddress?.district ?? null,
          village: primaryAddress?.village ?? null,
          registration_date: registrationDate,
          approved_by: approvedBy,
          land_area_sqm: landAreaSqm,
          net_land_area_sqm: netLandAreaSqm,
          builtup_area_sqft: builtupSqft,
          builtup_area_sqft_formatted: builtupSqftFormatted,
          total_towers: totalTowers,
          total_units: totalUnits ?? null,
          total_floors: totalFloors,
          min_floors: minFloors,
          max_floors: totalFloors,
          physical_typology: physicalTypology,
          vertical_applicable: verticalApplicable,
          density_applicable: densityApplicable,
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
          count: totalUnits ?? 0,
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
      structural_intelligence: {
        profile: structuralProfile ?? null,
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

    console.log("[INTEL] Final intelligence keys:", Object.keys(linkedResult));
    console.log("[INTEL] Final structural block:", (linkedResult as any).structural_intelligence);
    console.log("STRUCTURAL PROFILE \u2192", structuralProfile);
    if (process.env.NODE_ENV === "development" && project.enable_intelligence) {
      console.log("[ProjectIntelligence] Result:", linkedResult);
    }

    return linkedResult;
  },
};
