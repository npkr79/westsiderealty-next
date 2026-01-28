import { notFound } from "next/navigation";
import { reraIntelligenceService } from "@/services/reraIntelligenceService";
import { computeProjectDNA } from "@/intelligence/projectDNA";
import { computeWestsideDensityIndex } from "@/intelligence/westsideDensityIndex";
import IntelligenceHeader from "@/components/residential-intelligence/IntelligenceHeader";
import ResidentialIntelligenceSnapshot from "@/components/residential-intelligence/ResidentialIntelligenceSnapshot";
import ResidentialDNASection from "@/components/residential-intelligence/ResidentialDNASection";
import StructuralProfileSection from "@/components/residential-intelligence/StructuralProfileSection";
import IntelligenceLeadCTA from "@/components/residential-intelligence/IntelligenceLeadCTA";

interface PageProps {
  params: { city: string; projectSlug: string };
}

export default async function Page({ params }: PageProps) {
  const { city, projectSlug } = params;
  const data = await reraIntelligenceService.getResidentialIntelligence(city, projectSlug);

  if (!data) {
    notFound();
  }

  const intelligenceStub = {
    structural_intelligence: { profile: data.structural_profile },
    intelligence_snapshot: {
      project: { name: (data.rera_project as any)?.project_name ?? null },
    },
  } as any;

  const dna = computeProjectDNA(intelligenceStub);
  const densityIndex = computeWestsideDensityIndex(dna);

  const structural = data.structural_profile as any;
  const landSqft =
    structural?.total_land_area_sqft ??
    (structural?.total_land_area_sqm ? structural.total_land_area_sqm * 10.7639 : null);
  const builtupSqft =
    structural?.total_built_up_area_sqft ??
    (structural?.total_builtup_area_sqm ? structural.total_builtup_area_sqm * 10.7639 : null);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
        <IntelligenceHeader
          projectName={(data.rera_project as any)?.project_name ?? "Residential Intelligence"}
          city={(data.rera_project as any)?.city_slug ?? city}
          reraId={(data.rera_project as any)?.registration_number ?? "—"}
          status={(data.rera_project as any)?.current_status ?? "Status pending"}
        />

        <ResidentialIntelligenceSnapshot
          units={structural?.total_units ?? null}
          towers={structural?.apartment_tower_count ?? null}
          floors={structural?.max_floors ?? null}
          landAreaSqft={landSqft ?? null}
          typology={structural?.physical_typology ?? null}
          densityClass={dna.density.density_class ?? null}
        />

        <ResidentialDNASection dna={dna} densityIndex={densityIndex} />

        <StructuralProfileSection
          towers={structural?.apartment_tower_count ?? null}
          minFloors={structural?.min_floors ?? null}
          maxFloors={structural?.max_floors ?? null}
          commercialBlocks={structural?.commercial_block_count ?? null}
          unknownBlocks={structural?.unknown_block_count ?? null}
          landSqft={landSqft ?? null}
          builtupSqft={builtupSqft ?? null}
        />

        <IntelligenceLeadCTA />
      </div>
    </main>
  );
}
