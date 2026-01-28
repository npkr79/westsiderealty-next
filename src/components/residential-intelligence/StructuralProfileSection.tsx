interface StructuralProfileSectionProps {
  towers: number | null;
  minFloors: number | null;
  maxFloors: number | null;
  commercialBlocks: number | null;
  unknownBlocks: number | null;
  landSqft: number | null;
  builtupSqft: number | null;
}

const formatNumber = (value: number | null): string =>
  value === null ? "Data processing in progress" : value.toLocaleString("en-IN");

export default function StructuralProfileSection({
  towers,
  minFloors,
  maxFloors,
  commercialBlocks,
  unknownBlocks,
  landSqft,
  builtupSqft,
}: StructuralProfileSectionProps) {
  const floorRange =
    minFloors !== null && maxFloors !== null
      ? `${minFloors}–${maxFloors}`
      : "Data processing in progress";
  const ratio =
    builtupSqft !== null && landSqft !== null && landSqft > 0
      ? (builtupSqft / landSqft).toFixed(2)
      : "Data processing in progress";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Structural Profile</h2>
      <p className="mt-1 text-sm text-slate-600">
        Structural mix and ratios derived from normalized building data.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tower Count</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(towers)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Floor Range</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{floorRange}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Commercial Blocks</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(commercialBlocks)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unknown Blocks</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatNumber(unknownBlocks)}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Land vs Built-up Ratio</span>
          <span className="font-medium">{ratio}</span>
        </div>
      </div>
    </section>
  );
}
