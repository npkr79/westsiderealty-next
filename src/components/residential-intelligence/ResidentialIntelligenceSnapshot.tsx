import type { ProjectDNA } from "@/intelligence/projectDNA";
import {
  INTELLIGENCE_LABELS,
  SECTION_NAMING,
  normalizeDensityClass,
  normalizeLandStrength,
  normalizeScaleClass,
} from "@/constants/intelligenceLanguage";

interface ResidentialIntelligenceSnapshotProps {
  structuralProfile: any;
  landSummary: any;
  dna?: ProjectDNA;
}

const sqmToAcres = (sqm: number) => sqm / 4046.85642;

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatNumber = (value: number | null, suffix?: string) => {
  if (value === null || Number.isNaN(value)) return INTELLIGENCE_LABELS.disclosureMissing;
  const formatted = Number(value).toLocaleString("en-IN");
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatAcres = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return INTELLIGENCE_LABELS.disclosureMissing;
  return `${value.toFixed(2)} acres`;
};


export default function ResidentialIntelligenceSnapshot({
  structuralProfile,
  landSummary,
  dna,
}: ResidentialIntelligenceSnapshotProps) {
  const cardClass =
    "rounded-[22px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]";
  const totalUnits = structuralProfile?.total_units ?? null;
  const towerCount = structuralProfile?.apartment_tower_count ?? null;
  const maxFloors = structuralProfile?.max_floors ?? null;
  const totalLandSqm = toNumber(landSummary?.total_land_area ?? landSummary?.land_area);
  const netLandSqm = toNumber(
    landSummary?.net_land_area ?? landSummary?.net_land_area_sqm
  );
  const typology = structuralProfile?.physical_typology ?? null;

  const typologyLabel = (() => {
    if (!typology) return INTELLIGENCE_LABELS.disclosureMissing;
    switch (typology) {
      case "apartment_project":
        return "Apartment system";
      case "villa_project":
        return "Villa ecosystem";
      case "plotted_project":
        return "Plotted system";
      case "mixed_use":
        return "Mixed-use residential system";
      default:
        return INTELLIGENCE_LABELS.disclosureMissing;
    }
  })();

  const totalLandAcres =
    totalLandSqm !== null ? Number(sqmToAcres(totalLandSqm).toFixed(2)) : null;
  const netLandAcres =
    netLandSqm !== null ? Number(sqmToAcres(netLandSqm).toFixed(2)) : null;
  const unitsPerAcre =
    totalUnits !== null && totalLandAcres !== null && totalLandAcres > 0
      ? totalUnits / totalLandAcres
      : null;
  const unitsPerAcreDisplay =
    unitsPerAcre !== null ? Math.round(unitsPerAcre) : null;

  const densitySignal = (() => {
    const label = normalizeDensityClass(dna?.density?.density_class ?? null);
    return label
      ? `${INTELLIGENCE_LABELS.disclosure} Represents a ${label}-density vertical system.`
      : INTELLIGENCE_LABELS.disclosureMissing;
  })();
  const verticalSignal = (() => {
    const label = dna?.vertical?.vertical_class ?? null;
    return label
      ? `${INTELLIGENCE_LABELS.disclosure} Represents a ${label} vertical system.`
      : INTELLIGENCE_LABELS.disclosureMissing;
  })();
  const landSignal = (() => {
    const label = normalizeLandStrength(dna?.land?.land_class ?? null);
    return label
      ? `${INTELLIGENCE_LABELS.disclosure} Indicates ${label} land strength.`
      : INTELLIGENCE_LABELS.disclosureMissing;
  })();
  const scaleSignal = (() => {
    const label = normalizeScaleClass(dna?.scale?.scale_class ?? null);
    return label
      ? `${INTELLIGENCE_LABELS.disclosure} Reflects ${label} scale class.`
      : INTELLIGENCE_LABELS.disclosureMissing;
  })();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          {SECTION_NAMING.intelligenceSnapshot.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          {SECTION_NAMING.intelligenceSnapshot.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {SECTION_NAMING.intelligenceSnapshot.subtitle}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Structural scale
          </p>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">Total units</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatNumber(totalUnits)}
            </p>
            <p className="text-xs text-slate-500">{scaleSignal}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">System type</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {typologyLabel}
            </p>
            <p className="text-xs text-slate-500">{INTELLIGENCE_LABELS.disclosure}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Vertical configuration
          </p>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">Towers</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatNumber(towerCount)}
            </p>
            <p className="text-xs text-slate-500">{verticalSignal}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">Max floors</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatNumber(maxFloors)}
            </p>
            <p className="text-xs text-slate-500">{verticalSignal}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Land posture
          </p>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">Total land</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatAcres(totalLandAcres)}
            </p>
            <p className="text-xs text-slate-500">Net land: {formatAcres(netLandAcres)}</p>
            <p className="text-xs text-slate-500">{landSignal}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs text-slate-500">Units per acre</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatNumber(unitsPerAcreDisplay, "units/acre")}
            </p>
            <p className="text-xs text-slate-500">{densitySignal}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
