"use client";

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
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">Amenities</h2>
      <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
        {amenityList.map((amenity, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-lg">{getAmenityIcon(amenity)}</span>
            <span>{amenity}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}


