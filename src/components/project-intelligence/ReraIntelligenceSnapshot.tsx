import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface ReraIntelligenceSnapshotProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function ReraIntelligenceSnapshot({
  intelligenceData,
}: ReraIntelligenceSnapshotProps) {
  console.log("[ReraIntelligenceSnapshot] intelligenceData:", intelligenceData);

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900">RERA Intelligence Snapshot</h3>
    </section>
  );
}
