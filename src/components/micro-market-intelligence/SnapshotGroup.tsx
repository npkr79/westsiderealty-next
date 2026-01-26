import type { ReactNode } from "react";

interface SnapshotGroupProps {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

export default function SnapshotGroup({ title, aside, children }: SnapshotGroupProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {aside ? <div className="text-xs text-slate-500">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}
