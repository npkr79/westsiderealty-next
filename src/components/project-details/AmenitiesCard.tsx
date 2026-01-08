import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Amenity {
  name?: string;
  icon?: string;
}

interface AmenitiesCardProps {
  amenities?: any;
}

// Common amenity icons (emoji fallback)
const amenityIconMap: Record<string, string> = {
  swimming: "🏊",
  pool: "🏊",
  infinity: "🏊",
  gym: "💪",
  fitness: "💪",
  park: "🌳",
  security: "🔒",
  parking: "🅿️",
  lift: "🛗",
  clubhouse: "🏛️",
  rooftop: "🏛️",
  play: "🎯",
  garden: "🌿",
  gymnasium: "💪",
  sports: "⚽",
  cricket: "🏏",
  jogging: "🏃",
  library: "📚",
  spa: "💆",
  restaurant: "🍽️",
  shopping: "🛒",
  medical: "🏥",
  hospital: "🏥",
  school: "🏫",
  lounge: "🍸",
  sky: "☁️",
  amphitheater: "🎭",
  amphitheatre: "🎭",
  theatre: "🎬",
  theater: "🎬",
  mini: "🎬",
  smart: "🏠",
  automation: "🏠",
  ev: "🔌",
  charging: "🔌",
  station: "🔌",
};

function getAmenityIcon(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return "✅"; // Default icon
}

export default function AmenitiesCard({ amenities }: AmenitiesCardProps) {
  if (!amenities) return null;

  // Parse if it's a string (JSONB from Supabase is already parsed)
  const parsed = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;

  let items: Amenity[] = [];

  if (Array.isArray(parsed)) {
    items = parsed.map((item: any) => {
      if (typeof item === 'string') {
        return { name: item, icon: getAmenityIcon(item) };
      }
      const name = item.name || item.label || item.title || String(item);
      return {
        name: name,
        icon: item.icon || item.emoji || getAmenityIcon(name),
      };
    });
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (Array.isArray(parsed.items)) {
      items = parsed.items.map((item: any) => {
        const name = typeof item === 'string' ? item : (item.name || item.label || item.title);
        return {
          name: name,
          icon: typeof item === 'string' ? getAmenityIcon(item) : (item.icon || item.emoji || getAmenityIcon(name)),
        };
      });
    } else {
      // Convert object to array
      items = Object.entries(parsed).map(([key, value]) => {
        const name = typeof value === 'string' ? value : key;
        return {
          name: name,
          icon: getAmenityIcon(name),
        };
      });
    }
  }

  if (items.length === 0) return null;

  // Group by category if items have categories
  const hasCategories = items.some((item: any) => item.category);
  const grouped = hasCategories
    ? items.reduce((acc: Record<string, Amenity[]>, item: any) => {
        const category = item.category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {})
    : { General: items };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities & Features</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} className={hasCategories ? "mb-6 last:mb-0" : ""}>
            {hasCategories && (
              <h3 className="text-lg font-semibold mb-3 text-foreground">{category}</h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
