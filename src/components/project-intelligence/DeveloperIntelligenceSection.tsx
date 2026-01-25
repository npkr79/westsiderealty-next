import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface DeveloperIntelligenceSectionProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function DeveloperIntelligenceSection({
  intelligenceData,
}: DeveloperIntelligenceSectionProps) {
  console.log("[DeveloperIntelligenceSection] intelligenceData:", intelligenceData);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900">Developer Intelligence</h3>
    </section>
  );
}
