interface StressSignalsProps {
  extremeCrowdingShare: number;
  extremeTowerLoadShare: number;
  stressZones: string[];
}

export default function StressSignals({
  extremeCrowdingShare,
  extremeTowerLoadShare,
  stressZones,
}: StressSignalsProps) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            Structural Risk & Stress Signals
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Signals of compounding vertical stress across the city.
          </h2>
          <p className="text-sm text-slate-400">
            These indicators represent pressure on shared residential systems.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              label: "% extreme crowding",
              value: `${extremeCrowdingShare}%`,
              detail: "Projects above the 120 units/acre threshold.",
            },
            {
              label: "% extreme tower load",
              value: `${extremeTowerLoadShare}%`,
              detail: "Projects with tower load above 260 units per tower.",
            },
            {
              label: "Zones of compounding vertical stress",
              value: stressZones.length ? `${stressZones.length} zones` : "0 zones",
              detail: stressZones.length
                ? stressZones.join(" · ")
                : "No compounding stress zones detected.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
