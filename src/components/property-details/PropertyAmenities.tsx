"use client";

import React from "react";
import { getAmenityIcon } from "@/lib/amenityIcons";

interface PropertyAmenitiesProps {
  amenities?: string[] | any[];
}

export default function PropertyAmenities({ amenities = [] }: PropertyAmenitiesProps) {
  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return null;

  // Ensure amenities is an array and extract string values
  const amenityList = amenities.map((amenity) => {
    if (typeof amenity === "string") {
      return amenity;
    } else if (amenity && typeof amenity === "object") {
      // If it's an object, try to extract a name or stringify
      return amenity.name || amenity.title || JSON.stringify(amenity);
    }
    return String(amenity);
  }).filter(Boolean);

  if (amenityList.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold text-foreground">Amenities & Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {amenityList.map((amenity, index) => {
          const IconComponent = getAmenityIcon(amenity);
          return (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                {React.createElement(IconComponent, { className: "w-6 h-6 text-gray-600" })}
              </div>
              <span className="text-sm font-medium text-foreground flex-1">
                {amenity}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
