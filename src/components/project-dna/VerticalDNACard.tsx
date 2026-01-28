import type { VerticalDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";

interface VerticalDNACardProps {
  vertical: VerticalDNA;
}

const resolvePlaceholder = (status?: VerticalDNA["status"]): string =>
  status === "processing" ? "Data processing in progress" : "Not disclosed";

const formatNumber = (
  value: number | null,
  decimals: number = 0,
  status?: VerticalDNA["status"]
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

export default function VerticalDNACard({ vertical }: VerticalDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(vertical.status);

  return (
    <DNACard
      title="High-Rise Intensity"
      headline={prettyLabel(vertical.vertical_class) === "Not disclosed" ? statusPlaceholder : prettyLabel(vertical.vertical_class)}
      subline={
        "How tall and vertically dependent daily life will be."
      }
      insight={vertical.explanation}
      accent="violet"
      tone="violet"
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Floors per tower</span>
            <p className="text-[11px] text-slate-500">Height per structure</p>
          </div>
          <span className="font-medium">
            {formatNumber(vertical.avg_floors_per_tower, 1, vertical.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Vertical intensity</span>
            <p className="text-[11px] text-slate-500">Total stacked mass</p>
          </div>
          <span className="font-medium">
            {formatNumber(vertical.vertical_intensity, 1, vertical.status)}
          </span>
        </div>
      </div>
    </DNACard>
  );
}
