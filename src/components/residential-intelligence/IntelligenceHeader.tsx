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
