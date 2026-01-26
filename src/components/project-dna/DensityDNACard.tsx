import type { DensityDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface DensityDNACardProps {
  density: DensityDNA;
}

const formatNumber = (value: number | null, decimals: number = 0): string => {
  if (value === null) return "Not disclosed";
  const rounded = Number(value.toFixed(decimals));
  return Number.isFinite(rounded) ? rounded.toLocaleString("en-IN") : "Not disclosed";
};

const prettyLabel = (value: string | null): string =>
  value
    ? value
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Not disclosed";

export default function DensityDNACard({ density }: DensityDNACardProps) {
  return (
    <DNACard
      title="Density DNA"
      headline={prettyLabel(density.density_class)}
      subline={
        density.units_per_acre !== null
          ? `~${formatNumber(density.units_per_acre)} homes per acre`
          : "Not disclosed"
      }
      insight={density.explanation}
      accent="amber"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Units per acre</span>
          <span className="font-medium">{formatNumber(density.units_per_acre, 2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Units per tower</span>
          <span className="font-medium">{formatNumber(density.units_per_tower, 2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Avg units per floor</span>
          <span className="font-medium">{formatNumber(density.avg_units_per_floor, 2)}</span>
        </div>
      </div>
    </DNACard>
  );
}
