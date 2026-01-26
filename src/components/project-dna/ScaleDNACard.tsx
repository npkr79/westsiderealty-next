import type { ScaleDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface ScaleDNACardProps {
  scale: ScaleDNA;
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

export default function ScaleDNACard({ scale }: ScaleDNACardProps) {
  return (
    <DNACard
      title="Scale DNA"
      headline={prettyLabel(scale.scale_class)}
      subline={
        scale.total_units !== null && scale.total_towers !== null
          ? `${formatNumber(scale.total_units)} homes · ${formatNumber(scale.total_towers)} towers`
          : "Not disclosed"
      }
      insight={scale.explanation}
      accent="blue"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total units</span>
          <span className="font-medium">{formatNumber(scale.total_units, 0)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total towers</span>
          <span className="font-medium">{formatNumber(scale.total_towers, 0)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total floors</span>
          <span className="font-medium">{formatNumber(scale.total_floors, 0)}</span>
        </div>
      </div>
    </DNACard>
  );
}
