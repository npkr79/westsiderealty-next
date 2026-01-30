import type { ProjectDNA } from "@/intelligence/projectDNA";
import DensityDNACard from "@/components/project-dna/DensityDNACard";
import VerticalDNACard from "@/components/project-dna/VerticalDNACard";
import LandDNACard from "@/components/project-dna/LandDNACard";
import ScaleDNACard from "@/components/project-dna/ScaleDNACard";
import { SECTION_NAMING } from "@/constants/intelligenceLanguage";

interface ProjectDNACardsProps {
  projectDna: ProjectDNA;
}

export default function ProjectDNACards({ projectDna }: ProjectDNACardsProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          {SECTION_NAMING.intelligenceProfiles.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          {SECTION_NAMING.intelligenceProfiles.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          WDI-driven system classification across density, vertical configuration, land posture,
          and scale class.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DensityDNACard density={projectDna.density} />
        <VerticalDNACard vertical={projectDna.vertical} />
        <LandDNACard land={projectDna.land} />
        <ScaleDNACard scale={projectDna.scale} />
      </div>
    </section>
  );
}
