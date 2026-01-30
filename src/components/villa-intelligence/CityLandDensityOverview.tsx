interface DistributionItem {
  label: string;
  count: number;
  percent: number;
}

interface CityLandDensityOverviewProps {
  densityDistribution: DistributionItem[];
  landDistribution: DistributionItem[];
  posture: string;
}

export default function CityLandDensityOverview({
  densityDistribution,
  landDistribution,
  posture,
}: CityLandDensityOverviewProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            City Land & Density Overview
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Land distribution and horizontal density patterns.
          </h2>
          <p className="text-sm text-slate-600">
            Horizontal market posture:{" "}
            <span className="font-semibold text-slate-800">{posture}</span>
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Distribution by density class
            </p>
            {densityDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Distribution by land strength
            </p>
            {landDistribution.map((item) => (
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
      </div>
    </section>
  );
}
