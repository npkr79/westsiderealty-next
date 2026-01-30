interface VerticalSystemSummary {
  totalProjects: number;
  totalUnits: number;
  avgFloors: number;
  cityWdi: number;
  stressPosture: string;
}

interface HorizontalSystemSummary {
  totalEcosystems: number;
  totalVillas: number;
  avgVillasPerAcre: number;
  cityWvie: number;
  landPosture: string;
}

interface StructuralCompositionProps {
  vertical: VerticalSystemSummary;
  horizontal: HorizontalSystemSummary;
  balanceModel: string;
}

export default function StructuralComposition({
  vertical,
  horizontal,
  balanceModel,
}: StructuralCompositionProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            City Structural Composition
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Vertical and horizontal systems modeled side-by-side.
          </h2>
          <p className="text-sm text-slate-600">{balanceModel}</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Vertical systems (apartments)
            </p>
            <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total projects
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {vertical.totalProjects}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total units
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {vertical.totalUnits.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg floors</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {vertical.avgFloors}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">City WDI</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {vertical.cityWdi}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Vertical stress posture
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {vertical.stressPosture}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Horizontal systems (villas)
            </p>
            <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total ecosystems
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {horizontal.totalEcosystems}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total villas
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {horizontal.totalVillas.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Avg villas / acre
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {horizontal.avgVillasPerAcre}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">City WVIE</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {horizontal.cityWvie}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Land posture</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {horizontal.landPosture}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
