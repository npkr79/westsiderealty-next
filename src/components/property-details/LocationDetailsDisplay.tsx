"use client";

interface LocationDetailsDisplayProps {
  nearby_landmarks?: string[] | string;
}

export default function LocationDetailsDisplay({
  nearby_landmarks,
}: LocationDetailsDisplayProps) {
  if (!nearby_landmarks || (Array.isArray(nearby_landmarks) && nearby_landmarks.length === 0)) {
    return null;
  }

  const list =
    typeof nearby_landmarks === "string"
      ? nearby_landmarks.split(",").map((s) => s.trim()).filter(Boolean)
      : nearby_landmarks;

  if (!list || list.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">Location Highlights</h2>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {list.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </section>
  );
}


