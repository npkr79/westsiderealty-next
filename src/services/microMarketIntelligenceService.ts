import { createClient } from "@/lib/supabase/server";

export interface MicroMarketSnapshotV1 {
  micro_market_id: string;
  micro_market_name: string;
  city: string | null;
  market_scale: {
    total_projects: number;
    apartment_projects: number;
    villa_projects: number;
    total_units: number;
    apartment_units: number;
    villa_units: number;
    residential_towers: number;
    total_land_acres: number | null;
  };
  development_structure: {
    avg_units_per_acre: number | null;
    avg_floors_per_tower: number | null;
    avg_land_per_unit_sqft: number | null;
    dominant_scale_class: "boutique" | "mid-scale" | "large" | "mega" | null;
  };
  activity_maturity: {
    active_projects: number;
    completed_projects: number;
    under_construction_projects: number;
    construction_ratio: number | null;
    registration_span: {
      start: string | null;
      end: string | null;
    };
  };
  authority: {
    statement: string;
    data_source: "Telangana RERA";
    last_updated: string;
  };
}

const SQM_PER_ACRE = 4046.8564224;
const SQFT_PER_ACRE = 43560;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const roundTo = (value: number | null, decimals: number): number | null => {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const safeDivide = (numerator: number | null, denominator: number | null): number | null => {
  if (numerator === null || denominator === null || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
};

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const classifyScale = (
  projectUnitsMedian: number | null
): "boutique" | "mid-scale" | "large" | "mega" | null => {
  if (projectUnitsMedian === null) return null;
  if (projectUnitsMedian < 150) return "boutique";
  if (projectUnitsMedian <= 600) return "mid-scale";
  if (projectUnitsMedian <= 1500) return "large";
  return "mega";
};

export async function getMicroMarketSnapshotV1(
  microMarketSlug: string
): Promise<MicroMarketSnapshotV1 | null> {
  const supabase = await createClient();

  if (!microMarketSlug) {
    return null;
  }

  const { data: microMarket, error: microMarketError } = await supabase
    .from("micro_markets")
    .select(
      `
      id,
      micro_market_name,
      city:cities(city_name)
    `
    )
    .eq("url_slug", microMarketSlug)
    .maybeSingle();

  if (microMarketError) {
    if (microMarketError.code !== "PGRST116") {
      console.error("[MicroMarketIntelligence] micro_markets fetch error:", microMarketError);
    }
    return null;
  }

  if (!microMarket) {
    return null;
  }

  const cityValue = Array.isArray(microMarket.city)
    ? microMarket.city[0]?.city_name ?? null
    : (microMarket.city as any)?.city_name ?? null;

  if (microMarket.micro_market_name?.toLowerCase() !== "gandipet") {
    return null;
  }

  const { data: reraAddressRows, error: reraAddressError } = await supabase
    .from("rera_project_addresses")
    .select("rera_project_id")
    .ilike("micro_market", microMarket.micro_market_name);

  if (reraAddressError) {
    console.error(
      "[MicroMarketIntelligence] rera_project_addresses fetch error:",
      reraAddressError
    );
    return null;
  }

  const reraProjectIds = Array.from(
    new Set((reraAddressRows ?? []).map((row) => row.rera_project_id).filter(Boolean))
  );

  if (!reraProjectIds.length) {
    return {
      micro_market_id: microMarket.id,
      micro_market_name: microMarket.micro_market_name,
      city: cityValue,
      market_scale: {
        total_projects: 0,
        apartment_projects: 0,
        villa_projects: 0,
        total_units: 0,
        apartment_units: 0,
        villa_units: 0,
        residential_towers: 0,
        total_land_acres: null,
      },
      development_structure: {
        avg_units_per_acre: null,
        avg_floors_per_tower: null,
        avg_land_per_unit_sqft: null,
        dominant_scale_class: null,
      },
      activity_maturity: {
        active_projects: 0,
        completed_projects: 0,
        under_construction_projects: 0,
        construction_ratio: null,
        registration_span: {
          start: null,
          end: null,
        },
      },
      authority: {
        statement: `${microMarket.micro_market_name} currently comprises 0 registered residential projects representing approximately 0 approved homes across unknown acres of regulated development land.`,
        data_source: "Telangana RERA",
        last_updated: new Date().toISOString(),
      },
    };
  }

  const [
    reraProjectsResult,
    reraUnitsResult,
    landSummaryResult,
    reraBuildingsResult,
  ] = await Promise.all([
    supabase
      .from("rera_projects")
      .select("id, current_status, approved_date, project_type")
      .in("id", reraProjectIds),
    supabase
      .from("rera_units")
      .select("project_id, rera_building_id, floor_id, raw_apartment_type, apartment_type")
      .in("project_id", reraProjectIds),
    supabase
      .from("rera_project_land_summary")
      .select("project_id, total_land_area")
      .in("project_id", reraProjectIds),
    supabase
      .from("rera_buildings")
      .select("id, project_id")
      .in("project_id", reraProjectIds),
  ]);

  if (reraProjectsResult.error) {
    console.error("[MicroMarketIntelligence] rera_projects fetch error:", reraProjectsResult.error);
  }
  if (reraUnitsResult.error) {
    console.error("[MicroMarketIntelligence] rera_units fetch error:", reraUnitsResult.error);
  }
  if (landSummaryResult.error) {
    console.error(
      "[MicroMarketIntelligence] rera_project_land_summary fetch error:",
      landSummaryResult.error
    );
  }
  if (reraBuildingsResult.error) {
    console.error("[MicroMarketIntelligence] rera_buildings fetch error:", reraBuildingsResult.error);
  }

  const reraProjects = reraProjectsResult.data ?? [];
  const reraUnits = reraUnitsResult.data ?? [];
  const landSummaries = landSummaryResult.data ?? [];
  const reraBuildings = reraBuildingsResult.data ?? [];

  const normalizedText = (value: unknown): string =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const isEligibleProjectType = (value: unknown): boolean => {
    const normalized = normalizedText(value);
    return normalized.includes("residential") || normalized.includes("mixed");
  };

  const eligibleProjects = reraProjects.filter((project) =>
    isEligibleProjectType(project.project_type)
  );

  const eligibleProjectIds = new Set(
    eligibleProjects.map((project) => project.id).filter(Boolean)
  );

  const eligibleUnits = reraUnits.filter(
    (unit) => unit.project_id && eligibleProjectIds.has(unit.project_id)
  );

  const isClubUnit = (unit: {
    raw_apartment_type?: string | null;
    apartment_type?: string | null;
  }): boolean => {
    const rawType = normalizedText(unit.raw_apartment_type);
    const apartmentType = normalizedText(unit.apartment_type);
    return rawType.includes("club") || apartmentType.includes("club");
  };

  const validUnits = eligibleUnits.filter((unit) => !isClubUnit(unit));

  const eligibleLandSummaries = landSummaries.filter(
    (summary) => summary.project_id && eligibleProjectIds.has(summary.project_id)
  );

  const eligibleBuildings = reraBuildings.filter(
    (building) => building.project_id && eligibleProjectIds.has(building.project_id)
  );

  const buildingCountByProject = new Map<string, number>();
  for (const building of eligibleBuildings) {
    if (!building.project_id) continue;
    buildingCountByProject.set(
      building.project_id,
      (buildingCountByProject.get(building.project_id) ?? 0) + 1
    );
  }

  const projectDiagnostics = new Map<
    string,
    {
      unitCount: number;
      maxFloor: number | null;
      hasVillaKeyword: boolean;
      hasBedroomKeyword: boolean;
      buildingCount: number;
    }
  >();

  for (const projectId of eligibleProjectIds) {
    projectDiagnostics.set(projectId, {
      unitCount: 0,
      maxFloor: null,
      hasVillaKeyword: false,
      hasBedroomKeyword: false,
      buildingCount: buildingCountByProject.get(projectId) ?? 0,
    });
  }

  for (const unit of validUnits) {
    if (!unit.project_id) continue;
    const diagnostics =
      projectDiagnostics.get(unit.project_id) ??
      {
        unitCount: 0,
        maxFloor: null,
        hasVillaKeyword: false,
        hasBedroomKeyword: false,
        buildingCount: buildingCountByProject.get(unit.project_id) ?? 0,
      };

    diagnostics.unitCount += 1;
    const floorValue = toNumber(unit.floor_id);
    if (floorValue !== null) {
      diagnostics.maxFloor =
        diagnostics.maxFloor === null ? floorValue : Math.max(diagnostics.maxFloor, floorValue);
    }

    const combinedType = `${unit.apartment_type ?? ""} ${unit.raw_apartment_type ?? ""}`.toLowerCase();
    if (combinedType.includes("villa")) {
      diagnostics.hasVillaKeyword = true;
    }
    if (combinedType.includes("bedroom")) {
      diagnostics.hasBedroomKeyword = true;
    }

    projectDiagnostics.set(unit.project_id, diagnostics);
  }

  const apartmentProjectIds = new Set<string>();
  const villaProjectIds = new Set<string>();

  for (const [projectId, diagnostics] of projectDiagnostics.entries()) {
    if (diagnostics.maxFloor !== null && diagnostics.maxFloor >= 5) {
      apartmentProjectIds.add(projectId);
    } else if (diagnostics.hasVillaKeyword || diagnostics.hasBedroomKeyword) {
      villaProjectIds.add(projectId);
    } else {
      apartmentProjectIds.add(projectId);
    }
  }

  const apartmentProjects = apartmentProjectIds.size;
  const villaProjects = villaProjectIds.size;
  const totalProjects = apartmentProjects + villaProjects;

  let apartmentUnits = 0;
  let villaUnits = 0;
  for (const unit of validUnits) {
    if (!unit.project_id) continue;
    if (apartmentProjectIds.has(unit.project_id)) {
      apartmentUnits += 1;
    } else if (villaProjectIds.has(unit.project_id)) {
      villaUnits += 1;
    }
  }

  const totalUnits = apartmentUnits + villaUnits;

  const residentialTowers = new Set(
    eligibleBuildings
      .filter((building) => building.id && apartmentProjectIds.has(building.project_id))
      .map((building) => building.id)
  ).size;

  const totalLandSqm = eligibleLandSummaries.reduce((sum, summary) => {
    const landArea = toNumber(summary.total_land_area);
    return landArea !== null ? sum + landArea : sum;
  }, 0);

  const hasLandData = eligibleLandSummaries.some(
    (summary) => toNumber(summary.total_land_area) !== null
  );

  const totalLandAcresRaw = hasLandData ? totalLandSqm / SQM_PER_ACRE : null;
  const totalLandAcres = roundTo(totalLandAcresRaw, 1);

  const avgUnitsPerAcre = roundTo(
    safeDivide(totalUnits, totalLandAcresRaw),
    1
  );

  const avgLandPerUnitSqft = roundTo(
    safeDivide(
      totalLandAcresRaw !== null ? totalLandAcresRaw * SQFT_PER_ACRE : null,
      totalUnits
    ),
    0
  );

  const apartmentUnitsForFloors = validUnits.filter(
    (unit) => unit.project_id && apartmentProjectIds.has(unit.project_id)
  );

  const floorMap = new Map<string, number>();
  for (const unit of apartmentUnitsForFloors) {
    if (!unit.rera_building_id) continue;
    const floorValue = toNumber(unit.floor_id);
    if (floorValue === null) continue;
    const currentMax = floorMap.get(unit.rera_building_id);
    if (currentMax === undefined || floorValue > currentMax) {
      floorMap.set(unit.rera_building_id, floorValue);
    }
  }

  const buildingIds = Array.from(
    new Set(apartmentUnitsForFloors.map((unit) => unit.rera_building_id).filter(Boolean))
  );

  const buildingMaxFloors = buildingIds
    .map((id) => floorMap.get(id))
    .filter((value): value is number => value !== undefined && Number.isFinite(value));

  const avgFloorsPerTower = roundTo(
    safeDivide(
      buildingMaxFloors.reduce((sum, value) => sum + value, 0),
      buildingMaxFloors.length
    ),
    1
  );

  const projectUnitCounts = Array.from(projectDiagnostics.values())
    .map((diagnostics) => diagnostics.unitCount)
    .filter((count) => count > 0);
  const medianProjectUnits = median(projectUnitCounts);
  const dominantScaleClass = classifyScale(medianProjectUnits);

  const completedProjects = eligibleProjects.filter((project) =>
    normalizedText(project.current_status).includes("complete")
  ).length;

  const activeProjects = eligibleProjects.filter((project) => {
    const normalized = normalizedText(project.current_status);
    return (
      normalized.includes("ongoing") ||
      normalized.includes("under construction") ||
      normalized.includes("new")
    );
  }).length;

  const underConstructionProjects = activeProjects;

  const constructionRatio = roundTo(
    safeDivide(activeProjects, totalProjects),
    2
  );

  const approvedDates = eligibleProjects
    .map((project) => {
      if (!project.approved_date) return null;
      const parsed = new Date(project.approved_date);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    })
    .filter((value): value is Date => value !== null);

  const startDate =
    approvedDates.length > 0
      ? new Date(Math.min(...approvedDates.map((d) => d.getTime()))).toISOString()
      : null;
  const endDate =
    approvedDates.length > 0
      ? new Date(Math.max(...approvedDates.map((d) => d.getTime()))).toISOString()
      : null;

  const acresForStatement = totalLandAcres !== null ? totalLandAcres.toFixed(1) : "unknown";

  return {
    micro_market_id: microMarket.id,
    micro_market_name: microMarket.micro_market_name,
    city: cityValue,
    market_scale: {
      total_projects: totalProjects,
      apartment_projects: apartmentProjects,
      villa_projects: villaProjects,
      total_units: totalUnits,
      apartment_units: apartmentUnits,
      villa_units: villaUnits,
      residential_towers: residentialTowers,
      total_land_acres: totalLandAcres,
    },
    development_structure: {
      avg_units_per_acre: avgUnitsPerAcre,
      avg_floors_per_tower: avgFloorsPerTower,
      avg_land_per_unit_sqft: avgLandPerUnitSqft,
      dominant_scale_class: dominantScaleClass,
    },
    activity_maturity: {
      active_projects: activeProjects,
      completed_projects: completedProjects,
      under_construction_projects: underConstructionProjects,
      construction_ratio: constructionRatio,
      registration_span: {
        start: startDate,
        end: endDate,
      },
    },
    authority: {
      statement: `${microMarket.micro_market_name} currently comprises ${totalProjects} registered residential projects representing approximately ${totalUnits} approved homes across ${acresForStatement} acres of regulated development land.`,
      data_source: "Telangana RERA",
      last_updated: new Date().toISOString(),
    },
  };
}
