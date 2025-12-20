"use client";

interface LocationDetailsDisplayProps {
  nearby_landmarks?: string[] | string | Array<{ name?: string; type?: string; distance?: string }> | { [key: string]: any };
}

export default function LocationDetailsDisplay({
  nearby_landmarks,
}: LocationDetailsDisplayProps) {
  if (!nearby_landmarks) {
    return null;
  }

  // Handle different data formats
  let list: string[] = [];
  
  try {
    if (typeof nearby_landmarks === "string") {
      // Comma-separated string
      list = nearby_landmarks.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(nearby_landmarks)) {
      // Array of strings or objects
      if (nearby_landmarks.length === 0) return null;
      
      list = nearby_landmarks.map((item) => {
        if (typeof item === "string") {
          return item;
        } else if (item && typeof item === "object" && !Array.isArray(item)) {
          // Extract name from object, fallback to other properties
          const name = item.name || item.type || item.distance || item.landmark_name;
          if (name) return String(name);
          // If no name property, try to stringify the object
          return JSON.stringify(item);
        }
        return String(item);
      }).filter(Boolean);
    } else if (typeof nearby_landmarks === "object" && !Array.isArray(nearby_landmarks)) {
      // Object (not array) - check if it has array-like structure or key-value pairs
      const entries = Object.entries(nearby_landmarks);
      
      if (entries.length === 0) return null;
      
      // Check if values are arrays (like {landmarks: [{name, type, distance}]})
      const firstValue = entries[0]?.[1];
      if (Array.isArray(firstValue)) {
        // Nested array structure
        list = entries.flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item: any) => {
              if (typeof item === "string") return item;
              if (item && typeof item === "object") {
                return item.name || item.type || item.distance || item.landmark_name || JSON.stringify(item);
              }
              return String(item);
            });
          }
          return [];
        }).filter(Boolean);
      } else {
        // Object with key-value pairs - extract meaningful values
        list = entries.map(([key, value]) => {
          if (typeof value === "string") {
            // Format as "key: value" if both are meaningful
            if (key && value && key !== "id" && key !== "created_at" && key !== "updated_at") {
              return `${key.replace(/_/g, " ")}: ${value}`;
            }
            return value;
          } else if (value && typeof value === "object" && !Array.isArray(value)) {
            // Nested object - extract name
            return (value as any).name || (value as any).type || (value as any).distance || key;
          } else if (Array.isArray(value)) {
            // Array value - join or take first
            return value.map((v: any) => typeof v === "string" ? v : (v?.name || v?.type || String(v))).join(", ");
          }
          return key;
        }).filter(Boolean);
      }
    }
  } catch (error) {
    console.error("[LocationDetailsDisplay] Error processing nearby_landmarks:", error, nearby_landmarks);
    return null;
  }

  if (!list || list.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">Location Highlights</h2>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {list.map((item, index) => {
          const { getLocationIcon } = require("@/lib/locationIcons");
          return (
            <li key={index} className="flex items-center gap-2">
              <span className="text-lg">{getLocationIcon(item)}</span>
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}


