interface StructuralProfileSectionProps {
  structuralProfile: any;
  buildings: any[];
}

const formatNumber = (value: number | null, decimals: number = 0) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
};

const getBuildingTypeCounts = (buildings: any[]) => {
  return buildings.reduce<Record<string, number>>((acc, building) => {
    const key = building?.derived_building_type ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
};

export default function StructuralProfileSection({
  structuralProfile,
  buildings,
}: StructuralProfileSectionProps) {
  const minFloors = structuralProfile?.min_floors ?? null;
  const maxFloors = structuralProfile?.max_floors ?? null;
  const floorRange =
    minFloors !== null && maxFloors !== null
      ? minFloors === maxFloors
        ? `${formatNumber(maxFloors)} floors`
        : `${formatNumber(minFloors)}-${formatNumber(maxFloors)} floors`
      : "Not disclosed";

  const totalTowers =
    structuralProfile?.apartment_tower_count ??
    structuralProfile?.residential_structures ??
    null;

  const typeCounts = getBuildingTypeCounts(buildings ?? []);
  const residentialCount =
    typeCounts.apartment_tower ?? structuralProfile?.apartment_tower_count ?? null;
  const commercialCount =
    typeCounts.commercial_block ?? structuralProfile?.commercial_block_count ?? null;
  const unknownCount = typeCounts.unknown ?? structuralProfile?.unknown_block_count ?? null;

  const splitLabel = [
    residentialCount !== null ? `${formatNumber(residentialCount)} residential` : null,
    commercialCount !== null ? `${formatNumber(commercialCount)} commercial` : null,
    unknownCount !== null ? `${formatNumber(unknownCount)} other` : null,
  ]
    .filter(Boolean)
    .join(" / ") || "Not disclosed";

  const builtupSqft =
    structuralProfile?.total_built_up_area_sqft ??
    structuralProfile?.total_builtup_area_sqft ??
    structuralProfile?.builtup_area_sqft ??
    structuralProfile?.builtup_area ??
    null;
  const landSqft =
    structuralProfile?.total_land_area_sqft ??
    structuralProfile?.land_area_sqft ??
    null;
  const builtupToLandRatio =
    builtupSqft !== null && landSqft && landSqft > 0 ? builtupSqft / landSqft : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Structural Profile</h2>
        <p className="text-sm text-slate-500">
          Tower configuration and structural distribution across the project.
        </p>
      </div>
      <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Tower Count</p>
          <p className="text-lg font-semibold text-slate-900">
            {totalTowers !== null ? formatNumber(totalTowers) : "Not disclosed"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Floor Range</p>
          <p className="text-lg font-semibold text-slate-900">{floorRange}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Residential vs Commercial</p>
          <p className="text-lg font-semibold text-slate-900">{splitLabel}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Built-up to Land Ratio</p>
          <p className="text-lg font-semibold text-slate-900">
            {builtupToLandRatio !== null
              ? `${formatNumber(builtupToLandRatio, 2)}x`
              : "Not disclosed"}
          </p>
        </div>
      </div>
    </section>
  );
}
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
