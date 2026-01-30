import Link from "next/link";

export default function SystemsGateway() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Intelligence Systems
        </p>
        <h2 className="text-3xl font-semibold text-slate-900">
          System intelligence layers
        </h2>
        <p className="text-sm text-slate-600">
          Vertical and horizontal ecosystems modeled as separate intelligence systems.
        </p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Link
          href="/apartment-intelligence"
          className="group relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-7 shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
        >
          <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/20 to-amber-400/20 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Apartment Intelligence
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Vertical residential systems
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Westside Density Index (WDI) and vertical stress signals.
          </p>
          <span className="mt-6 inline-flex text-sm font-semibold text-slate-800">
            Enter Apartment Intelligence →
          </span>
        </Link>
        <Link
          href="/villa-intelligence"
          className="group relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-7 shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
        >
          <div className="absolute -right-16 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-400/20 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Villa Intelligence
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            Horizontal residential ecosystems
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Westside Villa Intelligence Engine (WVIE) and land posture signals.
          </p>
          <span className="mt-6 inline-flex text-sm font-semibold text-slate-800">
            Enter Villa Intelligence →
          </span>
        </Link>
      </div>
    </section>
  );
}
