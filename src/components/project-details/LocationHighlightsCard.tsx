import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationHighlightsCardProps {
  highlights?: string[] | any;
  title?: string;
}

export default function LocationHighlightsCard({
  highlights,
  title = "Location Highlights",
}: LocationHighlightsCardProps) {
  // Normalize highlights to array of strings
  let normalizedHighlights: string[] = [];
  
  if (Array.isArray(highlights)) {
    normalizedHighlights = highlights.map(item => 
      typeof item === 'string' ? item : item?.label || item?.text || String(item)
    ).filter(Boolean);
  } else if (highlights && typeof highlights === 'object') {
    // Handle object format like { items: [...] } or { highlights: [...] }
    const items = highlights.items || highlights.highlights || highlights.list || [];
    normalizedHighlights = Array.isArray(items) 
      ? items.map(item => typeof item === 'string' ? item : item?.label || item?.text || String(item)).filter(Boolean)
      : [];
  }

  if (!normalizedHighlights || normalizedHighlights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {normalizedHighlights.map((item, idx) => (
            <li key={idx}>• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}


