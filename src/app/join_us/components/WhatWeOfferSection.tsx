"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  GraduationCap,
  Award,
  Laptop,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface WhatWeOfferSectionProps {
  title: string;
  subtitle?: string | null;
  benefits: Benefit[];
}

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  GraduationCap,
  Award,
  Laptop,
  TrendingUp,
  Users,
};

export function WhatWeOfferSection({
  title,
  subtitle,
  benefits,
}: WhatWeOfferSectionProps) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = iconMap[benefit.icon] || Award;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
