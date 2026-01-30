interface HeroProps {
  totalProjects: number;
  averageVillasPerAcre: number | string;
  dominantLandPosture: string;
  dominantScaleClass: string;
}

export default function VillaIntelligenceHero({
  totalProjects,
  averageVillasPerAcre,
  dominantLandPosture,
  dominantScaleClass,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_60%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 sm:py-24 lg:py-28">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
            Villa Market Intelligence
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Villa Intelligence Dashboard
          </h1>
          <p className="text-base text-emerald-100/80 sm:text-lg">
            Horizontal residential ecosystems · Hyderabad
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Villa ecosystems analyzed",
              value: totalProjects.toLocaleString("en-IN"),
            },
            {
              label: "City average villas per acre",
              value: averageVillasPerAcre,
            },
            { label: "Dominant land posture", value: dominantLandPosture },
            { label: "Dominant scale class", value: dominantScaleClass },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/5 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.35)]"
            >
              <p className="text-xs text-emerald-100/70">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
