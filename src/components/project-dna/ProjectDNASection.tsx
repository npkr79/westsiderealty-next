import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import { computeProjectDNA } from "@/intelligence/projectDNA";
import { computeWestsideDensityIndex } from "@/intelligence/westsideDensityIndex";
import DensityDNACard from "./DensityDNACard";
import VerticalDNACard from "./VerticalDNACard";
import LandDNACard from "./LandDNACard";
import ScaleDNACard from "./ScaleDNACard";
import WestsideDensityIndexCard from "./WestsideDensityIndexCard";

interface ProjectDNASectionProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function ProjectDNASection({ intelligenceData }: ProjectDNASectionProps) {
  if (!intelligenceData) {
    return null;
  }

  const dna = computeProjectDNA(intelligenceData);
  console.log("[UI] DNA received:", dna);
  const densityIndex = computeWestsideDensityIndex(dna);
  console.log("[UI] Density index received:", densityIndex);
  console.log("[UI] Validation snapshot:", {
    project: intelligenceData?.intelligence_snapshot?.project?.name,
    typology: intelligenceData?.intelligence_snapshot?.core?.physical_typology ?? null,
    total_units: dna.scale.total_units,
    towers: dna.scale.total_towers,
    wdi_score: densityIndex.score,
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Project DNA</h2>
        <p className="text-sm text-slate-600">
          Structural intelligence based on Telangana RERA data
        </p>
        <p className="text-xs text-slate-500">
          Helps evaluate crowding, asset backing, and long-term livability.
        </p>
      </div>
      <WestsideDensityIndexCard index={densityIndex} />
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <DensityDNACard density={dna.density} />
        <VerticalDNACard vertical={dna.vertical} />
        <LandDNACard land={dna.land} />
        <ScaleDNACard scale={dna.scale} />
      </div>
    </section>
  );
}
