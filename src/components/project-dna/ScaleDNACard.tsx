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
      tone="blue"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total units</span>
            <p className="text-[11px] text-slate-500">Residential population</p>
          </div>
          <span className="font-medium">{formatNumber(scale.total_units, 0, scale.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total towers</span>
            <p className="text-[11px] text-slate-500">Residential structures</p>
          </div>
          <span className="font-medium">{formatNumber(scale.total_towers, 0, scale.status)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total floors</span>
            <p className="text-[11px] text-slate-500">Vertical magnitude</p>
          </div>
          <span className="font-medium">{formatNumber(scale.total_floors, 0, scale.status)}</span>
        </div>
      </div>
    </DNACard>
  );
}
