"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const roles = [
  {
    name: "The Commander",
    price: "₹4,999",
    priceSuffix: "/month",
  },
  {
    name: "The Strategist",
    price: "₹9,999",
    priceSuffix: "/month",
    badge: "Most Popular",
  },
  {
    name: "The Advisor",
    price: "₹14,999",
    priceSuffix: "/month",
  },
  {
    name: "The Partner",
    price: "₹19,999",
    priceSuffix: "/month",
  },
  {
    name: "The Corporate Executive",
    price: "₹24,999",
    priceSuffix: "/month",
    badge: "Enterprise",
  },
  {
    name: "The Mandate Director",
    price: "₹29,999",
    priceSuffix: "/month",
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
            <div key={role.name} className="group [perspective:1400px]">
              <Card className="relative overflow-hidden border border-white/40 bg-white/60 shadow-[0_20px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_40px_80px_rgba(15,23,42,0.35)] group-hover:[transform:rotateX(4deg)_rotateY(-4deg)]">
                {role.badge && (
                  <div className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {role.badge}
                  </div>
                )}
                <CardContent className="p-6 space-y-6">
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white/40 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {role.name}
                    </p>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-4xl font-bold text-foreground">{role.price}</span>
                      <span className="text-sm text-muted-foreground">{role.priceSuffix}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" asChild>
                    <a href="#application-form">Choose Plan</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
