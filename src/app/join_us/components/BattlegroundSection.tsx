"use client";

import { Card, CardContent } from "@/components/ui/card";

const battlegroundRoles = [
  {
    name: "The Commander",
    role: "Micro-market specialist & ground execution.",
    focus: "Area focused, independent houses, standalone apartments, inventory hunting.",
    positioning: "Local authority and on-ground market controller.",
  },
  {
    name: "The Strategist",
    role: "Inventory and landowner/investor share.",
    focus: "Landowner deals, investor share units, pricing strategy, structured sourcing.",
    positioning: "Controls supply before it reaches the market.",
  },
  {
    name: "The Advisor",
    role: "Premium & HNI role.",
    focus: "Villas 5Cr+, premium assets, HNI end-user clients.",
    positioning: "The trusted consultant for high-net-worth asset acquisition.",
  },
  {
    name: "The Partner",
    role: "Developer inventory role.",
    focus: "New launches, developer projects, site-office execution.",
    positioning: "Represents developers and manages primary market sales.",
  },
  {
    name: "The Corporate Executive",
    role: "Commercial real estate role.",
    focus:
      "Office resales, leasing, pre-leased assets, corporate clients, and HNI investors.",
    positioning: "Handles structured, business-first real estate.",
  },
  {
    name: "The Mandate Director",
    role: "Mandate and strategic asset role.",
    focus: "Exclusive mandates, bulk assets, strategic land, elite partnerships.",
    positioning: "An internal authority circle for high-trust assets.",
  },
];

export function BattlegroundSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Battleground
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Select the role that matches your operating style, territory, and deal type.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {battlegroundRoles.map((role) => (
            <div key={role.name} className="group [perspective:1200px]">
              <Card className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/70 shadow-xl backdrop-blur-lg transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:[transform:rotateX(3deg)_rotateY(-3deg)]">
                <div className="h-1.5 w-full bg-[#003DA5]" />
                <CardContent className="p-6 space-y-4">
                  <div className="inline-flex rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#003DA5]">
                    {role.name}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Role:</span>{" "}
                      {role.role}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Focus:</span>{" "}
                      {role.focus}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Positioning:</span>{" "}
                      {role.positioning}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
