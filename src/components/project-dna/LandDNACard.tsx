import type { LandDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface LandDNACardProps {
  land: LandDNA;
}

const resolvePlaceholder = (status?: LandDNA["status"]): string =>
  status === "processing" ? "Data processing in progress" : "Not disclosed";

const formatNumber = (
  value: number | null,
  decimals: number = 0,
  status?: LandDNA["status"]
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

export default function LandDNACard({ land }: LandDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(land.status);

  return (
    <DNACard
      title="Land Support"
      headline={prettyLabel(land.land_class) === "Not disclosed" ? statusPlaceholder : prettyLabel(land.land_class)}
      subline={
        "How much land backs each home and how stressed it is."
      }
      insight={land.explanation}
      accent="green"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Land per unit</span>
          <span className="font-medium">{formatNumber(land.land_per_unit_sqft, 0, land.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Built-up to land ratio</span>
          <span className="font-medium">{formatNumber(land.builtup_to_land_ratio, 2, land.status)}</span>
        </div>
      </div>
    </DNACard>
  );
}
