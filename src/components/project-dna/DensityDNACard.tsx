import type { DensityDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";
import { getSeverityScoreForClassification } from "@/intelligence/visualSystem";
import {
  INTELLIGENCE_LABELS,
  normalizeDensityClass,
} from "@/constants/intelligenceLanguage";

interface DensityDNACardProps {
  density: DensityDNA;
}

const resolvePlaceholder = (status?: DensityDNA["status"]): string =>
  status === "processing"
    ? "Data processing in progress"
    : status === "not_applicable"
    ? "Not structurally applicable"
    : INTELLIGENCE_LABELS.disclosureMissing;

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
  normalizeDensityClass(value) ?? INTELLIGENCE_LABELS.disclosureMissing;

export default function DensityDNACard({ density }: DensityDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(density.status);
  const normalized = normalizeDensityClass(density.density_class);
  const headlineValue = normalized ?? statusPlaceholder;
  const insight =
    density.status === "ok"
      ? `${INTELLIGENCE_LABELS.disclosure} Represents a ${normalized ?? "Medium"}-density vertical system.`
      : density.status === "processing"
      ? "Data processing in progress."
      : "Not structurally applicable for this system type.";
  const severityScore =
    density.status === "ok"
      ? density.density_score ?? getSeverityScoreForClassification("density", density.density_class)
      : null;

  return (
    <DNACard
      title="Density Profile"
      headline={headlineValue}
      subline={INTELLIGENCE_LABELS.disclosure}
      insight={insight}
      dnaType="density"
      severityScore={severityScore}
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Units per acre</span>
            <p className="text-[11px] text-slate-500">Land density</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(density.units_per_acre, 2, density.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Units per tower</span>
            <p className="text-[11px] text-slate-500">Tower load</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(density.units_per_tower, 2, density.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Avg units per floor</span>
            <p className="text-[11px] text-slate-500">Floor density</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(density.avg_units_per_floor, 2, density.status)}
          </span>
        </div>
      </div>
    </DNACard>
  );
}
