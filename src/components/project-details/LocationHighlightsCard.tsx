import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationHighlightsCardProps {
  highlights?: string[];
  title?: string;
}

export default function LocationHighlightsCard({
  highlights,
  title = "Location Highlights",
}: LocationHighlightsCardProps) {
  if (!highlights || highlights.length === 0) return null;

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
          {highlights.map((item, idx) => (
            <li key={idx}>• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}


