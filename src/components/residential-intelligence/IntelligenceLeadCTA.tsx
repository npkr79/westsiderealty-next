export default function IntelligenceLeadCTA() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-white shadow-md">
      <h2 className="text-2xl font-semibold">Request Intelligence Brief</h2>
      <p className="mt-2 text-sm text-slate-200">
        Analyst briefing derived from Telangana RERA structural disclosures.
      </p>
      <p className="mt-2 text-xs text-slate-300">
        Structural evaluation. System comparison. Risk interpretation.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm">
          Request Intelligence Brief
        </button>
        <button className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white">
          Request Analyst Briefing
        </button>
      </div>
    </section>
  );
}
