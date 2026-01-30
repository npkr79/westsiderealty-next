const pipelineSteps = [
  "RERA disclosures",
  "Structural normalization",
  "System modeling",
  "Residential intelligence profiles",
  "Decision-ready signals",
];

export default function AboutWestsidePipeline() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            How Westside Builds Intelligence
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            From disclosures to signals, every layer is modeled.
          </h2>
          <p className="text-base text-slate-300">
            Westside transforms statutory disclosures into structured models and intelligence
            systems. Each layer compounds accuracy and clarity.
          </p>
        </div>
        <div className="mt-10 space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            {pipelineSteps.map((step, index) => (
              <div
                key={step}
                className="relative rounded-[18px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-200"
              >
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-semibold text-white">{step}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            The output is a city-scale intelligence layer that explains structural performance,
            not just price movement.
          </div>
        </div>
      </div>
    </section>
  );
}
