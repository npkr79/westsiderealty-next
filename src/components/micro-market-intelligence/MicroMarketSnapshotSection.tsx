import { Badge } from "@/components/ui/badge";
import { getMicroMarketSnapshotV1 } from "@/services/microMarketIntelligenceService";
import SnapshotAuthorityBlock from "./SnapshotAuthorityBlock";
import SnapshotGroup from "./SnapshotGroup";
import SnapshotMetricCard from "./SnapshotMetricCard";

interface MicroMarketSnapshotSectionProps {
  microMarketSlug: string;
}

const formatNumber = (value: number | null, decimals: number = 0): string | null => {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "Not disclosed";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Not disclosed";
  return parsed.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

const formatYear = (iso: string | null): string | null => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getFullYear().toString();
};

const formatPercent = (value: number | null): string | null => {
  if (value === null || !Number.isFinite(value)) return null;
  return `${Math.round(value * 100)}%`;
};

const scaleLabel = (value: string | null): string | null => {
  if (!value) return null;
  return value
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join("-");
};

const displayValue = (value: string | null): string => value ?? "Not disclosed";

export function MicroMarketSnapshotLoading() {
  return (
    <section className="my-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-5 w-56 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-8 w-40 rounded bg-slate-100" />
      </div>
      <div className="mt-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function MicroMarketSnapshotSection({
  microMarketSlug,
}: MicroMarketSnapshotSectionProps) {
  const snapshot = await getMicroMarketSnapshotV1(microMarketSlug);

  const lastUpdated = snapshot ? formatDate(snapshot.authority.last_updated) : "Not disclosed";

  if (!snapshot) {
    return (
      <section className="my-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Micro-Market Intelligence Snapshot
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Structural overview based on Telangana RERA registered developments
            </p>
          </div>
          <div className="text-xs text-slate-500">
            <div>Source: Telangana RERA</div>
            <div>Last updated: {lastUpdated}</div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Intelligence snapshot is not available for this micro-market yet.
        </div>
      </section>
    );
  }

  const totalLandAcres = formatNumber(snapshot.market_scale.total_land_acres, 1);
  const avgUnitsPerAcre = formatNumber(snapshot.development_structure.avg_units_per_acre, 1);
  const avgFloorsPerTower = formatNumber(snapshot.development_structure.avg_floors_per_tower, 1);
  const avgLandPerUnit = formatNumber(snapshot.development_structure.avg_land_per_unit_sqft, 0);
  const dominantScale = scaleLabel(snapshot.development_structure.dominant_scale_class);
  const constructionRatio = formatPercent(snapshot.activity_maturity.construction_ratio);

  const registrationStart = formatYear(snapshot.activity_maturity.registration_span.start);
  const registrationEnd = formatYear(snapshot.activity_maturity.registration_span.end);
  const registrationSpan =
    registrationStart && registrationEnd
      ? `${registrationStart} → ${registrationEnd}`
      : "Not disclosed";

  return (
    <section className="my-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Micro-Market Intelligence Snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Structural overview based on Telangana RERA registered developments
          </p>
        </div>
        <div className="text-xs text-slate-500">
          <div>Source: Telangana RERA</div>
          <div>Last updated: {lastUpdated}</div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <SnapshotGroup title="Market Scale">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SnapshotMetricCard
              label="Registered projects"
              value={snapshot.market_scale.total_projects.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Approved homes"
              value={snapshot.market_scale.total_units.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Residential towers"
              value={snapshot.market_scale.total_towers.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Development land"
              value={displayValue(totalLandAcres ? `${totalLandAcres} acres` : null)}
            />
          </div>
        </SnapshotGroup>

        <SnapshotGroup
          title="Development Structure"
          aside={
            dominantScale ? (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                Dominant scale: {dominantScale}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                Dominant scale: Not disclosed
              </Badge>
            )
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SnapshotMetricCard
              label="Homes per acre"
              value={displayValue(avgUnitsPerAcre)}
            />
            <SnapshotMetricCard
              label="Floors per tower"
              value={displayValue(avgFloorsPerTower)}
            />
            <SnapshotMetricCard
              label="Land per home"
              value={displayValue(avgLandPerUnit ? `${avgLandPerUnit} sq.ft` : null)}
            />
          </div>
        </SnapshotGroup>

        <SnapshotGroup title="Market Activity & Maturity">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SnapshotMetricCard
              label="Active projects"
              value={snapshot.activity_maturity.active_projects.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Completed projects"
              value={snapshot.activity_maturity.completed_projects.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Under construction"
              value={snapshot.activity_maturity.under_construction_projects.toLocaleString("en-IN")}
            />
            <SnapshotMetricCard
              label="Construction ratio"
              value={displayValue(constructionRatio)}
            />
          </div>
          <div className="text-sm text-slate-600">
            Registration span:{" "}
            <span className="font-medium text-slate-900">{registrationSpan}</span>
          </div>
        </SnapshotGroup>

        <SnapshotAuthorityBlock
          statement={snapshot.authority.statement}
          source={snapshot.authority.data_source}
          lastUpdated={lastUpdated}
        />
      </div>
    </section>
  );
}
