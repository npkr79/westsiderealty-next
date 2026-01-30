import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { SECTION_NAMING } from "@/constants/intelligenceLanguage";
import { RiskChip, SectionHeader } from "./visuals";

interface RiskSignalsProps {
  profile: VillaIntelligenceProfile;
}

export default function RiskSignals({ profile }: RiskSignalsProps) {
  const risk = profile.risk_signals;
  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] space-y-6">
      <SectionHeader
        eyebrow={SECTION_NAMING.riskSignals.eyebrow}
        title={SECTION_NAMING.riskSignals.title}
        subtitle={SECTION_NAMING.riskSignals.subtitle}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RiskChip label="Congestion signal" value={risk.long_term_congestion_risk ?? "Moderate"} />
        <RiskChip label="Land insulation signal" value={risk.land_insulation_strength ?? "Moderate"} />
        <RiskChip label="Liquidity signal" value={risk.exit_liquidity_profile ?? "Moderate"} />
        <RiskChip label="System complexity signal" value={risk.community_complexity ?? "Moderate"} />
      </div>
    </section>
  );
}
