"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Waves,
  ShoppingBag,
  Umbrella,
  Museum,
  Sun,
  Train,
  MapPin,
  LucideIcon,
} from "lucide-react";
import GoogleMapEmbed from "@/components/common/GoogleMapEmbed";

interface NearbyPlace {
  name: string;
  distance: string;
  icon: string;
}

interface LocationAdvantagesProps {
  location: {
    micromarket: string;
    city: string;
    district: string;
    taluka: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  nearbyPlaces: NearbyPlace[];
}

const iconMap: Record<string, LucideIcon> = {
  Plane,
  Waves,
  ShoppingBag,
  Umbrella,
  Museum,
  Sun,
  Train,
  MapPin,
};

export default function LocationAdvantages({
  location,
  nearbyPlaces,
}: LocationAdvantagesProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-teal-50/30 to-white">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Prime Location in {location.micromarket}, {location.city}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Strategically positioned near Dabolim Airport with easy access to beaches, 
            markets, and key destinations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Map */}
          <div className="rounded-lg overflow-hidden shadow-xl">
            <GoogleMapEmbed
              lat={location.coordinates.lat}
              lng={location.coordinates.lng}
              zoom={14}
              mapType="satellite"
              businessName="Aerocidade Studio Apartments"
              address={`${location.micromarket}, ${location.district}, ${location.city}`}
              height={450}
              title="Aerocidade Location - Dabolim, Goa"
            />
          </div>

          {/* Nearby Places */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gray-900">
              Nearby Destinations
            </h3>
            <div className="space-y-4">
              {nearbyPlaces.map((place, index) => {
                const IconComponent = iconMap[place.icon] || MapPin;
                return (
                  <Card
                    key={index}
                    className="border border-teal-100 hover:border-teal-400 hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-100 p-3 rounded-lg">
                            <IconComponent className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {place.name}
                            </h4>
                          </div>
                        </div>
                        <Badge className="bg-teal-600 text-white">
                          {place.distance}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

