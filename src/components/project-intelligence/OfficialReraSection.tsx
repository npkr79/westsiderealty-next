import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface OfficialReraSectionProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function OfficialReraSection({ intelligenceData }: OfficialReraSectionProps) {
  console.log("[OfficialReraSection] intelligenceData:", intelligenceData);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900">Official RERA Data</h3>
    </section>
  );
}
