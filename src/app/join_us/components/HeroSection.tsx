"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface HeroSectionProps {
  headline: string;
  subheadline?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  primaryCtaText: string;
  secondaryCtaText: string;
  trustIndicator?: string | null;
}

export function HeroSection({
  headline,
  subheadline,
  description,
  imageUrl,
  primaryCtaText,
  secondaryCtaText,
  trustIndicator,
}: HeroSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const scrollToForm = () => {
    const formElement = document.getElementById("application-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setShowForm(true);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div className="space-y-6 text-center lg:text-left">
            {subheadline && (
              <p className="text-lg md:text-xl text-primary font-semibold">
                {subheadline}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {headline}
            </h1>
            {description && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {description}
              </p>
            )}
            {trustIndicator && (
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="text-sm md:text-base">{trustIndicator}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button
                size="lg"
                onClick={scrollToForm}
                className="text-lg px-8 py-6"
              >
                {primaryCtaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const whyJoin = document.getElementById("why-join-us");
                  whyJoin?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-lg px-8 py-6"
              >
                {secondaryCtaText}
              </Button>
            </div>
          </div>

          {/* Right Image */}
          {imageUrl && (
            <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={imageUrl}
                alt={headline}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
