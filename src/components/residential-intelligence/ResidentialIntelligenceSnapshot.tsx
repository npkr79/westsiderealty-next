import { computeProjectDNA } from "@/intelligence/projectDNA";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface ResidentialIntelligenceSnapshotProps {
  structuralProfile: any;
  intelligence: ProjectIntelligenceResult | null;
}

const formatNumber = (value: number | null, decimals: number = 0) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
};

const resolveLandArea = (structuralProfile: any) => {
  const landSqft =
    structuralProfile?.total_land_area_sqft ??
    structuralProfile?.land_area_sqft ??
    null;
  const landSqm =
    structuralProfile?.total_land_area_sqm ??
    structuralProfile?.land_area_sqm ??
    structuralProfile?.total_land_area ??
    structuralProfile?.land_area ??
    null;

  if (landSqft) {
    return `${formatNumber(landSqft)} sq.ft`;
  }
  if (landSqm) {
    return `${formatNumber(landSqm)} sq.m`;
  }
  return "Not disclosed";
};

export default function ResidentialIntelligenceSnapshot({
  structuralProfile,
  intelligence,
}: ResidentialIntelligenceSnapshotProps) {
  const totalUnits = structuralProfile?.total_units ?? null;
  const totalTowers =
    structuralProfile?.apartment_tower_count ??
    structuralProfile?.residential_structures ??
    null;
  const totalFloors = structuralProfile?.max_floors ?? null;
  const typology =
    intelligence?.intelligence_snapshot?.core?.physical_typology ??
    structuralProfile?.physical_typology ??
    "Not disclosed";
  const landArea = resolveLandArea(structuralProfile);
  const dna = intelligence ? computeProjectDNA(intelligence) : null;
  const densityClass = dna?.density?.density_class ?? "Not disclosed";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Residential Snapshot</h2>
        <p className="text-sm text-slate-500">
          Core structural indicators drawn from Telangana RERA filings.
        </p>
      </div>
      <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Total Units</p>
          <p className="text-lg font-semibold text-slate-900">
            {totalUnits !== null ? formatNumber(totalUnits) : "Not disclosed"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Towers</p>
          <p className="text-lg font-semibold text-slate-900">
            {totalTowers !== null ? formatNumber(totalTowers) : "Not disclosed"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Floors</p>
          <p className="text-lg font-semibold text-slate-900">
            {totalFloors !== null ? formatNumber(totalFloors) : "Not disclosed"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Land Area</p>
          <p className="text-lg font-semibold text-slate-900">{landArea}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Residential Typology</p>
          <p className="text-lg font-semibold text-slate-900">{typology}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Density Class</p>
          <p className="text-lg font-semibold text-slate-900">{densityClass}</p>
        </div>
      </div>
    </section>
  );
}
interface ResidentialIntelligenceSnapshotProps {
  units: number | null;
  towers: number | null;
  floors: number | null;
  landAreaSqft: number | null;
  typology: string | null;
  densityClass: string | null;
}

const formatNumber = (value: number | null, decimals = 0): string =>
  value === null
    ? "Data processing in progress"
    : Number(value.toFixed(decimals)).toLocaleString("en-IN");

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
