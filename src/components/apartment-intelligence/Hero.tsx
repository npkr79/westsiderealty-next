interface HeroProps {
  totalProjects: number;
  averageWdi: number;
  highStressShare: number;
  dominantHeightBand: string;
}

export default function ApartmentIntelligenceHero({
  totalProjects,
  averageWdi,
  highStressShare,
  dominantHeightBand,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_60%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 sm:py-24 lg:py-28">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
            Apartment Market Intelligence
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Apartment Intelligence Dashboard
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Vertical residential systems · Hyderabad
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Apartment systems analyzed",
              value: totalProjects.toLocaleString("en-IN"),
            },
            { label: "Average city WDI", value: `${averageWdi} / 100` },
            { label: "% in high/extreme stress", value: `${highStressShare}%` },
            { label: "Dominant height band", value: dominantHeightBand },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/5 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.35)]"
            >
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
