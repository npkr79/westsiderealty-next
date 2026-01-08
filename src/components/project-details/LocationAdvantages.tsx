import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Car, School, Hospital, ShoppingBag, Train, Plane, Building2 } from "lucide-react";

interface LocationAdvantage {
  name: string;
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

const iconMap: Record<string, React.ComponentType<any>> = {
  schools: School,
  hospitals: Hospital,
  shopping: ShoppingBag,
  malls: ShoppingBag,
  metro: Train,
  transit: Train,
  airport: Plane,
  it: Building2,
  tech: Building2,
};

function getIcon(category: string) {
  const lower = category.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (lower.includes(key)) return Icon;
  }
  return MapPin;
}

export default function LocationAdvantages({ locationAdvantages, locationHighlights }: LocationAdvantagesProps) {
  if (!locationAdvantages && !locationHighlights) return null;

  let items: LocationAdvantage[] = [];

  // Parse locationAdvantages - handle category/items structure
  if (locationAdvantages) {
    if (Array.isArray(locationAdvantages)) {
      // Check if it's an array of categories with items
      const firstItem = locationAdvantages[0];
      if (firstItem && typeof firstItem === 'object' && firstItem.category && Array.isArray(firstItem.items)) {
        // Structure: [{category: "Schools", items: [{name: "...", distance: "..."}]}]
        items = locationAdvantages.flatMap((cat: any) => {
          if (cat.category && Array.isArray(cat.items)) {
            return cat.items.map((item: any) => ({
              name: typeof item === 'string' 
                ? item 
                : String(item.name || item.title || item.landmark || item.label || 'Location'),
              distance: typeof item === 'object' && typeof item.distance === 'string' ? item.distance : undefined,
              time: typeof item === 'object' && typeof item.time === 'string' ? item.time : undefined,
              category: cat.category || 'general',
            }));
          }
          return [];
        });
      } else {
        // Simple array of items
        items = locationAdvantages.map((item: any) => {
          let name: string;
          let distance: string | undefined;
          let time: string | undefined;
          let category = 'general';

          if (typeof item === 'string') {
            name = item;
          } else if (item && typeof item === 'object') {
            name = item.name || item.title || item.landmark || item.label || String(item) || 'Location';
            distance = typeof item.distance === 'string' ? item.distance : undefined;
            time = typeof item.time === 'string' ? item.time : undefined;
            category = item.category || 'general';
          } else {
            name = String(item || 'Location');
          }

          return {
            name: String(name),
            distance,
            time,
            category,
          };
        });
      }
      items = items.filter(item => item.name && item.name !== 'undefined' && item.name !== 'null');
    } else if (typeof locationAdvantages === 'object') {
      // Handle object format: {category: {items: [...]}} or {key: value}
      items = Object.entries(locationAdvantages).flatMap(([key, value]: [string, any]) => {
        // If value has items array, it's a category structure
        if (value && typeof value === 'object' && Array.isArray(value.items)) {
          return value.items.map((item: any) => ({
            name: typeof item === 'string' 
              ? item 
              : String(item.name || item.title || item.landmark || item.label || 'Location'),
            distance: typeof item === 'object' && typeof item.distance === 'string' ? item.distance : undefined,
            time: typeof item === 'object' && typeof item.time === 'string' ? item.time : undefined,
            category: value.category || key,
          }));
        }
        // Otherwise treat as key-value pairs
        let name = key;
        let distance: string | undefined;
        let time: string | undefined;
        let category = key.toLowerCase();

        if (typeof value === 'string') {
          name = value;
        } else if (value && typeof value === 'object') {
          name = value.name || value.title || value.landmark || value.label || String(value) || key;
          distance = typeof value.distance === 'string' ? value.distance : undefined;
          time = typeof value.time === 'string' ? value.time : undefined;
          category = value.category || key.toLowerCase();
        }

        return {
          name: String(name),
          distance,
          time,
          category,
        };
      }).filter(item => item.name && item.name !== 'undefined' && item.name !== 'null');
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
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const Icon = getIcon(category);
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
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
                        <div className="font-medium text-foreground">{item.name}</div>
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
