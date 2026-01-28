import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import IntelligenceHeader from "@/components/residential-intelligence/IntelligenceHeader";
import ResidentialIntelligenceSnapshot from "@/components/residential-intelligence/ResidentialIntelligenceSnapshot";
import ResidentialDNASection from "@/components/residential-intelligence/ResidentialDNASection";
import StructuralProfileSection from "@/components/residential-intelligence/StructuralProfileSection";
import IntelligenceLeadCTA from "@/components/residential-intelligence/IntelligenceLeadCTA";

type PageProps = {
  params: {
    city: string;
    projectSlug: string;
  };
};

export default async function ResidentialIntelligencePage({ params }: PageProps) {
  const { city, projectSlug } = params;

  console.log("INTEL ROUTE PARAMS:", { city, projectSlug });

  const supabase = await createClient();
  const citySlug = decodeURIComponent(city).toLowerCase();
  const slug = decodeURIComponent(projectSlug).toLowerCase();

  const { data: project, error: projectError } = await supabase
    .from("rera_projects")
    .select("*")
    .eq("url_slug", slug)
    .eq("city_slug", citySlug)
    .maybeSingle();

  if (projectError) {
    throw new Error("Supabase error: " + projectError.message);
  }

  if (!project) {
    notFound();
  }

  const reraProjectId = project.id as string;

  const [
    { data: structuralProfile, error: structuralError },
    { data: buildings, error: buildingsError },
  ] = await Promise.all([
    supabase
      .from("project_structural_profile")
      .select("*")
      .eq("rera_project_id", reraProjectId)
      .maybeSingle(),
    supabase
      .from("rera_buildings_normalized")
      .select("*")
      .eq("rera_project_id", reraProjectId),
  ]);

  if (structuralError) {
    throw new Error("Supabase error: " + structuralError.message);
  }

  if (buildingsError) {
    console.error("[RES-INTEL] Buildings fetch error:", buildingsError);
  }

  const intelligence: ProjectIntelligenceResult = {
    status: "linked",
    commercial: null,
    intelligence_snapshot: {
      project: {
        id: project.id,
        name: project.project_name ?? "Unknown project",
        url_slug: project.url_slug ?? null,
        city_slug: project.city_slug ?? null,
      },
      mapping_id: null,
      rera_project_id: project.id ?? null,
      fetched_at: new Date().toISOString(),
      core: {
        total_units: (structuralProfile as any)?.total_units ?? 0,
        total_towers:
          (structuralProfile as any)?.apartment_tower_count ??
          (structuralProfile as any)?.residential_structures ??
          null,
        total_floors: (structuralProfile as any)?.max_floors ?? null,
        min_floors: (structuralProfile as any)?.min_floors ?? null,
        max_floors: (structuralProfile as any)?.max_floors ?? null,
        physical_typology: (structuralProfile as any)?.physical_typology ?? null,
        location: { survey_numbers: [] },
      },
    },
    structural_intelligence: {
      profile: (structuralProfile as any) ?? null,
    },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
      <pre className="rounded bg-black p-4 text-xs text-green-400">
        {JSON.stringify({ city, projectSlug }, null, 2)}
      </pre>

      <IntelligenceHeader project={project} city={city} />

      <ResidentialIntelligenceSnapshot
        structuralProfile={structuralProfile}
        intelligence={intelligence}
      />

      <ResidentialDNASection intelligence={intelligence} />

      <StructuralProfileSection
        structuralProfile={structuralProfile}
        buildings={buildings ?? []}
      />

      <IntelligenceLeadCTA
        projectName={project.project_name ?? "this project"}
        city={city}
      />
    </div>
  );
}
