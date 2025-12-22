"use client";

import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Ruler, Calendar, TrendingUp } from "lucide-react";
import type { LandingPageConfiguration } from "@/types/landingPage";

interface KeyStatsStripProps {
  configurations: LandingPageConfiguration[];
}

export default function KeyStatsStrip({ configurations }: KeyStatsStripProps) {
  const config = configurations[0];
  const priceDisplay = config?.price_display || "₹55.29 Lakhs*";
  const sizeMin = config?.size_min || 348.65;
  const sizeMax = config?.size_max || 348.65;
  const sizeDisplay = sizeMin === sizeMax ? `${sizeMin} sq.ft` : `${sizeMin} - ${sizeMax} sq.ft`;

  const stats = [
    {
      icon: IndianRupee,
      label: "Price",
      value: priceDisplay,
      color: "text-teal-600"
    },
    {
      icon: Ruler,
      label: "Unit Size",
      value: "582 sq.ft",
      color: "text-cyan-600"
    },
    {
      icon: TrendingUp,
      label: "Rental Yield",
      value: "12%",
      subtitle: "Starting from Day 1",
      color: "text-green-600"
    },
    {
      icon: Calendar,
      label: "Payment Plan",
      value: "50% | 25% | 25%",
      color: "text-blue-600"
    }
  ];

  return (
    <section className="py-8 px-4 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-y-2 border-teal-200">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-2 border-teal-100 bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-4 text-center">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

