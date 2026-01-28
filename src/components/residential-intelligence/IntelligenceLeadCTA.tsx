interface IntelligenceLeadCTAProps {
  projectName: string;
  city: string;
}

const formatCity = (value: string) => value.replace(/-/g, " ");

export default function IntelligenceLeadCTA({ projectName, city }: IntelligenceLeadCTAProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">Request deeper insight</h2>
        <p className="text-sm text-slate-600">
          Get a private intelligence brief on {projectName} in {formatCity(city)} from
          the Westside research desk.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">
          Request Intelligence Brief
        </button>
        <button className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700">
          Speak to a Westside Analyst
        </button>
      </div>
    </section>
  );
}
export default function IntelligenceLeadCTA() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-900 shadow-sm">
      <h2 className="text-lg font-semibold">Request an Intelligence Brief</h2>
      <p className="mt-1 text-sm text-slate-600">
        Get a tailored residential intelligence brief from a Westside analyst.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
        >
          Request Intelligence Brief
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Speak to a Westside Analyst
        </button>
      </div>
    </section>
  );
}
