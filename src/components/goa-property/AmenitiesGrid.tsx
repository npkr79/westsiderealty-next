"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Coffee,
  Waves,
  Dumbbell,
  Sofa,
  TreePine,
  Baby,
  Shield,
  Car,
  Zap,
  Droplets,
  LucideIcon,
} from "lucide-react";

interface Amenity {
  name: string;
  icon: string;
}

interface AmenitiesGridProps {
  amenities: Amenity[];
}

const iconMap: Record<string, LucideIcon> = {
  Coffee,
  Waves,
  Dumbbell,
  Sofa,
  TreePine,
  Baby,
  Shield,
  Car,
  Zap,
  Droplets,
};

export default function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Premium Amenities & Facilities
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Resort-style living with world-class amenities for your comfort
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {amenities.map((amenity, index) => {
            const IconComponent = iconMap[amenity.icon] || Waves;
            return (
              <Card
                key={index}
                className="text-center border-2 border-teal-100 hover:border-teal-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <CardContent className="p-6">
                  <div className="bg-teal-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {amenity.name}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

