interface MatrixPoint {
  id: string;
  label: string;
  type: "vertical" | "horizontal";
  density: number;
  landStrength: number;
}

interface DensityLandMatrixProps {
  points: MatrixPoint[];
}

export default function DensityLandMatrix({ points }: DensityLandMatrixProps) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            Density & Land Matrix
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            A unified grid of density pressure versus land posture.
          </h2>
          <p className="text-sm text-slate-400">
            Vertical and horizontal ecosystems are plotted to reveal structural clustering.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="relative rounded-[24px] border border-white/10 bg-white/5 p-6">
            <div className="relative h-[420px] rounded-[18px] border border-white/10 bg-slate-950/60">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div key={idx} className="border border-white/5" />
                ))}
              </div>
              <div className="absolute left-4 top-4 text-xs text-slate-500">
                High land stress
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-slate-500">
                Land abundant
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-slate-500">
                High density
              </div>
              <div className="absolute top-4 right-4 text-xs text-slate-500">
                Low density
              </div>
              {points.map((point) => (
                <div
                  key={point.id}
                  className={`absolute h-3 w-3 rounded-full ${
                    point.type === "vertical" ? "bg-sky-400" : "bg-emerald-400"
                  } shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                  style={{
                    left: `${Math.min(Math.max(point.density, 2), 98)}%`,
                    top: `${Math.min(Math.max(point.landStrength, 2), 98)}%`,
                  }}
                  title={point.label}
                />
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Legend
            </p>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-sky-400" />
                <span>Vertical systems (apartments)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span>Horizontal systems (villas)</span>
              </div>
              <div className="text-xs text-slate-500">
                Density increases left → right. Land stress increases bottom → top.
              </div>
            </div>
            <div className="mt-6 rounded-[16px] border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              Clusters indicate structural alignment between density pressure and land support.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
