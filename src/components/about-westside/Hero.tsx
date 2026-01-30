import Link from "next/link";

export default function AboutWestsideHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_60%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 sm:py-24 lg:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-300">
          About Westside
        </p>
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Westside is building India's first Residential Intelligence system.
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            This is not a portal. It is a residential intelligence layer that explains how
            homes are structured, how systems behave, and what signals matter to decision-makers.
          </p>
          <p className="text-sm text-slate-400">
            Westside exists to define a new category for residential understanding.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
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
        </div>
      </div>
    </section>
  );
}
