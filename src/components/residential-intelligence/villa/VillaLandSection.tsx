import type { VillaIntelligenceResult } from "@/intelligence/villaIntelligence";

interface VillaLandSectionProps {
  intelligence: VillaIntelligenceResult;
}

const landStressCopy: Record<string, { label: string; description: string }> = {
  abundant: {
    label: "Abundant Land Profile",
    description: "Strong land backing per villa.",
  },
  balanced: {
    label: "Balanced Land Profile",
    description: "Healthy land-to-villa balance.",
  },
  stressed: {
    label: "Stressed Land Profile",
    description: "Compact land support per villa.",
  },
  "severely stressed": {
    label: "Severely Stressed Profile",
    description: "Very tight land backing per villa.",
  },
};

const formatLandPerVilla = (sqft: number | null) => {
  if (sqft === null || Number.isNaN(sqft)) {
    return { primary: "Not disclosed", secondary: null };
  }
  const sqyd = sqft / 9;
  return {
    primary: `${Math.round(sqyd).toLocaleString("en-IN")} sq. yards`,
    secondary: `≈ ${Math.round(sqft).toLocaleString("en-IN")} sq.ft`,
  };
};

export default function VillaLandSection({ intelligence }: VillaLandSectionProps) {
  const landStressKey = intelligence.landStressClass ?? null;
  const landStressLabel = landStressKey
    ? landStressCopy[landStressKey]?.label ?? "Land Profile"
    : "Land Profile";
  const landStressDesc = landStressKey
    ? landStressCopy[landStressKey]?.description ?? "Land stress classification."
    : "Land stress classification.";
  const landPerVilla = formatLandPerVilla(intelligence.landPerVillaSqft);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Land Intelligence
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        {landStressKey ? landStressLabel : "Data processing in progress"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {landStressKey ? landStressDesc : "Land stress classification for villa projects."}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Land per villa</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {landPerVilla.primary}
          </p>
          {landPerVilla.secondary ? (
            <p className="text-xs text-slate-500">{landPerVilla.secondary}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-slate-500">Land profile</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {landStressKey ? landStressLabel : "Data processing in progress"}
          </p>
        </div>
      </div>
    </section>
  );
}
