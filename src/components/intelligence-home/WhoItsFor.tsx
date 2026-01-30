export default function WhoItsFor() {
  const audiences = [
    {
      title: "Home buyers",
      description: "Assess livability through system structure and density.",
    },
    {
      title: "Investors",
      description: "Evaluate density risk, land strength, and scale class.",
    },
    {
      title: "Developers",
      description: "Benchmark system formats and land posture outcomes.",
    },
    {
      title: "Advisors",
      description: "Apply structural intelligence to planning decisions.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Who Uses This
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          Built for residential decision-makers
        </h2>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((audience) => (
          <div
            key={audience.title}
            className="rounded-[20px] border border-white/60 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm font-semibold text-slate-900">{audience.title}</p>
            <p className="mt-2 text-xs text-slate-600">{audience.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
