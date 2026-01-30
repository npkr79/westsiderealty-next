import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import {
  INTELLIGENCE_LABELS,
  SECTION_NAMING,
  normalizeCompactness,
} from "@/constants/intelligenceLanguage";
import {
  ProgressBar,
  SectionHeader,
  SpectrumBar,
  renderCompactnessBand,
  renderDensityClass,
  renderLandStrengthClass,
} from "./visuals";

interface HorizontalSystemProfileProps {
  profile: VillaIntelligenceProfile;
}

export default function HorizontalSystemProfile({ profile }: HorizontalSystemProfileProps) {
  const density = renderDensityClass(profile.density_class);
  const land = renderLandStrengthClass(profile.land_strength_class);
  const compact = renderCompactnessBand(profile.compactness_band);
  const compactBand = normalizeCompactness(profile.compactness_band);
  const densityDescriptor =
    density === INTELLIGENCE_LABELS.disclosureMissing ? "undisclosed" : density.toLowerCase();
  const landDescriptor =
    land === INTELLIGENCE_LABELS.disclosureMissing ? "undisclosed" : land.toLowerCase();
  const compactDescriptor =
    compact === INTELLIGENCE_LABELS.disclosureMissing ? "undisclosed" : compact.toLowerCase();
  const systemType = `Represents a ${densityDescriptor}-density horizontal ecosystem.`;
  const landPosture = `Indicates ${landDescriptor} land strength.`;
  const compactness = `Indicates ${compactDescriptor} compactness band.`;
  const planningPosture =
    compactDescriptor.includes("estate") || compactDescriptor.includes("low")
      ? "Indicates rising land spread and lower compactness."
      : compactDescriptor.includes("balanced")
      ? "Indicates balanced compactness."
      : "Indicates rising land compactness.";
  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] space-y-6">
      <SectionHeader
        eyebrow={SECTION_NAMING.villaSystemProfile.eyebrow}
        title={SECTION_NAMING.villaSystemProfile.title}
        subtitle={SECTION_NAMING.villaSystemProfile.subtitle}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 text-base text-slate-700">
          <p className="font-semibold text-slate-900">{systemType}</p>
          <p className="font-semibold text-slate-900">{landPosture}</p>
          <p className="font-semibold text-slate-900">{compactness}</p>
          <p className="font-semibold text-slate-900">{planningPosture}</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-[20px] border border-white/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Compactness band
            </p>
            <p className="mt-2 text-lg font-semibold">
              {renderCompactnessBand(profile.compactness_band)}
            </p>
          </div>
          <SpectrumBar
            bands={["Estate-spread", "Low compact", "Balanced", "Compact", "Hyper-compact"]}
            active={compactBand}
          />
          <ProgressBar value={profile.horizontal_intensity_index} label={INTELLIGENCE_LABELS.hii} />
        </div>
      </div>
    </section>
  );
}
