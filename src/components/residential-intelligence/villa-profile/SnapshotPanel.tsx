import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import {
  INTELLIGENCE_LABELS,
  SECTION_NAMING,
  normalizeCompactness,
} from "@/constants/intelligenceLanguage";
import { Metric, SectionHeader, ProgressBar, SpectrumBar } from "./visuals";

interface SnapshotPanelProps {
  profile: VillaIntelligenceProfile;
}

const format = (value: number | null, suffix: string) => {
  if (value === null || Number.isNaN(value)) return INTELLIGENCE_LABELS.disclosureMissing;
  return `${Number(value.toFixed(2)).toLocaleString("en-IN")} ${suffix}`;
};

const formatSqyd = (sqyd: number | null) => {
  if (sqyd === null || Number.isNaN(sqyd)) return INTELLIGENCE_LABELS.disclosureMissing;
  return `${Math.round(sqyd).toLocaleString("en-IN")} sq. yards`;
};

export default function SnapshotPanel({ profile }: SnapshotPanelProps) {
  const metrics = profile.core_metrics;
  const intensity = profile.horizontal_intensity_index;
  return (
    <section className="relative space-y-6">
      <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet-300/40 to-amber-200/30 blur-3xl" />
      <SectionHeader
        eyebrow={SECTION_NAMING.intelligenceSnapshot.eyebrow}
        title={SECTION_NAMING.intelligenceSnapshot.title}
        subtitle={SECTION_NAMING.intelligenceSnapshot.subtitle}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Land scale
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric
              label="Total land"
              value={format(metrics.total_land_acres, "acres")}
              tone="land"
            />
            <Metric
              label="Land per villa"
              value={formatSqyd(metrics.gross_land_per_villa_sqyd)}
              tone="land"
            />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Density posture
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric
              label="Total villas"
              value={
                metrics.total_villas !== null
                  ? metrics.total_villas.toLocaleString("en-IN")
                  : INTELLIGENCE_LABELS.disclosureMissing
              }
              tone="scale"
            />
            <Metric
              label="Villas per acre"
              value={format(metrics.villas_per_acre, "villas/acre")}
              tone="density"
            />
          </div>
          <div className="space-y-3">
            <ProgressBar value={intensity} label={INTELLIGENCE_LABELS.hii} tone="density" />
            <p className="text-xs text-slate-500">
              {INTELLIGENCE_LABELS.disclosure}
            </p>
            <SpectrumBar
              bands={["Estate-spread", "Low compact", "Balanced", "Compact", "Hyper-compact"]}
              active={normalizeCompactness(profile.compactness_band)}
            />
            <p className="text-xs text-slate-500">
              Represents the compactness band for the horizontal system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
