"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const averageAgent = [
  "Convince mindset",
  "Chasing leads",
  "Fear of rejection",
  "Short-term commissions",
  "Random follow-ups",
  "Working alone",
];

const westsideProfessional = [
  "Service mindset",
  "Structured processes",
  "Rejection as data",
  "Long-term client building",
  "CRM-driven follow-ups",
  "Team + system support",
];

export function SalesMindsetSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Average Agent vs Westside Professional
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            This is a professional identity shift — from solo survival to structured
            performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
          <Card className="border-muted-foreground/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Average Agent</h3>
              <ul className="space-y-3 text-muted-foreground">
                {averageAgent.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="hidden lg:flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          <Card className="border-primary/30 shadow-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Westside Professional
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                {westsideProfessional.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
