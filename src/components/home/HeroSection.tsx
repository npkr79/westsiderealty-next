"use client";

import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onContactClick?: () => void;
}

export default function HeroSection({ onContactClick }: HeroSectionProps = {}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-remax-blue to-remax-red text-white py-20">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
          Find Your Next Home with RE/MAX Westside Realty
        </h1>
        <p className="max-w-2xl text-lg text-blue-50/90">
          Discover premium resale homes, luxury villas, and investment properties in Hyderabad,
          Goa, and Dubai with trusted experts by your side.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg">Explore Properties</Button>
          <Button size="lg" variant="outline" className="border-white text-white" onClick={onContactClick}>
            Talk to an Expert
          </Button>
        </div>
      </div>
    </section>
  );
}


