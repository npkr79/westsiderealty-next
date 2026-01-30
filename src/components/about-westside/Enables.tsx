const audiences = [
  {
    title: "Buyers",
    detail: "Understand structural quality, density posture, and long-term livability.",
  },
  {
    title: "Investors",
    detail: "Model system resilience and identify compounding residential signals.",
  },
  {
    title: "Developers",
    detail: "Benchmark system choices against city-scale intelligence baselines.",
  },
  {
    title: "Cities",
    detail: "Track residential health with evidence beyond market sentiment.",
  },
];

export default function AboutWestsideEnables() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            What This Enables
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Intelligence that serves every residential decision-maker.
          </h2>
          <p className="text-base text-slate-600">
            Residential Intelligence replaces speculation with structured clarity.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="rounded-[20px] border border-slate-200 bg-slate-50 p-6"
            >
              <p className="text-sm font-semibold text-slate-900">{audience.title}</p>
              <p className="mt-2 text-sm text-slate-600">{audience.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
