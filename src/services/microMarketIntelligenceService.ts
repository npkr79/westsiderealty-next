import { createClient } from "@/lib/supabase/server";

export interface MicroMarketSnapshotV1 {
  micro_market_id: string;
  micro_market_name: string;
  city: string | null;
  market_scale: {
    total_projects: number;
    total_units: number;
    total_towers: number;
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

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id")
    .eq("micro_market_id", microMarket.id);

  if (projectsError) {
    console.error("[MicroMarketIntelligence] projects fetch error:", projectsError);
  }

  const projectIds = (projects ?? []).map((project) => project.id).filter(Boolean);

  if (!projectIds.length) {
    return {
      micro_market_id: microMarket.id,
      micro_market_name: microMarket.micro_market_name,
      city: cityValue,
      market_scale: {
        total_projects: 0,
        total_units: 0,
        total_towers: 0,
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

  const { data: projectLinks, error: projectLinksError } = await supabase
    .from("project_rera_links")
    .select("project_id, rera_project_id")
    .in("project_id", projectIds);

  if (projectLinksError) {
    console.error("[MicroMarketIntelligence] project_rera_links fetch error:", projectLinksError);
  }

  const reraProjectIds = Array.from(
    new Set((projectLinks ?? []).map((link) => link.rera_project_id).filter(Boolean))
  );

  if (!reraProjectIds.length) {
    return {
      micro_market_id: microMarket.id,
      micro_market_name: microMarket.micro_market_name,
      city: cityValue,
      market_scale: {
        total_projects: 0,
        total_units: 0,
        total_towers: 0,
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
      .select("id, current_status, approved_date")
      .in("id", reraProjectIds),
    supabase
      .from("rera_units")
      .select("project_id, rera_building_id, floor_id, raw_apartment_type")
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

  const totalProjects = reraProjects.length;

  const approvedUnits = reraUnits.filter(
    (unit) => unit.raw_apartment_type?.toUpperCase() !== "CLUBHOUSE"
  );

  const totalUnits = approvedUnits.length;

  const totalTowers = new Set(
    approvedUnits.map((unit) => unit.rera_building_id).filter(Boolean)
  ).size;

  const totalLandSqm = landSummaries.reduce((sum, summary) => {
    const landArea = toNumber(summary.total_land_area);
    return landArea !== null ? sum + landArea : sum;
  }, 0);

  const hasLandData = landSummaries.some(
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

  const floorMap = new Map<string, number>();
  for (const unit of reraUnits) {
    if (!unit.rera_building_id) continue;
    const floorValue = toNumber(unit.floor_id);
    if (floorValue === null) continue;
    const currentMax = floorMap.get(unit.rera_building_id);
    if (currentMax === undefined || floorValue > currentMax) {
      floorMap.set(unit.rera_building_id, floorValue);
    }
  }

  const buildingIds = Array.from(
    new Set(approvedUnits.map((unit) => unit.rera_building_id).filter(Boolean))
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

  const unitsByProject = new Map<string, number>();
  for (const projectId of reraProjectIds) {
    unitsByProject.set(projectId, 0);
  }
  for (const unit of approvedUnits) {
    if (!unit.project_id) continue;
    unitsByProject.set(unit.project_id, (unitsByProject.get(unit.project_id) ?? 0) + 1);
  }

  const projectUnitCounts = Array.from(unitsByProject.values()).filter(
    (count) => count > 0
  );
  const medianProjectUnits = median(projectUnitCounts);
  const dominantScaleClass = classifyScale(medianProjectUnits);

  const normalizedStatus = (status: unknown) =>
    typeof status === "string" ? status.trim().toLowerCase() : "";

  const completedStatuses = new Set(["completed", "project completed"]);
  const activeStatuses = new Set(["ongoing", "under construction", "new"]);

  const completedProjects = reraProjects.filter((project) =>
    completedStatuses.has(normalizedStatus(project.current_status))
  ).length;

  const activeProjects = reraProjects.filter((project) =>
    activeStatuses.has(normalizedStatus(project.current_status))
  ).length;

  const underConstructionProjects = activeProjects;

  const constructionRatio = roundTo(
    safeDivide(activeProjects, totalProjects),
    2
  );

  const approvedDates = reraProjects
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
      total_units: totalUnits,
      total_towers: totalTowers,
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
