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
  Droplets
} from "lucide-react";
import type { Amenity } from "@/types/landingPageTemplate";

interface AmenitiesGridProps {
  amenities: Amenity[];
}

const AMENITY_ICON_MAP: Record<string, any> = {
  'Coffee': Coffee,
  'Cafeteria': Coffee,
  'Waves': Waves,
  'Swimming Pool': Waves,
  'Dumbbell': Dumbbell,
  'Gym': Dumbbell,
  'Sofa': Sofa,
  'Lounge': Sofa,
  'TreePine': TreePine,
  'Garden': TreePine,
  'Baby': Baby,
  'Play Zone': Baby,
  'Shield': Shield,
  'Security': Shield,
  'Car': Car,
  'Parking': Car,
  'Zap': Zap,
  'Power': Zap,
  'Droplets': Droplets,
  'Sewage': Droplets
};

export default function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  const getIcon = (title?: string, icon?: string) => {
    const iconName = icon || title || '';
    return AMENITY_ICON_MAP[iconName] || Coffee;
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Premium Amenities
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Resort-style living with world-class facilities
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {amenities.map((amenity, index) => {
            const Icon = getIcon(amenity.title, amenity.icon || undefined);
            return (
              <Card 
                key={amenity.id || index}
                className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg bg-white/90 backdrop-blur-sm"
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-teal-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                      {amenity.title}
                    </h3>
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

