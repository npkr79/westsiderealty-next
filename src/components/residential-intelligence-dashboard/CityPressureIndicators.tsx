interface Indicator {
  label: string;
  value: string;
  detail: string;
}

interface CityPressureIndicatorsProps {
  indicators: Indicator[];
}

export default function CityPressureIndicators({ indicators }: CityPressureIndicatorsProps) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 rounded-[26px] border border-white/10 bg-white/5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
              City Pressure Indicators
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Forward-looking structural signals
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicators.map((indicator) => (
              <div key={indicator.label} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {indicator.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{indicator.value}</p>
                <p className="mt-2 text-xs text-slate-400">{indicator.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
