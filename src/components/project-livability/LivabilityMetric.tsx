interface LivabilityMetricProps {
  label: string;
  score: number;
  meaning: string;
  value?: string;
  tooltip?: { title: string; description: string };
}

export default function LivabilityMetric({
  label,
  score,
  meaning,
  value,
  tooltip,
}: LivabilityMetricProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="relative inline-flex items-center gap-1 text-sm font-semibold text-slate-800 group">
          <span>{label}</span>
          {tooltip ? (
            <>
              <span className="text-xs text-slate-400">ⓘ</span>
              <div className="absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg group-hover:block">
                <p className="font-semibold text-slate-700">{tooltip.title}</p>
                <p className="mt-1 leading-relaxed">{tooltip.description}</p>
              </div>
            </>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">{meaning}</p>
        {value && <p className="mt-0.5 text-[11px] text-slate-400">{value}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900">{score} / 100</p>
      </div>
    </div>
  );
}
