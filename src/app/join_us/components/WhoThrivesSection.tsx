"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const traits = [
  "Full-time professionals only (no part-timers)",
  "Real estate as a long-term profession",
  "Pride in being a real estate broker",
  "Passion for meeting people and building trust",
  "Strong communication mindset",
  "Discipline and consistency",
  "Integrity and ethical selling",
  "Positive outlook and emotional control",
  "Rejection treated as learning",
  "Basic real estate experience or strong market understanding",
  "Willingness to operate inside a structured system",
];

export function WhoThrivesSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Who Thrives at Westside Realty
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            This is not for everyone. We work with professionals who want a structured
            career path — not quick commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traits.map((trait) => (
            <Card
              key={trait}
              className="border border-white/40 bg-white/60 shadow-xl backdrop-blur-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
            >
              <CardContent className="p-6 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-foreground font-medium">{trait}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
