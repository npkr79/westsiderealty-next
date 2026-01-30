interface Typology {
  title: string;
  supplyShare: number;
  livingImplication: string;
  assetImplication: string;
}

interface SystemTypologiesProps {
  vertical: Typology[];
  horizontal: Typology[];
}

export default function SystemTypologies({ vertical, horizontal }: SystemTypologiesProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Residential System Typologies
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Structural types across vertical and horizontal ecosystems.
          </h2>
          <p className="text-sm text-slate-600">
            Each typology expresses how residents live and how assets behave.
          </p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Vertical typologies
            </p>
            <div className="space-y-4">
              {vertical.map((item) => (
                <div key={item.title} className="rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{item.title}</span>
                    <span>{item.supplyShare}% supply</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{item.livingImplication}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.assetImplication}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Horizontal typologies
            </p>
            <div className="space-y-4">
              {horizontal.map((item) => (
                <div key={item.title} className="rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{item.title}</span>
                    <span>{item.supplyShare}% supply</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{item.livingImplication}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.assetImplication}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
