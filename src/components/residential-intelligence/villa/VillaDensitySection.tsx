import type { VillaIntelligenceResult } from "@/intelligence/villaIntelligence";

interface VillaDensitySectionProps {
  intelligence: VillaIntelligenceResult;
}

const densityCopy: Record<
  string,
  { label: string; description: string }
> = {
  low: {
    label: "Low Density",
    description: "Spacious villa distribution.",
  },
  medium: {
    label: "Medium Density",
    description: "Balanced land-to-villa distribution.",
  },
  high: {
    label: "High Density",
    description: "Compact villa planning.",
  },
  extreme: {
    label: "Extreme Density",
    description: "Very dense villa clustering.",
  },
  estate: {
    label: "Estate Density",
    description: "Ultra-low villa distribution.",
  },
};

export default function VillaDensitySection({ intelligence }: VillaDensitySectionProps) {
  const densityKey = intelligence.densityClass ?? null;
  const densityLabel = densityKey ? densityCopy[densityKey]?.label ?? "Density" : "Density";
  const densityDesc = densityKey
    ? densityCopy[densityKey]?.description ?? "Villa density classification."
    : "Villa density classification.";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Villa Density
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        {densityKey ? densityLabel : "Data processing in progress"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {densityKey ? densityDesc : "Density reflects how tightly villas are distributed across the land."}
      </p>
      <div className="mt-4 text-3xl font-semibold text-slate-900">
        {intelligence.villasPerAcre !== null
          ? `${intelligence.villasPerAcre.toFixed(2)} villas/acre`
          : "Not disclosed"}
      </div>
    </section>
  );
}
