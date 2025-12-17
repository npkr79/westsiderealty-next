"use client";

import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onContactClick?: () => void;
}

export default function HeroSection({ onContactClick }: HeroSectionProps = {}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-100/50 via-blue-50 to-blue-100/50 py-20">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl text-gray-900">
          Premium Real Estate Advisory in{" "}
          <span className="text-blue-700 font-bold">Hyderabad, Goa & Dubai</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">
          Discover premium resale homes, luxury villas, and investment properties with trusted experts by your side.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-full px-8 py-6 text-lg"
            onClick={onContactClick}
          >
            Talk to an Expert
          </Button>
        </div>
      </div>
    </section>
  );
}


