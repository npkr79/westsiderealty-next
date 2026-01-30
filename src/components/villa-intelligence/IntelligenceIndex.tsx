import Link from "next/link";
import type { VillaIntelligenceProject } from "@/services/intelligenceDashboardService";
import { normalizeDensityClass, normalizeLandStrength } from "@/constants/intelligenceLanguage";

interface Group {
  title: string;
  description: string;
  projects: VillaIntelligenceProject[];
}

interface IntelligenceIndexProps {
  groups: Group[];
}

const formatMetric = (value: number | null, decimals = 1) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
};

export default function IntelligenceIndex({ groups }: IntelligenceIndexProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Villa Intelligence Index
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Structured access to villa intelligence files.
          </h2>
          <p className="text-sm text-slate-600">
            Files are grouped by land strength, density posture, and ecosystem scale.
          </p>
        </div>
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{group.title}</h3>
                  <p className="text-sm text-slate-600">{group.description}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {group.projects.length} files
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {group.projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/residential-intelligence/hyderabad/${project.slug}`}
                    className="group rounded-[20px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {project.name}
                        </p>
                        <p className="text-xs text-slate-500">{project.microMarket}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Villas/acre
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatMetric(project.villasPerAcre)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                      <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                        Land per villa: {formatMetric(project.landPerVillaSqft, 0)} sq.ft
                      </div>
                      <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                        Scale class: {project.scaleClass}
                      </div>
                      <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                        Land strength: {normalizeLandStrength(project.landStrengthClass) ?? "Not disclosed"}
                      </div>
                      <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2">
                        Density: {normalizeDensityClass(project.densityClass) ?? "Not disclosed"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
