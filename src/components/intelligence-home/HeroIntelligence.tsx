import Link from "next/link";

export default function HeroIntelligence() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_65%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
          Westside Residential Intelligence
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Hyderabad Residential Intelligence
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
          A city-scale intelligence layer that explains how residential systems are built.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Derived from Telangana RERA structural disclosures.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
          500+ residential systems modeled across Hyderabad.
        </p>
        <div className="mt-8 flex flex-wrap items-start gap-4">
          <Link
            href="/apartment-intelligence"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5"
          >
            Explore Apartment Intelligence
          </Link>
          <Link
            href="/villa-intelligence"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Explore Villa Intelligence
          </Link>
          <Link
            href="/residential-intelligence"
            className="flex flex-col rounded-full border border-white/15 px-5 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            Explore Hyderabad Residential Intelligence
            <span className="mt-1 text-[11px] font-normal uppercase tracking-[0.2em] text-slate-500">
              Unified city model
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
