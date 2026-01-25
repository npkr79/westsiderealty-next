import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface MicroMarketIntelligenceSectionProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function MicroMarketIntelligenceSection({
  intelligenceData,
}: MicroMarketIntelligenceSectionProps) {
  console.log("[MicroMarketIntelligenceSection] intelligenceData:", intelligenceData);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900">Micro-Market Intelligence</h3>
    </section>
  );
}
