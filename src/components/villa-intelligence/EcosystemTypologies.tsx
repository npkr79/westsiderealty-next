interface Typology {
  title: string;
  count: number;
  typicalDensity: string;
  typicalLandPosture: string;
  implication: string;
}

interface EcosystemTypologiesProps {
  typologies: Typology[];
}

export default function EcosystemTypologies({ typologies }: EcosystemTypologiesProps) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Villa Ecosystem Typologies
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            The four horizontal systems shaping Hyderabad.
          </h2>
          <p className="text-sm text-slate-600">
            Each typology reflects a different land posture and living intensity.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {typologies.map((typology) => (
            <div
              key={typology.title}
              className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {typology.title}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{typology.count} projects</span>
                <span>Typical density: {typology.typicalDensity}</span>
                <span>Land posture: {typology.typicalLandPosture}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{typology.implication}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
