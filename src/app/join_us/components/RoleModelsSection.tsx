"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const roles = [
  {
    role: "The Commander",
    price: "₹4,999",
    features: [
      "Micro-market dominance",
      "Focus on independent houses",
      "Ground execution & inventory hunting",
      "Local area authority",
    ],
  },
  {
    role: "The Strategist",
    price: "₹9,999",
    features: [
      "Landowner & investor share deals",
      "Control supply pre-market",
      "Structured sourcing strategies",
      "Asset pricing & valuation",
    ],
  },
  {
    role: "The Advisor",
    price: "₹14,999",
    features: [
      "Premium assets & Villas (5Cr+)",
      "High Net-Worth (HNI) Client focus",
      "Wealth creation advisory",
      "Office-first consultancy",
    ],
  },
  {
    role: "The Partner",
    price: "₹19,999",
    features: [
      "Exclusive developer inventory",
      "Manage site-office execution",
      "Drive primary market sales",
      "New project launch specialist",
    ],
  },
  {
    role: "The Corporate Executive",
    price: "₹24,999",
    features: [
      "Commercial office resales & leasing",
      "Pre-leased asset management",
      "Corporate & Institutional deals",
      "Business-first real estate",
    ],
  },
  {
    role: "The Mandate Director",
    price: "₹29,999",
    features: [
      "Exclusive strategic mandates",
      "Bulk asset liquidation",
      "Strategic land acquisition",
      "Elite partnership network",
    ],
  },
];

export function RoleModelsSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-blue-50/30">
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
            <div key={role.role} className="group [perspective:1400px]">
              <Card className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white/80 to-slate-50 shadow-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:[transform:rotateX(4deg)_rotateY(-4deg)]">
                <div className="h-1.5 w-full bg-[#003DA5]" />
                <CardContent className="flex h-full min-h-[500px] flex-col p-6 space-y-5">
                  <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {role.role}
                    </p>
                    <div className="flex items-end gap-2 mt-3">
                      <span className="text-4xl font-bold text-[#003DA5]">{role.price}</span>
                      <span className="text-sm text-slate-500">/month</span>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full bg-[#DC1C2E] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#b91525]"
                    size="lg"
                    asChild
                  >
                    <a href="#application-form">Choose Plan</a>
                  </Button>

                  <div className="h-px w-full bg-slate-200/70" />

                  <ul className="space-y-3 text-slate-600">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#DC1C2E] mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
