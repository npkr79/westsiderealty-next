"use client";

interface ProjectNearbyPlacesProps {
  landmarks: Array<{ label?: string; distance?: string } | string>;
}

export default function ProjectNearbyPlaces({ landmarks }: ProjectNearbyPlacesProps) {
  if (!landmarks || landmarks.length === 0) return null;

  const normalized = landmarks.map((item) =>
    typeof item === "string" ? { label: item } : item
  );

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {normalized.map((item, idx) => (
        <li key={idx}>
          • {item.label}
          {item.distance ? ` (${item.distance})` : ""}
        </li>
      ))}
    </ul>
  );
}


