"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const roles = [
  {
    name: "The Commander",
    tagline: "Where real estate happens.",
    price: "₹4,999",
    priceSuffix: "/month",
    features: [
      "Micro-market dominance",
      "Local inventory sourcing",
      "Owner relationship building",
    ],
  },
  {
    name: "The Strategist",
    tagline: "Where inventory becomes opportunity.",
    price: "₹9,999",
    priceSuffix: "/month",
    features: [
      "Landowner negotiations",
      "Investor-share inventory",
      "Asset structuring",
    ],
    badge: "Most Popular",
  },
  {
    name: "The Advisor",
    tagline: "Where real estate meets wealth.",
    price: "₹14,999",
    priceSuffix: "/month",
    features: [
      "Office-first advisory",
      "₹5Cr+ premium & HNI homes",
    ],
  },
  {
    name: "The Partner",
    tagline: "Inside the engine of new developments.",
    price: "₹19,999",
    priceSuffix: "/month",
    features: [
      "Developer site offices",
      "Primary market & launches",
    ],
  },
  {
    name: "The Corporate Executive",
    tagline: "Where business meets real estate.",
    price: "Custom",
    priceSuffix: "",
    features: [
      "Corporate & institutional meetings",
      "Office resales & leasing",
    ],
    badge: "Enterprise",
  },
  {
    name: "The Mandate Director",
    tagline: "Directing the most strategic assets.",
    price: "Custom",
    priceSuffix: "",
    features: [
      "High-stakes negotiations",
      "Exclusive mandates",
    ],
  },
];

export function RoleModelsSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Professional Roles & Subscription Models
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            These are role designations — not agent plans. Choose the professional lane
            that fits your operating style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card
              key={role.name}
              className="relative overflow-hidden border border-slate-200/70 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
            >
              {role.badge && (
                <div className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {role.badge}
                </div>
              )}
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {role.name}
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">{role.tagline}</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-foreground">{role.price}</span>
                    {role.priceSuffix && (
                      <span className="text-sm text-muted-foreground">{role.priceSuffix}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 text-muted-foreground">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-1" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" size="lg" asChild>
                  <a href="#application-form">Choose Plan</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
