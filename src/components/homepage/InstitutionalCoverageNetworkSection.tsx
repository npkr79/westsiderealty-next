interface Props {
  metrics?: unknown;
}

export default function InstitutionalCoverageNetworkSection(_: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">Coverage Network</h2>
      <p className="mt-2 text-sm text-slate-300">
        Corridor and micro-market coverage is being refreshed.
      </p>
    </section>
  );
}
