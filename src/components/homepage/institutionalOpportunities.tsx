interface Props {
  deals?: unknown[];
}

export default function InstitutionalOpportunitiesSection({ deals }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">Institutional Opportunities</h2>
      <p className="mt-2 text-sm text-slate-300">
        {Array.isArray(deals) && deals.length > 0
          ? `${deals.length} opportunities are currently available.`
          : "Opportunities are being refreshed."}
      </p>
    </section>
  );
}
