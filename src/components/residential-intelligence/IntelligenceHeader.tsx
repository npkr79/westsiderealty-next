import { PLATFORM_LAYERS } from "@/constants/intelligenceLanguage";

interface IntelligenceHeaderProps {
  project: any;
  microMarket?: string | null;
}

const formatLabel = (value: string) => value.replace(/-/g, " ");

export default function IntelligenceHeader({ project, microMarket }: IntelligenceHeaderProps) {
  const projectName = project?.project_name ?? "Residential System";
  const city = project?.city_slug ?? "Unknown";
  const hasReraRecord = Boolean(project?.id ?? project?.rera_project_id);
  const registrationStatus = hasReraRecord ? "Registered" : "Under Review";
  const statusTone = hasReraRecord
    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
    : "border-amber-400/40 bg-amber-500/20 text-amber-100";

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-10 py-9 text-white shadow-[0_24px_60px_rgba(15,23,42,0.3)]">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/30 to-amber-400/20 blur-3xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300">
        {PLATFORM_LAYERS.apartmentFile}
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
        {projectName}
      </h1>
      <p className="mt-2 text-sm text-slate-200">
        {PLATFORM_LAYERS.city}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
        {microMarket ? microMarket : formatLabel(city)}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-200">
        <div
          className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.18em] ${statusTone}`}
        >
          Status: {hasReraRecord ? "RERA Registered" : "Under RERA Review"}
        </div>
        <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
          Telangana RERA
        </div>
        <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
          {registrationStatus}
        </div>
      </div>
    </section>
  );
}
