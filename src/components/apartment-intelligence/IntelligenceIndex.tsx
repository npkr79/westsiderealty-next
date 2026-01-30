import Link from "next/link";
import type { ApartmentIntelligenceProject } from "@/services/intelligenceDashboardService";

interface Group {
  title: string;
  description: string;
  projects: ApartmentIntelligenceProject[];
}

interface IntelligenceIndexProps {
  groups: Group[];
  systemClassForProject: (project: ApartmentIntelligenceProject) => string;
  wdiGradeForProject: (project: ApartmentIntelligenceProject) => string;
}

const formatMetric = (value: number | null, suffix?: string) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  const formatted = Number(value.toFixed(0)).toLocaleString("en-IN");
  return suffix ? `${formatted} ${suffix}` : formatted;
};

export default function IntelligenceIndex({
  groups,
  systemClassForProject,
  wdiGradeForProject,
}: IntelligenceIndexProps) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            Apartment Intelligence Index
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Structured access to live apartment intelligence files.
          </h2>
          <p className="text-sm text-slate-400">
            Files are grouped by structural load, vertical intensity, and land stress patterns.
          </p>
        </div>
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{group.title}</h3>
                  <p className="text-sm text-slate-400">{group.description}</p>
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
                    className="group rounded-[20px] border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{project.name}</p>
                        <p className="text-xs text-slate-400">{project.microMarket}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          WDI
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {project.wdiScore}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
                      <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2">
                        System class: {systemClassForProject(project)}
                      </div>
                      <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2">
                        WDI band: {wdiGradeForProject(project)}
                      </div>
                      <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2">
                        {project.towers} towers · {project.floors} floors
                      </div>
                      <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2">
                        {formatMetric(project.unitsPerAcre, "units/acre")}
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
