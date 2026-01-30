import Link from "next/link";

export default function AboutWestsideRealtyLayer() {
  return (
    <section className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            Westside Realty
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            Intelligence applied to advisory.
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-slate-300">
            Westside Realty is the advisory layer that applies Residential Intelligence to
            acquisitions, investment timing, and system strategy. It is a layer built on top
            of intelligence, not the core product.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full border border-white/10 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5"
          >
            Speak with Westside
          </Link>
        </div>
      </div>
    </section>
  );
}
