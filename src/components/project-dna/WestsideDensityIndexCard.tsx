import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";

interface WestsideDensityIndexCardProps {
  index: WestsideDensityIndex;
}

const formatScore = (value: number | null) =>
  value === null ? "Data processing in progress" : `${Math.round(value)} / 100`;

const getStressTone = (score: number) => {
  if (score <= 20) return { badge: "bg-emerald-600", bar: "from-emerald-50" };
  if (score <= 40) return { badge: "bg-teal-600", bar: "from-teal-50" };
  if (score <= 60) return { badge: "bg-amber-600", bar: "from-amber-50" };
  if (score <= 80) return { badge: "bg-orange-600", bar: "from-orange-50" };
  return { badge: "bg-red-600", bar: "from-red-50" };
};

const getContributorSeverity = (score: number | null): string => {
  if (score === null) return "Processing";
  if (score <= 20) return "Low contributor";
  if (score <= 40) return "Moderate contributor";
  if (score <= 60) return "Elevated contributor";
  if (score <= 80) return "High contributor";
  return "Extreme contributor";
};

const MetricLabel = ({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) => (
  <span className="relative inline-flex items-center gap-1 text-slate-500 group">
    <span>{label}</span>
    <span className="text-xs text-slate-400">ⓘ</span>
    <span className="absolute left-0 top-full z-10 mt-2 hidden w-56 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-600 shadow-lg group-hover:block">
      {tooltip}
    </span>
  </span>
);

export default function WestsideDensityIndexCard({
  index,
}: WestsideDensityIndexCardProps) {
  const tone = getStressTone(index.score);
  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tone.bar} via-white to-white p-6 shadow-sm`}>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Westside Density Index™
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-4xl font-bold tracking-tight text-slate-900">
            {formatScore(index.score)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ${tone.badge}`}>
            {index.grade}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{index.explanation}</p>
        <p className="text-xs text-slate-500">{index.meaning}</p>
        <p className="text-xs text-slate-500">
          0–20 Light · 20–40 Balanced · 40–60 Moderate · 60–80 High · 80–100 Extreme
        </p>
        <p className="text-xs text-slate-500">
          Lower is structurally lighter. Higher is structurally heavier.
        </p>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-slate-700">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <MetricLabel
            label="Crowding"
            tooltip="Homes per acre pressure on shared living conditions."
          />
          <div className="text-right">
            <span className="font-medium">{formatScore(index.crowding_score)}</span>
            <p className="text-[11px] text-slate-500">{getContributorSeverity(index.crowding_score)}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <MetricLabel
            label="Tower Load"
            tooltip="Homes per tower load on vertical infrastructure."
          />
          <div className="text-right">
            <span className="font-medium">{formatScore(index.tower_load_score)}</span>
            <p className="text-[11px] text-slate-500">{getContributorSeverity(index.tower_load_score)}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <MetricLabel
            label="Vertical Stress"
            tooltip="Floors per structure indicating lift dependency."
          />
          <div className="text-right">
            <span className="font-medium">{formatScore(index.vertical_score)}</span>
            <p className="text-[11px] text-slate-500">{getContributorSeverity(index.vertical_score)}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <MetricLabel
            label="Land Stress"
            tooltip="Land per home scarcity relative to built mass."
          />
          <div className="text-right">
            <span className="font-medium">{formatScore(index.land_stress_score)}</span>
            <p className="text-[11px] text-slate-500">{getContributorSeverity(index.land_stress_score)}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 underline-offset-4 hover:underline"
      >
        How to read Westside Density Index
      </button>
    </div>
  );
}
