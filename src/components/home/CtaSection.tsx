"use client";

import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  onContactClick?: () => void;
}

export default function CtaSection({ onContactClick }: CtaSectionProps = {}) {
  return (
    <section className="py-10 bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-4xl px-4 flex flex-col items-center text-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">
          Ready to explore your next property opportunity?
        </h2>
        <p className="text-sm md:text-base opacity-90 max-w-2xl">
          Talk to our senior advisors for curated recommendations in Hyderabad, Goa, or Dubai based
          on your budget, needs, and investment goals.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" variant="secondary" onClick={onContactClick}>
            Schedule a Call
          </Button>
          <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground" onClick={onContactClick}>
            WhatsApp Our Team
          </Button>
        </div>
      </div>
    </section>
  );
}


