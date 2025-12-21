"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Building2, 
  MapPin, 
  Wallet, 
  Sparkles, 
  Home,
  Plane,
  PalmTree,
  Sofa,
  Shield
} from "lucide-react";
import type { LandingPageHighlight } from "@/types/landingPage";

interface InvestmentHighlightsProps {
  highlights: LandingPageHighlight[];
}

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  Building2,
  MapPin,
  Wallet,
  Sparkles,
  Home,
  Plane,
  PalmTree,
  Sofa,
  Shield
};

export default function InvestmentHighlights({ highlights }: InvestmentHighlightsProps) {
  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || TrendingUp;
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Investment Highlights
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Why Aerocidade is the perfect investment opportunity in South Goa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => {
            const Icon = getIcon(highlight.icon_name);
            return (
              <Card 
                key={highlight.id} 
                className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-xl bg-white/90 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {highlight.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {highlight.subtitle}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

