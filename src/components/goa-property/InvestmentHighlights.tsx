"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Building2,
  MapPin,
  Wallet,
  Sparkles,
  Home,
  LucideIcon,
} from "lucide-react";

interface Highlight {
  icon: string;
  title: string;
  subtitle: string;
}

interface InvestmentHighlightsProps {
  highlights: Highlight[];
}

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Building2,
  MapPin,
  Wallet,
  Sparkles,
  Home,
};

export default function InvestmentHighlights({ highlights }: InvestmentHighlightsProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Why Invest in Aerocidade?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Strategic advantages that make this a smart investment choice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => {
            const IconComponent = iconMap[highlight.icon] || TrendingUp;
            return (
              <Card
                key={index}
                className="border-2 border-teal-100 hover:border-teal-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-100 p-3 rounded-lg flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {highlight.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
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

