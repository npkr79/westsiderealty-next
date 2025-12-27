"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Waves, DollarSign, Home, Globe, Heart } from "lucide-react";

interface WhyInvestInGoaProps {
  propertyTitle?: string;
  location?: string;
}

export default function WhyInvestInGoa({ propertyTitle, location }: WhyInvestInGoaProps) {
  const investmentReasons = [
    {
      icon: TrendingUp,
      title: "Consistent Appreciation",
      description: "Goa real estate has shown 8-12% annual appreciation over the past decade, with premium beachfront properties appreciating even faster. Limited land availability and growing infrastructure ensure sustained value growth.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Waves,
      title: "Tourism-Driven Rental Demand",
      description: "With 8M+ annual visitors, Goa offers exceptional rental yields of 8-12% for holiday homes. Properties near beaches and tourist attractions generate consistent rental income year-round, especially during peak season.",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      icon: DollarSign,
      title: "High Rental Yields",
      description: "Goa holiday properties offer rental yields significantly higher than traditional residential markets. Short-term rentals (Airbnb) and long-term leases both provide attractive returns, making it an ideal passive income investment.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Home,
      title: "Dual Purpose Investment",
      description: "Invest in a property that serves as both a personal holiday retreat and a rental-generating asset. Use it for family vacations while earning rental income when you're not using it, maximizing your investment value.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Globe,
      title: "NRI-Friendly Market",
      description: "Goa is a preferred destination for NRIs and global investors. The relaxed lifestyle, pleasant weather, and strong legal framework make it easy for overseas buyers to invest and manage properties remotely.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Heart,
      title: "Quality of Life",
      description: "Beyond investment returns, Goa offers an unparalleled lifestyle with pristine beaches, Portuguese heritage, world-class cuisine, and year-round pleasant weather. It's India's top destination for retirement and second homes.",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  return (
    <section className="py-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Why Invest in Goa Real Estate?
        </h2>
        <p className="text-muted-foreground text-lg">
          {propertyTitle && location 
            ? `Discover why ${propertyTitle} in ${location} represents a smart investment opportunity in India's premier holiday destination.`
            : "Goa offers unique investment opportunities combining lifestyle, tourism, and strong returns."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investmentReasons.map((reason, index) => {
          const IconComponent = reason.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 rounded-lg ${reason.bgColor} mb-4`}>
                  <IconComponent className={`h-6 w-6 ${reason.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200">
        <h3 className="text-xl font-semibold text-foreground mb-3">
          Investment Outlook for Goa
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Goa's real estate market is supported by strong fundamentals: growing infrastructure (new Mopa International Airport), 
          government initiatives like "Goa Beyond Beaches" tourism transformation plan, limited land availability, and consistent 
          demand from both domestic and international buyers. With 25% of properties serving as holiday homes generating passive income, 
          Goa represents one of India's most attractive real estate investment destinations.
        </p>
      </div>
    </section>
  );
}

