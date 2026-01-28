interface ResidentialIntelligenceSnapshotProps {
  units: number | null;
  towers: number | null;
  floors: number | null;
  landAreaSqft: number | null;
  typology: string | null;
  densityClass: string | null;
}

const formatNumber = (value: number | null, decimals = 0): string =>
  value === null ? "Data processing in progress" : value.toFixed(decimals).toLocaleString("en-IN");

const titleCase = (value: string | null): string =>
  value
    ? value
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    : "Data processing in progress";

export default function ResidentialIntelligenceSnapshot({
  units,
  towers,
  floors,
  landAreaSqft,
  typology,
  densityClass,
}: ResidentialIntelligenceSnapshotProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Residential Intelligence Snapshot
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Core structural summary derived from residential RERA filings.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Units</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(units)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Towers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(towers)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Floors</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatNumber(floors)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Land Area</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {landAreaSqft !== null
              ? `${formatNumber(landAreaSqft, 0)} sq.ft`
              : "Data processing in progress"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Typology</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {titleCase(typology)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Density Class</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {densityClass ? titleCase(densityClass) : "Data processing in progress"}
          </p>
        </div>
      </div>
    </section>
  );
}
