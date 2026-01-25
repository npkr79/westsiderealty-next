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
    official?.registration_date || official?.date_of_registration;
  const declaredCompletionDate =
    core?.proposed_completion_date || official?.proposed_completion_date;

  const landArea = core?.land_area || official?.total_land_area;
  const builtupArea = core?.builtup_area || official?.total_builtup_area;
  const totalTowers =
    core?.total_buildings ||
    official?.total_towers ||
    official?.number_of_towers ||
    official?.no_of_towers;
  const totalUnits =
    core?.total_units ||
    official?.total_units ||
    official?.approved_units ||
    official?.total_approved_units;
  const minFloors = official?.min_floors || official?.min_floor;
  const maxFloors = official?.max_floors || official?.max_floor;
  const floorsRange =
    minFloors || maxFloors
      ? `${formatValue(minFloors)}–${formatValue(maxFloors)}`
      : formatValue(official?.total_floors);

  const promoterCount = core?.promoter_count;
  const landownerRaw =
    official?.landowner_involvement ||
    official?.land_owner_involvement ||
    official?.is_landowner_involved;
  const landownerInvolvement =
    typeof landownerRaw === "boolean"
      ? landownerRaw
        ? "Yes"
        : "No"
      : formatValue(landownerRaw);

  const locality = core?.locality;
  const mandal = core?.mandal;
  const district = core?.district;
  const surveyNumbers =
    official?.survey_numbers ||
    official?.survey_no ||
    official?.survey_number;
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Regulatory Identity</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">RERA Registration</span>
              <span className="text-right font-medium">{formatValue(registrationNumber)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Legal Project Name</span>
              <span className="text-right font-medium">{formatValue(legalProjectName)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Project Type</span>
              <span className="text-right font-medium">{formatValue(projectType)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Registration Date</span>
              <span className="text-right font-medium">{formatDate(registrationDate)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Completion Date</span>
              <span className="text-right font-medium">{formatDate(declaredCompletionDate)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Land &amp; Project Scale</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Land Area</span>
              <span className="text-right font-medium">{formatValue(landArea)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Built-up Area</span>
              <span className="text-right font-medium">{formatValue(builtupArea)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Total Towers</span>
              <span className="text-right font-medium">{formatValue(totalTowers)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Floors (min–max)</span>
              <span className="text-right font-medium">{floorsRange}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Total Approved Units</span>
              <span className="text-right font-medium">{formatValue(totalUnits)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Promoter &amp; Ownership</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Promoter Entities</span>
              <span className="text-right font-medium">{formatValue(promoterCount)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Landowner Involvement</span>
              <span className="text-right font-medium">{landownerInvolvement}</span>
            </div>
            <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              View developer intelligence ↓
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800">Official Location</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Locality</span>
              <span className="text-right font-medium">{formatValue(locality)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Mandal</span>
              <span className="text-right font-medium">{formatValue(mandal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">District</span>
              <span className="text-right font-medium">{formatValue(district)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Survey / Village</span>
              <span className="text-right font-medium">
                {formatValue(surveyNumbers || village)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
