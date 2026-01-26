import type { LandDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface LandDNACardProps {
  land: LandDNA;
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

export default function LandDNACard({ land }: LandDNACardProps) {
  return (
    <DNACard
      title="Land DNA"
      headline={prettyLabel(land.land_class)}
      subline={
        land.land_per_unit_sqft !== null
          ? `~${formatNumber(land.land_per_unit_sqft)} sq.ft land per home`
          : "Not disclosed"
      }
      insight={land.explanation}
      accent="green"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Land per unit</span>
          <span className="font-medium">{formatNumber(land.land_per_unit_sqft, 0)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Built-up to land ratio</span>
          <span className="font-medium">{formatNumber(land.builtup_to_land_ratio, 2)}</span>
        </div>
      </div>
    </DNACard>
  );
}
