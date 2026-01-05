"use client";

import { Button } from "@/components/ui/button";
import TabbedSearch from "./TabbedSearch";

interface HeroSectionWithSearchProps {
  onContactClick?: () => void;
}

export default function HeroSectionWithSearch({ onContactClick }: HeroSectionWithSearchProps = {}) {

  return (
    <section className="relative overflow-hidden bg-gray-100 py-1 md:py-6">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-6">
        {/* Tabbed Search Component */}
        <TabbedSearch />
      </div>
    </section>
  );
}
