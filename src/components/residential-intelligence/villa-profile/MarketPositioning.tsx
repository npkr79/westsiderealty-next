import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { INTELLIGENCE_LABELS, SECTION_NAMING } from "@/constants/intelligenceLanguage";
import { PercentileBar, SectionHeader } from "./visuals";

interface MarketPositioningProps {
  profile: VillaIntelligenceProfile;
}

const percentileStatement = (value: number | null, metric: string, scope: string) => {
  if (value === null) return INTELLIGENCE_LABELS.disclosureMissing;
  const pct = Math.round(value * 100);
  return `${metric} position: ${pct}th percentile within the ${scope} villa ecosystem.`;
};

export default function MarketPositioning({ profile }: MarketPositioningProps) {
  const market = profile.market_positioning;
  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] space-y-6">
      <SectionHeader
        eyebrow={SECTION_NAMING.positioningProfile.eyebrow}
        title={SECTION_NAMING.positioningProfile.title}
        subtitle={SECTION_NAMING.positioningProfile.subtitle}
      />
      <div className="space-y-5">
        <PercentileBar
          label="Density percentile (city)"
          value={market.density_percentile_city}
          statement={percentileStatement(market.density_percentile_city, "Density", "city")}
          tone="density"
        />
        <PercentileBar
          label="Land strength percentile (city)"
          value={market.land_percentile_city}
          statement={percentileStatement(market.land_percentile_city, "Land strength", "city")}
          tone="land"
        />
        <PercentileBar
          label="Scale percentile (city)"
          value={market.scale_percentile_city}
          statement={percentileStatement(market.scale_percentile_city, "Scale", "city")}
          tone="scale"
        />
      </div>
    </section>
  );
}
