interface DistributionItem {
  label: string;
  count: number;
  percent: number;
}

interface LandSpatialFootprintProps {
  landPerVilla: DistributionItem[];
  villasPerAcre: DistributionItem[];
  landScale: DistributionItem[];
  compactingTrends: string;
  townshipDominance: string;
  estateDisappearance: string;
}

export default function LandSpatialFootprint({
  landPerVilla,
  villasPerAcre,
  landScale,
  compactingTrends,
  townshipDominance,
  estateDisappearance,
}: LandSpatialFootprintProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Land Reality & Spatial Footprint
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Spatial distribution of land per villa, density, and ecosystem scale.
          </h2>
          <p className="text-sm text-slate-600">
            Horizontal intensity is shaped by land compression and scale consolidation.
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Land per villa distribution
            </p>
            {landPerVilla.map((item) => (
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
              Villas per acre distribution
            </p>
            {villasPerAcre.map((item) => (
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
              Project land scale distribution
            </p>
            {landScale.map((item) => (
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
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Compacting trends
            </p>
            <p className="mt-3 text-sm text-slate-600">{compactingTrends}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Emerging township dominance
            </p>
            <p className="mt-3 text-sm text-slate-600">{townshipDominance}</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Estate disappearance
            </p>
            <p className="mt-3 text-sm text-slate-600">{estateDisappearance}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
