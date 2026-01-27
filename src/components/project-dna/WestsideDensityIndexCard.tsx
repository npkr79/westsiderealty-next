import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";

interface WestsideDensityIndexCardProps {
  index: WestsideDensityIndex;
}

const formatScore = (value: number | null) =>
  value === null ? "Not disclosed" : `${Math.round(value)} / 100`;

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
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Westside Density Index™
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-4xl font-bold tracking-tight text-slate-900">
            {formatScore(index.score)}
          </span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {index.grade} Density
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{index.explanation}</p>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <MetricLabel
            label="Crowding"
            tooltip="Homes per acre pressure on shared living conditions."
          />
          <span className="font-medium">{formatScore(index.crowding_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <MetricLabel
            label="Tower Load"
            tooltip="Homes per tower load on vertical infrastructure."
          />
          <span className="font-medium">{formatScore(index.tower_load_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <MetricLabel
            label="Vertical Stress"
            tooltip="Floors per structure indicating lift dependency."
          />
          <span className="font-medium">{formatScore(index.vertical_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <MetricLabel
            label="Land Stress"
            tooltip="Land per home scarcity relative to built mass."
          />
          <span className="font-medium">{formatScore(index.land_stress_score)}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <div className="flex justify-between">
          <span>0–20</span>
          <span>Excellent (very low density stress)</span>
        </div>
        <div className="flex justify-between">
          <span>20–40</span>
          <span>Good (healthy density)</span>
        </div>
        <div className="flex justify-between">
          <span>40–60</span>
          <span>Moderate (balanced density)</span>
        </div>
        <div className="flex justify-between">
          <span>60–80</span>
          <span>High (heavy density)</span>
        </div>
        <div className="flex justify-between">
          <span>80–100</span>
          <span>Extreme (very high density stress)</span>
        </div>
      </div>
    </div>
  );
}
