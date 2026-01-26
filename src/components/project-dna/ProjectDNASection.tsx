import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import { computeProjectDNA } from "@/intelligence/projectDNA";
import DensityDNACard from "./DensityDNACard";
import VerticalDNACard from "./VerticalDNACard";
import LandDNACard from "./LandDNACard";
import ScaleDNACard from "./ScaleDNACard";

interface ProjectDNASectionProps {
  intelligenceData: ProjectIntelligenceResult;
}

export default function ProjectDNASection({ intelligenceData }: ProjectDNASectionProps) {
  const dna = computeProjectDNA(intelligenceData);

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
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <DensityDNACard density={dna.density} />
        <VerticalDNACard vertical={dna.vertical} />
        <LandDNACard land={dna.land} />
        <ScaleDNACard scale={dna.scale} />
      </div>
    </section>
  );
}
