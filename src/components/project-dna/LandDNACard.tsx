import type { LandDNA } from "@/intelligence/projectDNA";
import DNACard from "./DNACard";
import { getSeverityScoreForClassification } from "@/intelligence/visualSystem";
import {
  INTELLIGENCE_LABELS,
  normalizeLandStrength,
} from "@/constants/intelligenceLanguage";

interface LandDNACardProps {
  land: LandDNA;
}

const resolvePlaceholder = (status?: LandDNA["status"]): string =>
  status === "processing"
    ? "Data processing in progress"
    : status === "not_applicable"
    ? "Not structurally applicable"
    : INTELLIGENCE_LABELS.disclosureMissing;

const formatLandPerUnit = (value: number | null, status?: LandDNA["status"]) => {
  if (value === null) return resolvePlaceholder(status);
  const sqft =
    value < 200 ? Number((value * 10.7639).toFixed(0)) : Number(value.toFixed(0));
  return `${sqft.toLocaleString("en-IN")} sq.ft per unit`;
};

const formatNumber = (
  value: number | null,
  decimals: number = 0,
  status?: LandDNA["status"]
): string => {
  if (value === null) return resolvePlaceholder(status);
  const rounded = Number(value.toFixed(decimals));
  return Number.isFinite(rounded) ? rounded.toLocaleString("en-IN") : resolvePlaceholder(status);
};

const formatRatio = (value: number | null, status?: LandDNA["status"]) => {
  if (value === null) return resolvePlaceholder(status);
  const rounded = Number(value.toFixed(2));
  return Number.isFinite(rounded) ? `${rounded.toLocaleString("en-IN")}x` : resolvePlaceholder(status);
};

const prettyLabel = (value: string | null): string =>
  normalizeLandStrength(value) ?? INTELLIGENCE_LABELS.disclosureMissing;

export default function LandDNACard({ land }: LandDNACardProps) {
  const statusPlaceholder = resolvePlaceholder(land.status);
  const normalized = normalizeLandStrength(land.land_class);
  const headlineValue = normalized ?? statusPlaceholder;
  const insight =
    land.status === "ok"
      ? `${INTELLIGENCE_LABELS.disclosure} Indicates ${normalized ?? "Balanced"} land strength.`
      : land.status === "processing"
      ? "Data processing in progress."
      : "Not structurally applicable for this system type.";
  const severityScore =
    land.status === "ok"
      ? getSeverityScoreForClassification("land", land.land_class)
      : null;

  return (
    <DNACard
      title="Land Profile"
      headline={headlineValue}
      subline={INTELLIGENCE_LABELS.disclosure}
      insight={insight}
      dnaType="land"
      severityScore={severityScore}
    >
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Land per unit</span>
            <p className="text-[11px] text-slate-500">Sq.ft per unit</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatLandPerUnit(land.land_per_unit_sqft, land.status)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <span className="text-slate-500">Built-up to land ratio</span>
            <p className="text-[11px] text-slate-500">Built-up intensity</p>
          </div>
          <span className="text-lg font-semibold text-slate-900">
            {formatRatio(land.builtup_to_land_ratio, land.status)}
          </span>
        </div>
      </div>
    </DNACard>
  );
}
