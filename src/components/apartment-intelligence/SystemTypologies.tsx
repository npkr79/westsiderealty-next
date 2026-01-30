interface Typology {
  title: string;
  count: number;
  typicalBand: string;
  implication: string;
}

interface SystemTypologiesProps {
  typologies: Typology[];
}

export default function SystemTypologies({ typologies }: SystemTypologiesProps) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Structural System Typologies
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            The four vertical system classes shaping Hyderabad.
          </h2>
          <p className="text-sm text-slate-600">
            Each class represents a different vertical load profile and daily living reality.
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
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>{typology.count} projects</span>
                <span className="text-slate-800">{typology.typicalBand}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{typology.implication}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
