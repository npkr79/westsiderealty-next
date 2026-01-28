import type { ProjectDNA } from "@/intelligence/projectDNA";
import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";
import DensityDNACard from "@/components/project-dna/DensityDNACard";
import VerticalDNACard from "@/components/project-dna/VerticalDNACard";
import LandDNACard from "@/components/project-dna/LandDNACard";
import ScaleDNACard from "@/components/project-dna/ScaleDNACard";
import WestsideDensityIndexCard from "@/components/project-dna/WestsideDensityIndexCard";

interface ResidentialDNASectionProps {
  dna: ProjectDNA;
  densityIndex: WestsideDensityIndex;
}

export default function ResidentialDNASection({
  dna,
  densityIndex,
}: ResidentialDNASectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Residential DNA</h2>
        <p className="mt-1 text-sm text-slate-600">
          Structural intelligence describing crowding, height, land support, and scale.
        </p>
      </div>
      <div className="mt-5">
        <WestsideDensityIndexCard index={densityIndex} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <DensityDNACard density={dna.density} />
        <VerticalDNACard vertical={dna.vertical} />
        <LandDNACard land={dna.land} />
        <ScaleDNACard scale={dna.scale} />
      </div>
    </section>
  );
}
