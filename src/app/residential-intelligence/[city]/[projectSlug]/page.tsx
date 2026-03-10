import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { reraIntelligenceService } from "@/services/reraIntelligenceService";
import { computeProjectDNA } from "@/intelligence/projectDNA";
import { computeWestsideDensityIndex } from "@/intelligence/westsideDensityIndex";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import IntelligenceHeader from "@/components/residential-intelligence/IntelligenceHeader";
import ResidentialIntelligenceSnapshot from "@/components/residential-intelligence/ResidentialIntelligenceSnapshot";
import WestsideDensityIndexPanel from "@/components/residential-intelligence/dna/WestsideDensityIndexPanel";
import ProjectDNACards from "@/components/residential-intelligence/dna/ProjectDNACards";
import StructuralProfileSection from "@/components/residential-intelligence/StructuralProfileSection";
import IntelligenceLeadCTA from "@/components/residential-intelligence/IntelligenceLeadCTA";
import { villaIntelligenceService } from "@/services/villaIntelligenceService";
import { mapVillaIntelligenceProfile } from "@/intelligence/villaProfileMapper";
import VillaIntelligenceHeader from "@/components/residential-intelligence/villa-profile/IntelligenceHeader";
import SnapshotPanel from "@/components/residential-intelligence/villa-profile/SnapshotPanel";
import HorizontalSystemProfile from "@/components/residential-intelligence/villa-profile/HorizontalSystemProfile";
import ProjectDNA from "@/components/residential-intelligence/villa-profile/ProjectDNA";
import PlanningModel from "@/components/residential-intelligence/villa-profile/PlanningModel";
import MarketPositioning from "@/components/residential-intelligence/villa-profile/MarketPositioning";
import RiskSignals from "@/components/residential-intelligence/villa-profile/RiskSignals";
import VillaEcosystem from "@/components/residential-intelligence/villa-profile/VillaEcosystem";
import IntelligenceFooter from "@/components/residential-intelligence/villa-profile/IntelligenceFooter";

const normalizeStructuralProfile = (
  structuralProfile: Record<string, unknown> | null,
  landSummary: Record<string, unknown> | null
): Record<string, unknown> | null => {
  if (!structuralProfile) return null;
  const profile = { ...structuralProfile } as Record<string, unknown>;

  const landTotal =
    (landSummary as any)?.total_land_area ?? (landSummary as any)?.land_area ?? null;
  const landNet =
    (landSummary as any)?.net_land_area ?? (landSummary as any)?.net_land_area_sqm ?? null;
  const builtupSqft =
    (landSummary as any)?.total_built_up_area ??
    (landSummary as any)?.total_builtup_area ??
    null;
  const builtupSqm =
    (landSummary as any)?.total_builtup_area_sqm ??
    (structuralProfile as any)?.total_residential_built_up_area ??
    null;

  return {
    ...profile,
    total_land_area_sqm: profile.total_land_area_sqm ?? landTotal,
    net_land_area_sqm: profile.net_land_area_sqm ?? landNet,
    total_built_up_area_sqft: profile.total_built_up_area_sqft ?? builtupSqft,
    total_builtup_area_sqft: profile.total_builtup_area_sqft ?? builtupSqft,
    total_builtup_area_sqm:
      profile.total_builtup_area_sqm ??
      profile.total_residential_built_up_area ??
      builtupSqm,
    residential_structures:
      profile.residential_structures ?? profile.apartment_tower_count ?? null,
    total_structures:
      profile.total_structures ??
      profile.residential_structures ??
      profile.apartment_tower_count ??
      null,
  };
};

const buildIntelligenceInput = (
  reraProject: Record<string, unknown>,
  structuralProfile: Record<string, unknown> | null
): ProjectIntelligenceResult => {
  const profile = structuralProfile ?? null;
  return {
    status: "linked",
    commercial: null,
    intelligence_snapshot: {
      project: {
        id: String((reraProject as any)?.id ?? ""),
        name: String((reraProject as any)?.project_name ?? "Residential Project"),
        url_slug: (reraProject as any)?.url_slug ?? null,
        city_slug: (reraProject as any)?.city_slug ?? null,
      },
      mapping_id: null,
      rera_project_id: (reraProject as any)?.id ?? null,
      fetched_at: new Date().toISOString(),
      core: {
        total_units: (profile as any)?.total_units ?? 0,
        total_towers:
          (profile as any)?.apartment_tower_count ??
          (profile as any)?.residential_structures ??
          null,
        total_floors: (profile as any)?.max_floors ?? null,
        min_floors: (profile as any)?.min_floors ?? null,
        max_floors: (profile as any)?.max_floors ?? null,
        physical_typology: (profile as any)?.physical_typology ?? null,
        vertical_applicable: (profile as any)?.vertical_applicable ?? null,
        density_applicable: (profile as any)?.density_applicable ?? null,
        location: { survey_numbers: [] },
      },
    },
    structural_intelligence: {
      profile,
    },
  };
};

export const revalidate = 86400; // rebuild daily

