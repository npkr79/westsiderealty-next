import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";

interface WestsideDensityIndexCardProps {
  index: WestsideDensityIndex;
}

const formatScore = (value: number) => `${Math.round(value)} / 100`;

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
          <span className="text-slate-500">Crowding</span>
          <span className="font-medium">{formatScore(index.crowding_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Tower Load</span>
          <span className="font-medium">{formatScore(index.tower_load_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Vertical Stress</span>
          <span className="font-medium">{formatScore(index.vertical_score)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Land Stress</span>
          <span className="font-medium">{formatScore(index.land_stress_score)}</span>
        </div>
      </div>
    </div>
  );
}
