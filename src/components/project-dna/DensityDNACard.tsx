import type { DensityDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface DensityDNACardProps {
  density: DensityDNA;
}

const resolvePlaceholder = (status?: DensityDNA["status"]): string =>
  status === "processing" ? "Data processing in progress" : "Not disclosed";

const formatNumber = (
  value: number | null,
  decimals: number = 0,
  status?: DensityDNA["status"]
): string => {
  if (value === null) return resolvePlaceholder(status);
  const rounded = Number(value.toFixed(decimals));
  return Number.isFinite(rounded) ? rounded.toLocaleString("en-IN") : resolvePlaceholder(status);
};

const prettyLabel = (value: string | null): string =>
  value
    ? value
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Not disclosed";

export default function DensityDNACard({ density }: DensityDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(density.status);

  return (
    <DNACard
      title="Crowding & Load"
      headline={prettyLabel(density.density_class) === "Not disclosed" ? statusPlaceholder : prettyLabel(density.density_class)}
      subline={
        "How densely homes are packed into land, towers and floors."
      }
      insight={density.explanation}
      accent="amber"
      tone="amber"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Units per acre</span>
            <p className="text-[11px] text-slate-500">Land-level crowding</p>
          </div>
          <span className="font-medium text-slate-900">{formatNumber(density.units_per_acre, 2, density.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Units per tower</span>
            <p className="text-[11px] text-slate-500">Shared tower load</p>
          </div>
          <span className="font-medium text-slate-900">{formatNumber(density.units_per_tower, 2, density.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Avg units per floor</span>
            <p className="text-[11px] text-slate-500">Daily floor density</p>
          </div>
          <span className="font-medium text-slate-900">{formatNumber(density.avg_units_per_floor, 2, density.status)}</span>
        </div>
      </div>
    </DNACard>
  );
}
