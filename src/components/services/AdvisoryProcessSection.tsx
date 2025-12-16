"use client";

const steps = [
  {
    title: "1. Discovery Call",
    description:
      "We understand your budget, family needs, city preference, and whether you’re buying for self-use, investment, or a mix of both.",
  },
  {
    title: "2. Curated Shortlist",
    description:
      "We share a shortlist of properties or projects that match your brief, complete with pros/cons, pricing context, and yield/appreciation potential.",
  },
  {
    title: "3. Site Visits & Evaluation",
    description:
      "We coordinate site visits, help you evaluate construction quality, layout efficiency, and location advantages on ground.",
  },
  {
    title: "4. Negotiation & Closure Support",
    description:
      "We assist with negotiations, token money, documentation, loan coordination and registration so you can close confidently.",
  },
];

export default function AdvisoryProcessSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))] mb-3">
            How Our Advisory Process Works
          </h2>
          <p className="text-muted-foreground">
            A structured, low-friction process designed to help serious buyers make clear, confident decisions.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


