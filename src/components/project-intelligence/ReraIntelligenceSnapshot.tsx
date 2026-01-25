import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";

interface ReraIntelligenceSnapshotProps {
  intelligenceData: ProjectIntelligenceResult | null;
}

export default function ReraIntelligenceSnapshot({
  intelligenceData,
}: ReraIntelligenceSnapshotProps) {
  const core = intelligenceData?.intelligence_snapshot?.core;
  const official = intelligenceData?.official_rera?.project;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "Not disclosed";
    }
    return String(value);
  };

  const formatDate = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
      return "Not disclosed";
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const registrationNumber =
    official?.registration_number ||
    official?.rera_registration_number ||
    official?.rera_number;
  const legalProjectName =
    official?.legal_project_name ||
    official?.project_legal_name ||
    official?.project_name;
  const projectType = official?.project_type || official?.type;
  const registrationDate =
    core?.registration_date || official?.approved_date || official?.project_start_date;
  const declaredCompletionDate =
    core?.proposed_completion_date || official?.proposed_completion_date;

  const landArea = core?.land_area_sqm || official?.total_land_area;
  const netLandArea = core?.net_land_area_sqm;
  const builtupAreaSqft = core?.builtup_area_sqft;
  const builtupAreaSqftFormatted =
    core?.builtup_area_sqft_formatted ||
    (typeof builtupAreaSqft === "number"
      ? Math.round(builtupAreaSqft).toLocaleString("en-IN")
      : null);
  const totalTowers =
    core?.total_towers ||
    official?.total_towers ||
    official?.number_of_towers ||
    official?.no_of_towers;
  const totalUnits =
    core?.total_units ||
    official?.total_units ||
    official?.approved_units ||
    official?.total_approved_units;
  const totalFloors = core?.total_floors ?? official?.total_floors ?? null;
  const minFloors = core?.min_floors ?? official?.min_floors ?? official?.min_floor;
  const maxFloors = core?.max_floors ?? official?.max_floors ?? official?.max_floor;
  const floorsRange =
    minFloors !== null && maxFloors !== null && minFloors !== maxFloors
      ? `${formatValue(minFloors)}–${formatValue(maxFloors)}`
      : null;
  const floorsDisplay =
    totalFloors !== null ? formatValue(totalFloors) : floorsRange || "Not disclosed";

  const approvedBy = core?.approved_by || official?.authority_name;

  const locality = core?.locality;
  const mandal = core?.mandal;
  const district = core?.district;
  const surveyNumbers =
    core?.location?.survey_numbers && core.location.survey_numbers.length > 0
      ? core.location.survey_numbers.join(", ")
      : undefined;
  const village = official?.village;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Regulatory Data
        </p>
        <h3 className="text-lg font-semibold text-slate-900">
          RERA Intelligence Snapshot
        </h3>
        <p className="text-sm text-slate-600">
          Verified regulatory overview based on Telangana RERA filings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Regulatory Identity</h4>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm text-slate-700">
            <span className="text-slate-500">RERA Registration</span>
            <span className="text-right font-medium">{formatValue(registrationNumber)}</span>

            <span className="text-slate-500">Legal Project Name</span>
            <span className="text-right font-medium">{formatValue(legalProjectName)}</span>

            <span className="text-slate-500">Project Type</span>
            <span className="text-right font-medium">{formatValue(projectType)}</span>

            <span className="text-slate-500">Registration Date</span>
            <span className="text-right font-medium">{formatDate(registrationDate)}</span>

            <span className="text-slate-500">Approved By</span>
            <span className="text-right font-medium">{formatValue(approvedBy)}</span>

            <span className="text-slate-500">Completion Date</span>
            <span className="text-right font-medium">{formatDate(declaredCompletionDate)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Land &amp; Project Scale</h4>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm text-slate-700">
            <span className="text-slate-500">Land Area</span>
            <span className="text-right font-medium">{formatValue(landArea)}</span>

            <span className="text-slate-500">Net Land Area</span>
            <span className="text-right font-medium">{formatValue(netLandArea)}</span>

            <span className="text-slate-500">Built-up Area</span>
            <span className="text-right font-medium">
              {builtupAreaSqftFormatted ? `${builtupAreaSqftFormatted} sq.ft` : "Not disclosed"}
            </span>

            <span className="text-slate-500">Total Towers</span>
            <span className="text-right font-medium">{formatValue(totalTowers)}</span>

            <span className="text-slate-500">Total Floors</span>
            <span className="text-right font-medium">{floorsDisplay}</span>

            <span className="text-slate-500">Total Approved Units</span>
            <span className="text-right font-medium">{formatValue(totalUnits)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Project Location</h4>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm text-slate-700">
            <span className="text-slate-500">Locality</span>
            <span className="text-right font-medium">{formatValue(locality)}</span>

            <span className="text-slate-500">Village</span>
            <span className="text-right font-medium">{formatValue(village)}</span>

            <span className="text-slate-500">Mandal</span>
            <span className="text-right font-medium">{formatValue(mandal)}</span>

            <span className="text-slate-500">District</span>
            <span className="text-right font-medium">{formatValue(district)}</span>

            <span className="text-slate-500">Survey Numbers</span>
            <span className="text-right font-medium">
              {formatValue(surveyNumbers)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
