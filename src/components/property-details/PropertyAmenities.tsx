"use client";

interface PropertyAmenitiesProps {
  amenities?: string[];
}

export default function PropertyAmenities({ amenities = [] }: PropertyAmenitiesProps) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">Amenities</h2>
      <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
        {amenities.map((amenity) => (
          <li key={amenity}>• {amenity}</li>
        ))}
      </ul>
    </section>
  );
}


