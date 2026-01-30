import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { INTELLIGENCE_LABELS, SECTION_NAMING } from "@/constants/intelligenceLanguage";
import { SectionHeader, Metric } from "./visuals";

interface PlanningModelProps {
  profile: VillaIntelligenceProfile;
}

const formatSqyd = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return INTELLIGENCE_LABELS.disclosureMissing;
  return `${Math.round(value).toLocaleString("en-IN")} sq. yards`;
};

export default function PlanningModel({ profile }: PlanningModelProps) {
  const planning = profile.planning_model;
  const gross = planning.gross_land_per_villa_sqyd;
  const netMin = planning.estimated_net_plot_min;
  const netMax = planning.estimated_net_plot_max;
  const infraMin =
    gross !== null && netMax !== null ? Math.max(0, gross - netMax) : null;
  const infraMax =
    gross !== null && netMin !== null ? Math.max(0, gross - netMin) : null;
  const infraShare =
    infraMin !== null && infraMax !== null && gross
      ? `${Math.round((infraMin / gross) * 100)}% – ${Math.round(
          (infraMax / gross) * 100
        )}%`
      : INTELLIGENCE_LABELS.disclosureMissing;
  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] space-y-6">
      <SectionHeader
        eyebrow={SECTION_NAMING.planningModel.eyebrow}
        title={SECTION_NAMING.planningModel.title}
        subtitle={SECTION_NAMING.planningModel.subtitle}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Metric
          label="Gross land per villa"
          value={formatSqyd(gross)}
          tone="land"
        />
        <Metric
          label="Infrastructure share"
          value={infraShare}
          tone="land"
        />
        <div className="md:col-span-2 rounded-[24px] border border-white/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Usable land range</span>
            <span>{INTELLIGENCE_LABELS.wvieClassification}</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {formatSqyd(netMin)} – {formatSqyd(netMax)}
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Indicates the estimated private plot range after infrastructure allocation.
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-white/20">
            <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-2/3" />
          </div>
          {gross ? (
            <p className="mt-2 text-[11px] text-slate-400">
              Gross land reference: {formatSqyd(gross)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
