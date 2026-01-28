import type { ScaleDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface ScaleDNACardProps {
  scale: ScaleDNA;
}

const resolvePlaceholder = (status?: ScaleDNA["status"]): string =>
  status === "processing" ? "Data processing in progress" : "Not disclosed";

const formatNumber = (
  value: number | null,
  decimals: number = 0,
  status?: ScaleDNA["status"]
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

export default function ScaleDNACard({ scale }: ScaleDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(scale.status);

  return (
    <DNACard
      title="Community Scale"
      headline={prettyLabel(scale.scale_class) === "Not disclosed" ? statusPlaceholder : prettyLabel(scale.scale_class)}
      subline={
        "How large the residential ecosystem actually is."
      }
      insight={scale.explanation}
      accent="blue"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total units</span>
          <span className="font-medium">{formatNumber(scale.total_units, 0, scale.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total towers</span>
          <span className="font-medium">{formatNumber(scale.total_towers, 0, scale.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total floors</span>
          <span className="font-medium">{formatNumber(scale.total_floors, 0, scale.status)}</span>
        </div>
      </div>
    </DNACard>
  );
}
