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
