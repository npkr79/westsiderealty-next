import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { INTELLIGENCE_LABELS, SECTION_NAMING } from "@/constants/intelligenceLanguage";
import {
  SectionHeader,
  renderCompactnessBand,
  renderDensityClass,
  renderLandStrengthClass,
  renderScaleClass,
} from "./visuals";

interface ProjectDNAProps {
  profile: VillaIntelligenceProfile;
}

export default function ProjectDNA({ profile }: ProjectDNAProps) {
  const density = renderDensityClass(profile.density_class);
  const scale = renderScaleClass(profile.scale_class);
  const land = renderLandStrengthClass(profile.land_strength_class);
  const compact = renderCompactnessBand(profile.compactness_band);
  const totalVillas = profile.core_metrics.total_villas ?? null;

  const densityDescriptor =
    density === INTELLIGENCE_LABELS.disclosureMissing
      ? "undisclosed"
      : density.toLowerCase();
  const scaleDescriptor =
    scale === INTELLIGENCE_LABELS.disclosureMissing
      ? "undisclosed scale"
      : scale.toLowerCase();
  const developmentSystem = `WVIE-driven system classification. Represents a ${scaleDescriptor} with ${densityDescriptor} density posture.`;
  const communityStructure =
    totalVillas === null
      ? "Derived from Telangana RERA structural disclosures."
      : totalVillas >= 700
      ? "Reflects mega-ecosystem scale with high system coordination."
      : totalVillas >= 300
      ? "Reflects township-scale development structure."
      : totalVillas >= 120
      ? "Reflects gated community scale."
      : "Reflects boutique enclave scale.";

  const landDescriptor =
    land === INTELLIGENCE_LABELS.disclosureMissing ? "undisclosed" : land.toLowerCase();
  const compactDescriptor =
    compact === INTELLIGENCE_LABELS.disclosureMissing ? "undisclosed" : compact.toLowerCase();
  const landArchitecture = `Indicates ${landDescriptor} land strength with ${compactDescriptor} compactness.`;

  const planningPosture =
    compactDescriptor.includes("estate") || compactDescriptor.includes("low")
      ? "Indicates low compactness and wider land spread."
      : compactDescriptor.includes("balanced")
      ? "Indicates balanced compactness."
      : "Indicates rising land compactness.";

  const assetPosture =
    landDescriptor.includes("ultra") || landDescriptor.includes("abundant")
      ? "Indicates land-abundant asset posture."
      : landDescriptor.includes("balanced")
      ? "Indicates balanced land strength."
      : "Indicates land-stressed asset posture.";

  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
      <SectionHeader
        eyebrow={SECTION_NAMING.editorialBrief.eyebrow}
        title={SECTION_NAMING.editorialBrief.title}
        subtitle={SECTION_NAMING.editorialBrief.subtitle}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <article className="rounded-[22px] border border-white/70 bg-white/80 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            System classification
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {developmentSystem}
          </p>
          <p className="mt-3 text-sm text-slate-600">{communityStructure}</p>
        </article>
        <article className="rounded-[22px] border border-white/70 bg-white/80 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Planning posture
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {planningPosture}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {`WVIE-driven system classification. Compactness band: ${compact}.`}
          </p>
        </article>
        <article className="rounded-[22px] border border-white/70 bg-white/80 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Land posture
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {landArchitecture}
          </p>
          <p className="mt-3 text-sm text-slate-600">{assetPosture}</p>
        </article>
      </div>
    </section>
  );
}
