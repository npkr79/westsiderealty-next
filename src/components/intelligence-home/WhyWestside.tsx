export default function WhyWestside() {
  const pillars = [
    {
      title: "Structural intelligence",
      description: "Density, vertical configuration, and land posture measured together.",
    },
    {
      title: "Regulatory foundation",
      description: "Derived from Telangana RERA structural disclosures.",
    },
    {
      title: "City-scale modeling",
      description: "Ecosystem-level signals beyond individual listings.",
    },
    {
      title: "Decision-grade signals",
      description: "Structured intelligence for residential planning and allocation.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Westside Method
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          A residential intelligence layer, not a portal.
        </h2>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-[22px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
          >
            <p className="text-base font-semibold text-slate-900">{pillar.title}</p>
            <p className="mt-2 text-sm text-slate-600">{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
