"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, MapPin } from "lucide-react";

export default function SouthGoaComparison() {
  const advantages = [
    { param: "Property Price", value: "₹6,000-12,000/sq.ft (High potential)" },
    { param: "Rental Yield", value: "8-10% (Premium, steady)" },
    { param: "Target Audience", value: "HNIs, NRIs, Retirees, Global tourists" },
    { param: "Lifestyle", value: "Serenity, Wellness, Pristine beaches" },
    { param: "Appreciation", value: "High due to limited supply" }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-teal-50/50 to-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Invest in Goa?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Goa offers premium investment opportunities with better returns and lifestyle benefits
          </p>
        </div>

        <Card className="border-2 border-teal-200 shadow-xl bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-8 w-8 text-teal-600" />
              <h3 className="text-2xl font-bold text-gray-900">
                Goa Investment Advantages
              </h3>
            </div>

            <div className="space-y-4">
              {advantages.map((advantage, index) => (
                <div 
                  key={index}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-100 hover:border-teal-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-teal-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{advantage.param}</span>
                  </div>
                  <span className="text-gray-700 font-medium md:text-right">{advantage.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-teal-200">
              <p className="text-center text-gray-600 italic">
                "Goa combines premium lifestyle with strong investment potential, making it ideal for discerning investors seeking both returns and tranquility."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

