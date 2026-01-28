interface IntelligenceHeaderProps {
  project: any;
  city: string;
}

const formatCity = (value: string) => value.replace(/-/g, " ");

export default function IntelligenceHeader({ project, city }: IntelligenceHeaderProps) {
  const projectName = project?.project_name ?? "Unknown project";
  const registrationNumber =
    project?.registration_number ??
    project?.rera_registration_number ??
    project?.rera_id ??
    "Not disclosed";
  const status = project?.project_status ?? project?.status ?? "Not disclosed";
  const cityLabel = formatCity(city);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Residential Intelligence
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{projectName}</h1>
        <p className="text-sm text-slate-500">{cityLabel}</p>
      </div>
      <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">RERA ID</p>
          <p className="font-medium text-slate-900">{registrationNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">City</p>
          <p className="font-medium text-slate-900">{cityLabel}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Status</p>
          <p className="font-medium text-slate-900">{status}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Intelligence Layer</p>
          <p className="font-medium text-slate-900">RERA Structural Profile</p>
        </div>
      </div>
    </section>
  );
}
interface IntelligenceHeaderProps {
  projectName: string;
  city: string;
  reraId: string;
  status: string;
}

export default function IntelligenceHeader({
  projectName,
  city,
  reraId,
  status,
}: IntelligenceHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Residential Intelligence
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {projectName}
      </h1>
      <p className="mt-1 text-sm text-slate-600">{city}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <span className="text-slate-500">RERA ID:</span>{" "}
          <span className="font-medium">{reraId}</span>
        </div>
        <div>
          <span className="text-slate-500">Status:</span>{" "}
          <span className="font-medium">{status}</span>
        </div>
      </div>
    </header>
  );
}
