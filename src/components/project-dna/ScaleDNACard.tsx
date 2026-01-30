import type { ScaleDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";
import { getSeverityScoreForClassification } from "@/intelligence/visualSystem";
import {
  INTELLIGENCE_LABELS,
  normalizeScaleClass,
} from "@/constants/intelligenceLanguage";

interface ScaleDNACardProps {
  scale: ScaleDNA;
}

const resolvePlaceholder = (status?: ScaleDNA["status"]): string =>
  status === "processing"
    ? "Data processing in progress"
    : status === "not_applicable"
    ? "Not structurally applicable"
    : INTELLIGENCE_LABELS.disclosureMissing;

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
  normalizeScaleClass(value) ?? INTELLIGENCE_LABELS.disclosureMissing;

export default function ScaleDNACard({ scale }: ScaleDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(scale.status);
  const normalized = normalizeScaleClass(scale.scale_class);
  const headlineValue = normalized ?? statusPlaceholder;
  const insight =
    scale.status === "ok"
      ? `${INTELLIGENCE_LABELS.disclosure} Reflects ${normalized ?? "Gated community"} scale class.`
      : scale.status === "processing"
      ? "Data processing in progress."
      : "Not structurally applicable for this system type.";
  const severityScore =
    scale.status === "ok"
      ? getSeverityScoreForClassification("scale", scale.scale_class)
      : null;

  return (
    <DNACard
      title="Scale Profile"
      headline={headlineValue}
      subline={INTELLIGENCE_LABELS.disclosure}
      insight={insight}
      dnaType="scale"
      severityScore={severityScore}
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total units</span>
            <p className="text-[11px] text-slate-500">System scale</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(scale.total_units, 0, scale.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total towers</span>
            <p className="text-[11px] text-slate-500">Vertical structures</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(scale.total_towers, 0, scale.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Total floors</span>
            <p className="text-[11px] text-slate-500">Vertical magnitude</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(scale.total_floors, 0, scale.status)}
          </span>
        </div>
      </div>
    </DNACard>
  );
}
