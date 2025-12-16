interface ProjectAmenitiesProps {
  amenities: any;
}

export default function ProjectAmenities({ amenities }: ProjectAmenitiesProps) {
  if (!amenities) return null;

  const items: string[] = Array.isArray(amenities)
    ? amenities
    : Array.isArray(amenities.items)
    ? amenities.items
    : [];

  if (!items.length) return null;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border bg-card px-4 py-3 text-sm text-foreground flex items-center"
        >
          <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}


