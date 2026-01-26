import type { VerticalDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface VerticalDNACardProps {
  vertical: VerticalDNA;
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

export default function VerticalDNACard({ vertical }: VerticalDNACardProps) {
  return (
    <DNACard
      title="Vertical DNA"
      headline={prettyLabel(vertical.vertical_class)}
      subline={
        vertical.avg_floors_per_tower !== null
          ? `${formatNumber(vertical.avg_floors_per_tower)} floor towers`
          : "Not disclosed"
      }
      insight={vertical.explanation}
      accent="violet"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Floors per tower</span>
          <span className="font-medium">{formatNumber(vertical.avg_floors_per_tower, 1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Vertical intensity</span>
          <span className="font-medium">{formatNumber(vertical.vertical_intensity, 1)}</span>
        </div>
      </div>
    </DNACard>
  );
}
