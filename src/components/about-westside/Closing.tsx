import Link from "next/link";

export default function AboutWestsideClosing() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Westside Intelligence
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Residential Intelligence is how the future of housing will be understood.
          </h2>
          <p className="text-base text-slate-600">
            Westside is building the systems, language, and data models to make residential
            structure intelligible at city scale.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apartment-intelligence"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              View Apartment Intelligence
            </Link>
            <Link
              href="/villa-intelligence"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              View Villa Intelligence
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
