import type { VillaIntelligenceResult } from "@/intelligence/villaIntelligence";

interface VillaSnapshotCardsProps {
  intelligence: VillaIntelligenceResult;
}

const formatNumber = (value: number | null, suffix?: string) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  const formatted = Number(value.toFixed(2)).toLocaleString("en-IN");
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatWhole = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Math.round(value).toLocaleString("en-IN");
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

const titleCase = (value: string | null) => {
  if (!value) return "Not disclosed";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function VillaSnapshotCards({ intelligence }: VillaSnapshotCardsProps) {
  const landPerVilla = formatLandPerVilla(intelligence.landPerVillaSqft);
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Villa Intelligence Snapshot
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Horizontal residential system
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Core land-and-villa distribution derived from Telangana RERA disclosures.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-l-4 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total villas</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatWhole(intelligence.totalVillas)}
          </p>
        </div>
        <div className="rounded-2xl border border-l-4 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Total land</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatNumber(intelligence.landAcres, "acres")}
          </p>
        </div>
        <div className="rounded-2xl border border-l-4 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Villas per acre</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatNumber(intelligence.villasPerAcre, "villas/acre")}
          </p>
        </div>
        <div className="rounded-2xl border border-l-4 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Land per villa</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {landPerVilla.primary}
          </p>
          {landPerVilla.secondary ? (
            <p className="text-xs text-slate-500">{landPerVilla.secondary}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-l-4 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Scale class</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {titleCase(intelligence.scaleClass)}
          </p>
        </div>
      </div>
    </section>
  );
}
