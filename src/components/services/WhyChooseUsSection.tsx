"use client";

import { CheckCircle2, ShieldCheck, Users, MapPinned } from "lucide-react";

const reasons = [
  {
    icon: CheckCircle2,
    title: "End-to-End Advisory",
    description:
      "From discovery to registration, we assist you at every stage of the transaction with a dedicated relationship manager.",
  },
  {
    icon: ShieldCheck,
    title: "Curated, Verified Inventory",
    description:
      "We focus on hand-picked projects and resale listings that pass our due-diligence checklist on ownership, approvals, and marketability.",
  },
  {
    icon: Users,
    title: "Specialised Local Expertise",
    description:
      "Dedicated specialists for West Hyderabad, Goa holiday homes, and Dubai investments so you always work with a local market expert.",
  },
  {
    icon: MapPinned,
    title: "Data-Backed Recommendations",
    description:
      "We combine on-ground experience with data on pricing, absorption, and rental yields to help you make confident decisions.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-16 bg-secondary/10">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))] mb-4">
            Why Work With RE/MAX Westside Realty?
          </h2>
          <p className="text-muted-foreground text-lg">
            We blend global RE/MAX standards with deep local expertise in Hyderabad, Goa, and Dubai to give you a
            seamless, high-trust buying experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group h-full rounded-xl border border-border bg-background/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <reason.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{reason.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


