import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Car, School, Hospital, ShoppingBag, Train, Plane, Building2 } from "lucide-react";
import { parseJsonb } from "@/lib/parse-jsonb";

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
  // Use parseJsonb utility for consistent parsing
  let parsedAdvantages: any = locationAdvantages;
  
  // If it's a string, parse it; if it's already an object/array, use as-is
  if (typeof locationAdvantages === 'string') {
    parsedAdvantages = parseJsonb(locationAdvantages, null);
  } else if (locationAdvantages != null) {
    parsedAdvantages = locationAdvantages;
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[LocationAdvantages] Parsed data:', { 
      original: locationAdvantages, 
      parsed: parsedAdvantages, 
      isArray: Array.isArray(parsedAdvantages),
      isObject: typeof parsedAdvantages === 'object' && parsedAdvantages !== null && !Array.isArray(parsedAdvantages)
    });
  }

  if (parsedAdvantages) {
    if (Array.isArray(parsedAdvantages)) {
      // Check if it's an array of categories with items
      const firstItem = parsedAdvantages[0];
      if (firstItem && typeof firstItem === 'object' && firstItem.category && Array.isArray(firstItem.items)) {
        // Structure: [{category: "Schools", items: [{name: "...", distance: "..."}]}]
        items = parsedAdvantages.flatMap((cat: any) => {
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
        items = parsedAdvantages.map((item: any) => {
          let name: string;
          let distance: string | undefined;
          let time: string | undefined;
          let category = 'general';

          if (typeof item === 'string') {
            name = item;
          } else if (item && typeof item === 'object') {
            // Try multiple possible name fields
            name = item.name || item.title || item.landmark || item.label || item.text || item.value;
            
            // If still no name, try to extract from object keys/values
            if (!name || name === '[object Object]') {
              // Try to get a meaningful string from the object
              const keys = Object.keys(item);
              if (keys.length > 0) {
                // Prefer 'name', 'title', 'landmark', 'label' keys
                const preferredKeys = ['name', 'title', 'landmark', 'label', 'text', 'value'];
                for (const key of preferredKeys) {
                  if (item[key] && typeof item[key] === 'string') {
                    name = item[key];
                    break;
                  }
                }
                // If still no name, use first string value
                if (!name || name === '[object Object]') {
                  for (const key of keys) {
                    const val = item[key];
                    if (typeof val === 'string' && val && val !== '[object Object]') {
                      name = val;
                      break;
                    }
                  }
                }
              }
            }
            
            // Final fallback
            if (!name || name === '[object Object]') {
              name = 'Location';
            }
            
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
      items = items.filter(item => item.name && item.name !== 'undefined' && item.name !== 'null' && item.name !== '[object Object]');
    } else if (typeof parsedAdvantages === 'object' && parsedAdvantages !== null) {
      // Handle object format: {category: {items: [...]}} or {key: value}
      items = Object.entries(parsedAdvantages).flatMap(([key, value]: [string, any]) => {
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
          // Try multiple possible name fields
          name = value.name || value.title || value.landmark || value.label || value.text || value.value;
          
          // If still no name, try to extract from object
          if (!name || name === '[object Object]') {
            const keys = Object.keys(value);
            for (const k of ['name', 'title', 'landmark', 'label', 'text', 'value', ...keys]) {
              const val = (value as any)[k];
              if (typeof val === 'string' && val && val !== '[object Object]') {
                name = val;
                break;
              }
            }
          }
          
          // Final fallback
          if (!name || name === '[object Object]') {
            name = key;
          }
          
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
      }).filter(item => item.name && item.name !== 'undefined' && item.name !== 'null' && item.name !== '[object Object]');
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
