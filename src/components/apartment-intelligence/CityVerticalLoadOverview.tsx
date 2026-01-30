interface DistributionItem {
  label: string;
  count: number;
  percent: number;
}

interface CityVerticalLoadOverviewProps {
  distribution: DistributionItem[];
  posture: string;
  interpretation: string;
}

export default function CityVerticalLoadOverview({
  distribution,
  posture,
  interpretation,
}: CityVerticalLoadOverviewProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            City Vertical Load Overview
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Distribution of projects by WDI class
          </h2>
          <p className="text-sm text-slate-500">
            City vertical stress posture:{" "}
            <span className="font-semibold text-slate-800">{posture}</span>
          </p>
          <p className="text-sm text-slate-600">{interpretation}</p>
        </div>
        <div className="mt-10 space-y-4">
          {distribution.map((item) => (
            <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{item.label}</span>
                <span>
                  {item.count} projects · {item.percent}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
