interface LandStressSignalsProps {
  landStressedShare: number;
  mediumHighDensityShare: number;
  townshipShift: string;
}

export default function LandStressSignals({
  landStressedShare,
  mediumHighDensityShare,
  townshipShift,
}: LandStressSignalsProps) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200">
            Planning & Land Stress Signals
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Forward-looking land intelligence for horizontal systems.
          </h2>
          <p className="text-sm text-emerald-100/70">
            Signals indicate where spatial pressure is compounding.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              label: "% land-stressed ecosystems",
              value: `${landStressedShare}%`,
              detail: "Projects in tight or stressed land posture bands.",
            },
            {
              label: "% medium–high density villas",
              value: `${mediumHighDensityShare}%`,
              detail: "Systems trending toward compact living intensities.",
            },
            {
              label: "Township compactness shift",
              value: townshipShift,
              detail: "Indicates consolidation of large-scale villa systems.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-3 text-sm text-emerald-100/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
