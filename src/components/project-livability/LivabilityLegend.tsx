export default function LivabilityLegend() {
  return (
    <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        How to read
      </p>
      <p className="mt-2 text-xs text-slate-600">
        Lower values indicate open, breathable, low-dependency living. Higher values
        indicate dense, vertically dependent, infrastructure-heavy living environments.
      </p>
      <div className="mt-3 space-y-2">
        <p>
          <span className="font-semibold text-slate-700">0–20</span> Estate Living
        </p>
        <p>
          <span className="font-semibold text-slate-700">21–40</span> Low Density Community
        </p>
        <p>
          <span className="font-semibold text-slate-700">41–60</span> Balanced Society
        </p>
        <p>
          <span className="font-semibold text-slate-700">61–80</span> Urban High-Density
        </p>
        <p>
          <span className="font-semibold text-slate-700">81–100</span> Vertical Ecosystem
        </p>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        This is a classification system, not a quality rating.
      </p>
    </div>
  );
}
