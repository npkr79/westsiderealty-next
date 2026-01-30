import type { VerticalDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";
import { getSeverityScoreForClassification } from "@/intelligence/visualSystem";
import { INTELLIGENCE_LABELS } from "@/constants/intelligenceLanguage";

interface VerticalDNACardProps {
  vertical: VerticalDNA;
}

const resolvePlaceholder = (status?: VerticalDNA["status"]): string =>
  status === "processing"
    ? "Data processing in progress"
    : status === "not_applicable"
    ? "Not structurally applicable"
    : INTELLIGENCE_LABELS.disclosureMissing;

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
    : INTELLIGENCE_LABELS.disclosureMissing;

export default function VerticalDNACard({ vertical }: VerticalDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(vertical.status);
  const insight =
    vertical.status === "ok"
      ? `${INTELLIGENCE_LABELS.disclosure} Represents a ${prettyLabel(vertical.vertical_class)} vertical system.`
      : vertical.status === "processing"
      ? "Data processing in progress."
      : "Not structurally applicable for this system type.";
  const headlineValue =
    prettyLabel(vertical.vertical_class) === INTELLIGENCE_LABELS.disclosureMissing
      ? statusPlaceholder
      : prettyLabel(vertical.vertical_class);
  const severityScore =
    vertical.status === "ok"
      ? getSeverityScoreForClassification("vertical", vertical.vertical_class)
      : null;

  return (
    <DNACard
      title="Vertical Profile"
      headline={headlineValue}
      subline={INTELLIGENCE_LABELS.disclosure}
      insight={insight}
      dnaType="vertical"
      severityScore={severityScore}
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Floors per tower</span>
            <p className="text-[11px] text-slate-500">Tower height</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(vertical.avg_floors_per_tower, 1, vertical.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Vertical intensity</span>
            <p className="text-[11px] text-slate-500">Stacked floors</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatNumber(vertical.vertical_intensity, 1, vertical.status)}
          </span>
        </div>
      </div>
    </DNACard>
  );
}