export async function generateStaticParams() {
  const supabase = createServiceClient();
  const { data: projects } = await supabase
    .from("rera_projects")
    .select("city_slug, url_slug")
    .not("city_slug", "is", null)
    .not("url_slug", "is", null)
    .limit(50);
  return (
    projects?.map((p) => ({
      city: p.city_slug,
      projectSlug: p.url_slug,
    })) ?? []
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { city, projectSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("rera_projects")
    .select("project_name")
    .eq("url_slug", projectSlug)
    .maybeSingle();
  const projectName = data?.project_name ?? projectSlug;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);
  return {
    title: `${projectName} | ${cityName} Property Insights | Westside Realty`,
    description: `Detailed price trends, floor plan analysis and investment outlook for ${projectName} in ${cityName}. Westside Realty residential intelligence.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ city: string; projectSlug: string }>;
}) {
  const resolvedParams = await params;
  console.log(
    "[RI ROUTE HIT]",
    resolvedParams.city,
    resolvedParams.projectSlug
  );
  const data = await reraIntelligenceService.getResidentialIntelligence(
    resolvedParams.city,
    resolvedParams.projectSlug
  );

  if (!data) {
    notFound();
  }

  const {
    rera_project,
    structural_profile,
    land_summary,
    villaIntelligence,
    type,
  } = data;

  const isVillaProject = type === "villa";
  const isApartmentProject = type === "apartment";

  const villaProfile = isVillaProject
    ? mapVillaIntelligenceProfile(
        (await villaIntelligenceService.getProfileBySlug(
          resolvedParams.city,
          resolvedParams.projectSlug
        )) ??
          (await villaIntelligenceService.getProfileByProjectId(
            String((rera_project as any)?.id ?? "")
          ))
      )
    : null;

  const microMarket = (() => {
    const addr = (data as any)?.address ?? null;
    const locality = addr?.locality ?? addr?.village ?? null;
    const cityLabel = String((rera_project as any)?.city_slug ?? resolvedParams.city ?? "")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const base = [locality, cityLabel || null].filter(Boolean).join(" · ");
    if (base) {
      return base;
    }
    if (villaProfile?.project.mandal) {
      return `${villaProfile.project.mandal} · ${cityLabel}`;
    }
    return null;
  })();

  const normalizedProfile = isApartmentProject
    ? normalizeStructuralProfile(
        structural_profile as Record<string, unknown> | null,
        land_summary as Record<string, unknown> | null
      )
    : null;

  const dna = isApartmentProject
    ? computeProjectDNA(buildIntelligenceInput(rera_project, normalizedProfile))
    : null;

  const westside_density_index =
    isApartmentProject && dna ? computeWestsideDensityIndex(dna) : null;

  if (isVillaProject && !villaProfile) {
    notFound();
  }

  if (isApartmentProject && dna && westside_density_index) {
    console.log("[APARTMENT RESTORED CHECK]", {
      project: (rera_project as any)?.project_name ?? null,
      apartment_tower_count: (structural_profile as any)?.apartment_tower_count ?? null,
      total_units: (structural_profile as any)?.total_units ?? null,
      min_floors: (structural_profile as any)?.min_floors ?? null,
      max_floors: (structural_profile as any)?.max_floors ?? null,
      wdi: {
        score: westside_density_index.score,
        crowding_score: westside_density_index.crowding_score,
        tower_load_score: westside_density_index.tower_load_score,
        vertical_score: westside_density_index.vertical_score,
        land_stress_score: westside_density_index.land_stress_score,
      },
      density_inputs: {
        units_per_acre: dna.density.units_per_acre,
        units_per_tower: dna.density.units_per_tower,
        avg_units_per_floor: dna.density.avg_units_per_floor,
      },
      vertical_inputs: {
        avg_floors_per_tower: dna.vertical.avg_floors_per_tower,
        vertical_intensity: dna.vertical.vertical_intensity,
      },
      land_inputs: {
        land_per_unit_sqft: dna.land.land_per_unit_sqft,
        builtup_to_land_ratio: dna.land.builtup_to_land_ratio,
      },
    });
  }

  const reraStatus =
    (rera_project as any)?.rera_id || (rera_project as any)?.registration_number
      ? "RERA Registered"
      : "Under RERA Review";

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-16">
        {isVillaProject && villaProfile ? (
          <>
            <VillaIntelligenceHeader
              profile={villaProfile}
              microMarket={microMarket}
              reraStatus={reraStatus}
            />
            <SnapshotPanel profile={villaProfile} />
            <HorizontalSystemProfile profile={villaProfile} />
            <ProjectDNA profile={villaProfile} />
            <PlanningModel profile={villaProfile} />
            <MarketPositioning profile={villaProfile} />
            <RiskSignals profile={villaProfile} />
            <VillaEcosystem profile={villaProfile} />
            <IntelligenceFooter />
          </>
        ) : (
          <>
            <IntelligenceHeader project={rera_project} microMarket={microMarket} />
            <div className="space-y-12">
              {westside_density_index ? (
                <div>
                  <WestsideDensityIndexPanel index={westside_density_index} />
                </div>
              ) : null}
              {isApartmentProject && dna ? (
                <div className="border-t border-slate-200/70 pt-12">
                  <ResidentialIntelligenceSnapshot
                    structuralProfile={structural_profile}
                    landSummary={land_summary}
                    dna={dna}
                  />
                </div>
              ) : null}
              {isApartmentProject && dna ? (
                <div className="border-t border-slate-200/70 pt-12">
                  <ProjectDNACards projectDna={dna} />
                </div>
              ) : null}
              {isApartmentProject ? (
                <div className="border-t border-slate-200/70 pt-12">
                  <StructuralProfileSection
                    structuralProfile={structural_profile as Record<string, unknown> | null}
                    landSummary={land_summary as Record<string, unknown> | null}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}

        <IntelligenceLeadCTA />
      </div>
    </div>
  );
}
