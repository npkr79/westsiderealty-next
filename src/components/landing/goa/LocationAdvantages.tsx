"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  Plane, 
  Waves, 
  ShoppingBag, 
  Umbrella, 
  Landmark, 
  Sun, 
  Train,
  MapPin
} from "lucide-react";
import type { LandingPage, LandingPageLocationPoint } from "@/types/landingPage";

interface LocationAdvantagesProps {
  landingPage: LandingPage;
  locationPoints: LandingPageLocationPoint[];
}

const LOCATION_ICON_MAP: Record<string, any> = {
  'Plane': Plane,
  'Waves': Waves,
  'ShoppingBag': ShoppingBag,
  'Umbrella': Umbrella,
  'Landmark': Landmark,
  'Sun': Sun,
  'Train': Train,
  'MapPin': MapPin
};

export default function LocationAdvantages({ landingPage, locationPoints }: LocationAdvantagesProps) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return MapPin;
    return LOCATION_ICON_MAP[iconName] || MapPin;
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-teal-50/50 to-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prime Location Advantages
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Strategically located near Dabolim Airport with easy access to beaches, markets, and attractions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Map Section */}
          <Card className="border-2 border-teal-200 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.3977255808963!2d73.85186357481032!3d15.384967185199686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbfb908ad4ac3ed%3A0x7baa5bb1a0bddb29!2sAerocidade%20Goa!5e1!3m2!1sen!2sin!4v1766374069017!5m2!1sen!2sin"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl w-full"
                title="Aerocidade Location Map"
              />
            </CardContent>
          </Card>

          {/* Nearby Places */}
          <div className="space-y-4">
            {locationPoints.map((point, index) => {
              const Icon = getIcon(point.icon_name || undefined);
              return (
                <Card 
                  key={point.id} 
                  className="border-2 border-teal-100 hover:border-teal-300 transition-all hover:shadow-lg bg-white"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {point.landmark_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {point.description || point.landmark_type}
                        </p>
                        <p className="text-sm font-semibold text-teal-600">
                          {point.distance}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Location Summary */}
        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6 text-teal-600" />
              <h3 className="text-xl font-bold text-gray-900">Location</h3>
            </div>
            <p className="text-gray-700">{landingPage.location_info}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

