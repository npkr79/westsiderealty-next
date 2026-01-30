import { INTELLIGENCE_LABELS } from "@/constants/intelligenceLanguage";

interface StructuralProfileSectionProps {
  structuralProfile: Record<string, unknown> | null;
  landSummary: Record<string, unknown> | null;
}

const sqmToAcres = (sqm: number) => sqm / 4046.85642;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatValue = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "")
    return INTELLIGENCE_LABELS.disclosureMissing;
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return value;
};

const formatAcres = (value: number | null) =>
  value === null || Number.isNaN(value)
    ? INTELLIGENCE_LABELS.disclosureMissing
    : value.toLocaleString("en-IN");

export default function StructuralProfileSection({
  structuralProfile,
  landSummary,
}: StructuralProfileSectionProps) {
  const towers = (structuralProfile as any)?.apartment_tower_count ?? null;
  const minFloors = (structuralProfile as any)?.min_floors ?? null;
  const maxFloors = (structuralProfile as any)?.max_floors ?? null;
  const totalUnits = (structuralProfile as any)?.total_units ?? null;
  const landAreaSqm = toNumber(
    (landSummary as any)?.total_land_area ?? (landSummary as any)?.land_area ?? null
  );
  const netLandSqm = toNumber(
    (landSummary as any)?.net_land_area ?? (landSummary as any)?.net_land_area_sqm ?? null
  );

  const landAreaAcres =
    landAreaSqm !== null ? Number(sqmToAcres(landAreaSqm).toFixed(2)) : null;
  const netLandAcres =
    netLandSqm !== null ? Number(sqmToAcres(netLandSqm).toFixed(2)) : null;

  const floorRange =
    minFloors !== null && maxFloors !== null
      ? minFloors === maxFloors
        ? `${formatValue(maxFloors)} floors`
        : `${formatValue(minFloors)}-${formatValue(maxFloors)} floors`
      : "Not disclosed";

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Structural Profile
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Structural footprint
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Derived from Telangana RERA structural disclosures.
        </p>
      </div>
      <div className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-7 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <div className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Towers</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {towers === null ? "Not disclosed" : `${formatValue(towers)} towers`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Floor range</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{floorRange}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total units</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatValue(totalUnits)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total land</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {landAreaAcres === null
                ? "Not disclosed"
                : `${formatAcres(landAreaAcres)} acres`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Net land</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {netLandAcres === null
                ? "Not disclosed"
                : `${formatAcres(netLandAcres)} acres`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
