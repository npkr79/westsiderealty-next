import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { SECTION_NAMING } from "@/constants/intelligenceLanguage";
import { SectionHeader, renderScaleClass, renderValue } from "./visuals";

interface VillaEcosystemProps {
  profile: VillaIntelligenceProfile;
}

export default function VillaEcosystem({ profile }: VillaEcosystemProps) {
  const eco = profile.ecosystem;
  return (
    <section className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] space-y-6">
      <SectionHeader
        eyebrow={SECTION_NAMING.ecosystemStructure.eyebrow}
        title={SECTION_NAMING.ecosystemStructure.title}
        subtitle={SECTION_NAMING.ecosystemStructure.subtitle}
      />
      <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">Scale class:</span>{" "}
          {renderScaleClass(eco.scale_class)}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Ecosystem type:</span>{" "}
          {renderValue(eco.ecosystem_type)}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Absorption nature:</span>{" "}
          {renderValue(eco.absorption_nature)}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Amenity dependency:</span>{" "}
          {renderValue(eco.amenity_dependency)}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Community depth:</span>{" "}
          {renderValue(eco.community_depth)}
        </p>
      </div>
    </section>
  );
}
