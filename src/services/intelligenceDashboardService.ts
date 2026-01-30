import { createClient } from "@/lib/supabase/server";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import { computeProjectDNA } from "@/intelligence/projectDNA";
import { computeWestsideDensityIndex } from "@/intelligence/westsideDensityIndex";

const SQM_PER_ACRE = 4046.8564224;
const SQFT_PER_ACRE = 43560;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const chunk = <T,>(arr: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const fetchByIds = async <T,>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  select: string,
  idField: string,
  ids: string[]
) => {
  const results: T[] = [];
  for (const group of chunk(ids, 100)) {
    const { data, error } = await supabase.from(table).select(select).in(idField, group);
    if (error) {
      const message =
        (error as any)?.message ??
        (error as any)?.details ??
        (error as any)?.hint ??
        JSON.stringify(error);
      console.error(`[IntelligenceDashboard] ${table} fetch error:`, message);
      continue;
    }
    results.push(...((data ?? []) as T[]));
  }
  return results;
};

export interface ApartmentIntelligenceProject {
  id: string;
  name: string;
  slug: string;
  microMarket: string | null;
  towers: number | null;
  floors: number | null;
  totalUnits: number | null;
  unitsPerAcre: number | null;
  unitsPerTower: number | null;
  landPerUnitSqft: number | null;
  wdiScore: number | null;
}

export interface VillaIntelligenceProject {
  id: string;
  name: string;
  slug: string;
  microMarket: string | null;
  totalVillas: number | null;
  totalLandAcres: number | null;
  villasPerAcre: number | null;
  landPerVillaSqft: number | null;
  densityClass: string | null;
  landStrengthClass: string | null;
  scaleClass: string | null;
  compactnessBand: string | null;
}

const buildProjectIntelligence = (
  project: { id: string; project_name: string; url_slug: string | null; city_slug: string | null },
  structuralProfile: Record<string, unknown> | null,
  landSummary: Record<string, unknown> | null
): ProjectIntelligenceResult => ({
  status: "linked",
  commercial: null,
  intelligence_snapshot: {
    project: {
      id: project.id,
      name: project.project_name,
      url_slug: project.url_slug ?? null,
      city_slug: project.city_slug ?? null,
    },
    mapping_id: null,
    rera_project_id: project.id,
    fetched_at: new Date().toISOString(),
    core: {
      total_units: (structuralProfile as any)?.total_units ?? 0,
      total_towers: (structuralProfile as any)?.apartment_tower_count ?? null,
      total_floors: (structuralProfile as any)?.max_floors ?? null,
      min_floors: (structuralProfile as any)?.min_floors ?? null,
      max_floors: (structuralProfile as any)?.max_floors ?? null,
      physical_typology: (structuralProfile as any)?.physical_typology ?? null,
      vertical_applicable: (structuralProfile as any)?.vertical_applicable ?? null,
      density_applicable: (structuralProfile as any)?.density_applicable ?? null,
      location: { survey_numbers: [] },
    },
  },
  structural_intelligence: {
    profile: structuralProfile
      ? {
          ...structuralProfile,
          total_land_area_sqm:
            (structuralProfile as any)?.total_land_area_sqm ??
            (landSummary as any)?.total_land_area ??
            null,
          net_land_area_sqm:
            (structuralProfile as any)?.net_land_area_sqm ??
            (landSummary as any)?.net_land_area ??
            null,
        }
      : null,
  },
});

