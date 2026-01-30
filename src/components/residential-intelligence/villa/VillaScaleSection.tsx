import type { VillaIntelligenceResult } from "@/intelligence/villaIntelligence";

interface VillaScaleSectionProps {
  intelligence: VillaIntelligenceResult;
}

const scaleCopy: Record<string, { label: string; description: string }> = {
  "boutique enclave": {
    label: "Boutique Enclave",
    description: "Small, private villa community.",
  },
  "gated villa community": {
    label: "Gated Villa Community",
    description: "Residential villa neighborhood with controlled access.",
  },
  "villa township": {
    label: "Villa Township",
    description: "Large villa development with township-level scale.",
  },
  "mega villa ecosystem": {
    label: "Mega Villa Ecosystem",
    description: "Mega-scale villa residential system.",
  },
};

export default function VillaScaleSection({ intelligence }: VillaScaleSectionProps) {
  const scaleKey = intelligence.scaleClass;
  const scaleLabel = scaleCopy[scaleKey]?.label ?? "Villa Scale";
  const scaleDesc = scaleCopy[scaleKey]?.description ?? "Villa ecosystem scale.";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Villa Scale
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        {scaleLabel}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {scaleDesc}
      </p>
      <div className="mt-4 text-3xl font-semibold text-slate-900">
        {intelligence.totalVillas.toLocaleString("en-IN")} villas
      </div>
    </section>
  );
}
