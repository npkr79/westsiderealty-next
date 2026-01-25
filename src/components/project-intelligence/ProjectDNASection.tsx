import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface ProjectDNASectionProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function ProjectDNASection({ intelligenceData }: ProjectDNASectionProps) {
  console.log("[ProjectDNASection] intelligenceData:", intelligenceData);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900">Project DNA</h3>
    </section>
  );
}
