interface SnapshotAuthorityBlockProps {
  statement: string;
  source: string;
  lastUpdated: string;
}

export default function SnapshotAuthorityBlock({
  statement,
  source,
  lastUpdated,
}: SnapshotAuthorityBlockProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Westside Intelligence Brief
      </p>
      <p className="mt-2 leading-relaxed text-slate-700">{statement}</p>
      <div className="mt-3 text-xs text-slate-500">
        Source: {source} · Last updated: {lastUpdated}
      </div>
    </div>
  );
}
