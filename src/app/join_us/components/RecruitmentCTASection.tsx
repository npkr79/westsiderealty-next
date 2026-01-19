"use client";

import { Button } from "@/components/ui/button";

export function RecruitmentCTASection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="max-w-5xl mx-auto rounded-3xl border border-white/40 bg-white/60 p-10 md:p-14 shadow-2xl backdrop-blur-xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Don’t join a brokerage. Join a real estate operating system.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Apply to Westside Realty and build your career inside a structured, system-led
          real estate organization.
        </p>
        <Button size="lg" className="shadow-2xl transition-transform hover:scale-105" asChild>
          <a href="#application-form">Apply to Join Westside Realty</a>
        </Button>
      </div>
    </section>
  );
}
