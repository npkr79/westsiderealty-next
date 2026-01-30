interface DistributionItem {
  label: string;
  count: number;
  percent: number;
}

interface VerticalIntensityLandscapeProps {
  heightDistribution: DistributionItem[];
  unitsDistribution: DistributionItem[];
  towerDistribution: DistributionItem[];
  superHighRiseClusters: string[];
  hyperDensePockets: string[];
}

export default function VerticalIntensityLandscape({
  heightDistribution,
  unitsDistribution,
  towerDistribution,
  superHighRiseClusters,
  hyperDensePockets,
}: VerticalIntensityLandscapeProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Vertical Intensity Landscape
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Height distribution, density bands, and tower concentration patterns.
          </h2>
          <p className="text-sm text-slate-600">
            This view separates city-scale patterns from individual project entries.
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Height distribution
            </p>
            {heightDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Units per acre
            </p>
            {unitsDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Tower concentration
            </p>
            {towerDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Emerging super-high-rise clusters
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {superHighRiseClusters.length
                ? superHighRiseClusters.join(" · ")
                : "No dominant clusters identified yet."}
            </p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Hyper-dense pockets
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {hyperDensePockets.length
                ? hyperDensePockets.join(" · ")
                : "No hyper-dense pockets identified yet."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
