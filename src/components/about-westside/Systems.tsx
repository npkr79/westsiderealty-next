export default function AboutWestsideSystems() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Two Intelligence Systems
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Apartment intelligence and villa intelligence are separate systems.
          </h2>
          <p className="text-base text-slate-600">
            Apartments and villas operate on fundamentally different land, density, and
            vertical rules. Westside models them as distinct intelligence systems rather than
            a single market category.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Apartment Intelligence
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              Vertical density systems
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Tracks structural profiles, vertical circulation, density posture, and shared
              infrastructure to explain apartment performance across a city.
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Villa Intelligence
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              Land-first ecosystems
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Maps plot assembly, ground coverage, open space ratios, and density thresholds
              to reveal villa system resilience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
