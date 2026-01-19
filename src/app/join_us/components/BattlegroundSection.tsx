"use client";

import { Card, CardContent } from "@/components/ui/card";

const battlegroundRoles = [
  {
    name: "The Commander",
    positioning: "Where real real estate happens.",
    environment: "On-ground neighborhoods",
    inventory: "Independent houses, standalone apartments",
  },
  {
    name: "The Strategist",
    positioning: "Where inventory becomes opportunity.",
    environment: "Office & structured sourcing",
    inventory: "Landowner + investor share assets",
  },
  {
    name: "The Advisor",
    positioning: "Where real estate meets wealth.",
    environment: "Office-first advisory",
    inventory: "₹5Cr+ premium & HNI homes",
  },
  {
    name: "The Partner",
    positioning: "Inside the engine of new developments.",
    environment: "Developer site offices",
    inventory: "Primary market & launches",
  },
  {
    name: "The Corporate Executive",
    positioning: "Where business meets real estate.",
    environment: "Corporate & institutional meetings",
    inventory: "Office resales, leasing, pre-leased assets",
  },
  {
    name: "The Mandate Director",
    positioning: "Directing the most strategic assets.",
    environment: "High-stakes negotiations",
    inventory: "Exclusive mandates & bulk assets",
  },
];

export function BattlegroundSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
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
            <Card key={role.name} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="text-sm uppercase tracking-widest text-muted-foreground">
                  {role.name}
                </div>
                <h3 className="text-xl font-semibold text-foreground">{role.positioning}</h3>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Environment:</span>{" "}
                  {role.environment}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Inventory:</span>{" "}
                  {role.inventory}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