export const intelligenceDashboardService = {
  async getApartmentProjects(citySlug: string): Promise<ApartmentIntelligenceProject[]> {
    const supabase = await createClient();
    const { data: projects, error } = await supabase
      .from("rera_projects")
      .select("id, project_name, url_slug, city_slug")
      .eq("city_slug", citySlug.toLowerCase());

    if (error || !projects?.length) {
      console.error("[IntelligenceDashboard] rera_projects fetch error:", error);
      return [];
    }

    const projectIds = projects.map((project) => project.id);
    const profiles = await fetchByIds<Record<string, unknown>>(
      supabase,
      "project_structural_profile",
      "rera_project_id, apartment_tower_count, total_units, min_floors, max_floors, avg_floors, physical_typology, vertical_applicable, density_applicable",
      "rera_project_id",
      projectIds
    );

    const apartmentProfiles = profiles.filter(
      (profile) => (profile as any)?.physical_typology === "apartment_project"
    );
    const apartmentIds = apartmentProfiles
      .map((profile) => (profile as any)?.rera_project_id)
      .filter(Boolean);

    if (!apartmentIds.length) {
      return [];
    }

    const landSummaries = await fetchByIds<Record<string, unknown>>(
      supabase,
      "rera_project_land_summary",
      "rera_project_id, total_land_area, net_land_area",
      "rera_project_id",
      apartmentIds
    );

    const addresses = await fetchByIds<Record<string, unknown>>(
      supabase,
      "rera_project_addresses",
      "rera_project_id, micro_market, locality, mandal",
      "rera_project_id",
      apartmentIds
    );

    const profileById = new Map(
      apartmentProfiles.map((profile) => [(profile as any).rera_project_id, profile])
    );
    const landById = new Map(
      landSummaries.map((summary) => [(summary as any).rera_project_id, summary])
    );
    const addressById = new Map(
      addresses.map((address) => [(address as any).rera_project_id, address])
    );

    return projects
      .filter((project) => profileById.has(project.id))
      .map((project) => {
        const profile = profileById.get(project.id) ?? null;
        const landSummary = landById.get(project.id) ?? null;
        const address = addressById.get(project.id) ?? null;

        const totalUnits = toNumber((profile as any)?.total_units);
        const towers = toNumber((profile as any)?.apartment_tower_count);
        const maxFloors = toNumber((profile as any)?.max_floors);
        const totalLandSqm = toNumber(
          (landSummary as any)?.total_land_area ?? (landSummary as any)?.land_area ?? null
        );
        const landAcres = totalLandSqm ? totalLandSqm / SQM_PER_ACRE : null;
        const unitsPerAcre =
          totalUnits !== null && landAcres && landAcres > 0 ? totalUnits / landAcres : null;
        const landPerUnitSqft =
          totalUnits !== null && landAcres && landAcres > 0
            ? (landAcres * SQFT_PER_ACRE) / totalUnits
            : null;
        const unitsPerTower =
          totalUnits !== null && towers && towers > 0 ? totalUnits / towers : null;

        const intelligence = buildProjectIntelligence(project, profile, landSummary);
        const dna = computeProjectDNA(intelligence);
        const wdi = computeWestsideDensityIndex(dna);

        return {
          id: project.id,
          name: project.project_name,
          slug: project.url_slug ?? "",
          microMarket:
            (address as any)?.micro_market ??
            (address as any)?.locality ??
            (address as any)?.mandal ??
            null,
          towers: towers ?? null,
          floors: maxFloors ?? null,
          totalUnits: totalUnits ?? null,
          unitsPerAcre: unitsPerAcre !== null ? Number(unitsPerAcre.toFixed(2)) : null,
          unitsPerTower: unitsPerTower !== null ? Number(unitsPerTower.toFixed(2)) : null,
          landPerUnitSqft: landPerUnitSqft !== null ? Number(landPerUnitSqft.toFixed(0)) : null,
          wdiScore: wdi?.score ?? null,
        };
      })
      .filter((project) => project.slug);
  },

  async getVillaProjects(citySlug: string): Promise<VillaIntelligenceProject[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("villa_intelligence_profiles")
      .select(
        `rera_project_id, project_name, url_slug, city_slug, mandal, micro_market,
         total_villas, total_land_acres, villas_per_acre, gross_land_per_villa_sqyd,
         land_per_villa_sqft, density_class, land_strength_class, scale_class, compactness_band`
      )
      .eq("city_slug", citySlug.toLowerCase());

    if (error) {
      console.error("[IntelligenceDashboard] villa_intelligence_profiles fetch error:", error);
      return [];
    }

    return (data ?? [])
      .map((row: any) => {
        const totalVillas = toNumber(row.total_villas);
        const totalLandAcres = toNumber(row.total_land_acres);
        const villasPerAcre = toNumber(row.villas_per_acre);
        const landPerVillaSqft =
          toNumber(row.land_per_villa_sqft) ??
          (toNumber(row.gross_land_per_villa_sqyd) !== null
            ? Number(toNumber(row.gross_land_per_villa_sqyd)! * 9)
            : null);

        return {
          id: row.rera_project_id,
          name: row.project_name ?? "Villa ecosystem",
          slug: row.url_slug ?? "",
          microMarket: row.micro_market ?? row.mandal ?? null,
          totalVillas: totalVillas ?? null,
          totalLandAcres: totalLandAcres ?? null,
          villasPerAcre: villasPerAcre ?? null,
          landPerVillaSqft: landPerVillaSqft ?? null,
          densityClass: row.density_class ?? null,
          landStrengthClass: row.land_strength_class ?? null,
          scaleClass: row.scale_class ?? null,
          compactnessBand: row.compactness_band ?? null,
        };
      })
      .filter((project) => project.slug);
  },
};
