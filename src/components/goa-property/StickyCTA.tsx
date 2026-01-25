"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface StickyCTAProps {
  data: {
    projectName: string;
  };
}

export default function StickyCTA({ data }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      setIsVisible(scrollPosition > windowHeight * 0.5);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-teal-200 shadow-2xl md:hidden">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold"
            onClick={() => {
              const formSection = document.getElementById("enquiry-form");
              formSection?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <Phone className="h-5 w-5 mr-2" />
            Enquire Now
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50 py-6 text-lg font-semibold"
            onClick={() => {
              const formSection = document.getElementById("enquiry-form");
              formSection?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}

