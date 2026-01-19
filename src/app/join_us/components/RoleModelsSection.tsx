"use client";

import { Card, CardContent } from "@/components/ui/card";

const roles = [
  {
    name: "The Commander",
    tagline: "Where real real estate happens.",
    price: "₹4,999 / month",
    bullets: [
      "Micro-market dominance",
      "Local inventory sourcing",
      "Owner relationship building",
      "High-volume field activity",
      "Price discovery & negotiation",
      "Community trust building",
      "Ground-level deal closures",
      "Local buyer network development",
    ],
  },
  {
    name: "The Strategist",
    tagline: "Where inventory becomes opportunity.",
    price: "₹9,999 / month",
    bullets: [
      "Landowner negotiations",
      "Investor-share inventory handling",
      "Asset structuring & pricing",
      "Office-driven deal control",
      "High-value sourcing",
      "Market intelligence work",
      "Selective site visits",
      "Inventory packaging for sales teams",
    ],
  },
  {
    name: "The Advisor",
    tagline: "Where real estate meets wealth.",
    price: "₹14,999 / month",
    bullets: [
      "HNI relationship management",
      "Premium villa advisory",
      "Wealth-based conversations",
      "Long-term client portfolios",
      "Confidential deal handling",
      "Office-based advisory work",
      "High-ticket negotiation",
      "Asset-first consulting mindset",
    ],
  },
  {
    name: "The Partner",
    tagline: "Inside the engine of new developments.",
    price: "₹19,999 / month",
    bullets: [
      "Working from developer sites",
      "Launch & campaign execution",
      "Structured site sales",
      "Developer relationship management",
      "Channel partner coordination",
      "Primary market closures",
      "Event-based selling",
      "Project-level specialization",
    ],
  },
  {
    name: "The Corporate Executive",
    tagline: "Where business meets real estate.",
    price: "₹24,999 / month",
    bullets: [
      "Corporate client handling",
      "Office leasing & sales",
      "Pre-leased asset transactions",
      "Yield-based discussions",
      "Business negotiations",
      "Professional documentation flow",
      "Long-cycle deal management",
      "Institutional mindset selling",
    ],
  },
  {
    name: "The Mandate Director",
    tagline: "Directing the most strategic assets.",
    price: "₹29,999 / month",
    bullets: [
      "Exclusive mandate handling",
      "Strategic asset sales",
      "Landowner partnerships",
      "Bulk deal execution",
      "Confidential negotiations",
      "Project-level authority",
      "High-stakes decision support",
      "Elite internal positioning",
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.name} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-muted-foreground">
                      {role.name}
                    </p>
                    <h3 className="text-2xl font-semibold text-foreground">{role.tagline}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Monthly</div>
                    <div className="text-xl font-bold text-foreground">{role.price}</div>
                  </div>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
