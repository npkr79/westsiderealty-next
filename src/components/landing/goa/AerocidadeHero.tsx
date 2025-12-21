"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageCircle, TrendingUp } from "lucide-react";
import type { LandingPage, LandingPageConfiguration } from "@/services/admin/supabaseLandingPagesService";

interface AerocidadeHeroProps {
  landingPage: LandingPage;
  configurations: LandingPageConfiguration[];
}

export default function AerocidadeHero({ landingPage, configurations }: AerocidadeHeroProps) {
  const priceDisplay = configurations.length > 0 
    ? configurations[0].price_display || `₹${(configurations[0].starting_price || 0) / 100000}L`
    : "₹55L";

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${landingPage.title} in ${landingPage.location_info}. Please share more details.`
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <Image
          src={landingPage.hero_image_url || "/placeholder.svg"}
          alt={landingPage.title}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Gradient Overlay - Tropical Beach Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 via-cyan-800/60 to-blue-900/70"></div>
        {/* Animated Wave Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNIDAgNTAgUTI1IDI1IDUwIDUwIFQxMDAgNTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] opacity-30"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center text-white">
          {/* Tagline Badge */}
          <Badge className="mb-6 bg-teal-500/90 backdrop-blur-sm text-white border-0 px-6 py-2 text-lg font-semibold shadow-lg">
            Vive la Goa
          </Badge>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
            {landingPage.title}
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-3xl mb-4 font-semibold drop-shadow-lg">
            {landingPage.headline}
          </p>
          <p className="text-lg md:text-xl mb-8 opacity-95 drop-shadow-md">
            {landingPage.subheadline}
          </p>

          {/* Floating Price Badge */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white/95 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl border-2 border-teal-300/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-teal-600" />
                <div className="text-left">
                  <p className="text-sm text-gray-600 font-medium">Starting from</p>
                  <p className="text-3xl font-bold text-gray-900">{priceDisplay}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RERA Badge */}
          {landingPage.rera_number && (
            <div className="mb-8 flex justify-center">
              <Badge className="bg-white/90 backdrop-blur-sm px-6 py-3 border-2 border-teal-200 shadow-lg">
                <Shield className="h-5 w-5 mr-2 text-teal-600" />
                <span className="text-gray-800 font-semibold text-base">
                  RERA: {landingPage.rera_number}
                </span>
              </Badge>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
              onClick={() => {
                const formSection = document.getElementById("goa-lead-form");
                formSection?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Get Exclusive Details
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/90 text-white hover:bg-white/20 backdrop-blur-sm px-10 py-6 text-lg font-semibold"
              onClick={() => {
                window.open(`https://wa.me/${landingPage.whatsapp_number}?text=${whatsappMessage}`, "_blank");
              }}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              WhatsApp Us
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
}

