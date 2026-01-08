import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Car } from "lucide-react";

interface LocationAdvantage {
  name?: string;
  title?: string;
  distance?: string;
  time?: string;
  category?: string;
}

interface LocationAdvantagesProps {
  locationAdvantages?: any;
  locationHighlights?: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  schools: "🏫",
  hospitals: "🏥",
  transport: "🚇",
  shopping: "🛒",
  restaurants: "🍽️",
  entertainment: "🎬",
  parks: "🌳",
  general: "📍",
};

export default function LocationAdvantages({ locationAdvantages, locationHighlights }: LocationAdvantagesProps) {
  if (!locationAdvantages && !locationHighlights) return null;

  let items: LocationAdvantage[] = [];

  // Parse locationAdvantages
  if (locationAdvantages) {
    if (Array.isArray(locationAdvantages)) {
      items = locationAdvantages.map((item: any) => ({
        name: item.name || item.title || item,
        distance: item.distance,
        time: item.time,
        category: item.category || 'general',
      }));
    } else if (typeof locationAdvantages === 'object') {
      items = Object.entries(locationAdvantages).map(([key, value]: [string, any]) => ({
        name: typeof value === 'string' ? value : value.name || value.title || key,
        distance: value.distance,
        time: value.time,
        category: value.category || key.toLowerCase(),
      }));
    }
  }

  // Parse locationHighlights if it's a string
  if (locationHighlights && typeof locationHighlights === 'string') {
    const highlights = locationHighlights.split(',').map(h => h.trim()).filter(Boolean);
    items = [...items, ...highlights.map(name => ({ name, category: 'general' }))];
  }

  if (items.length === 0) return null;

  // Group by category
  const grouped = items.reduce((acc: Record<string, LocationAdvantage[]>, item) => {
    const category = item.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Advantages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>{categoryIcons[category.toLowerCase()] || categoryIcons.general}</span>
                <span className="capitalize">{category.replace(/_/g, ' ')}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{item.name || item.title}</div>
                      {(item.distance || item.time) && (
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {item.distance && (
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {item.distance}
                            </span>
                          )}
                          {item.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.time}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
