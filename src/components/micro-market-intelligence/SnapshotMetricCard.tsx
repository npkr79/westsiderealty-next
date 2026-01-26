interface SnapshotMetricCardProps {
  label: string;
  value: string;
}

export default function SnapshotMetricCard({ label, value }: SnapshotMetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
