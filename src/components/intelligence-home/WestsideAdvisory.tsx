import Link from "next/link";

export default function WestsideAdvisory() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-slate-900 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          Westside Realty Layer
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900">
          Westside Realty — advisory layer
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-slate-600">
          Westside Realty applies Residential Intelligence to acquisitions,
          portfolio strategy, and development planning. It is an advisory layer
          built on top of the intelligence system.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Contact Westside
        </Link>
      </div>
    </section>
  );
}
