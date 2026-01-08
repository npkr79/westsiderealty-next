import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeJsonParse } from "@/lib/safeJson";
import { CheckCircle2, Star, Award, TrendingUp } from "lucide-react";

interface ProjectHighlightsProps {
  highlights?: any;
}

interface HighlightItem {
  icon?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  display_order?: number;
}

export default function ProjectHighlights({ highlights }: ProjectHighlightsProps) {
  if (!highlights) return null;

  // Parse highlights - can be array or object
  const parsed = safeJsonParse(highlights, highlights);
  
  let items: HighlightItem[] = [];

  if (Array.isArray(parsed)) {
    items = parsed.map((item: any) => {
      if (typeof item === 'string') {
        return { text: item };
      } else if (typeof item === 'object' && item !== null) {
        return {
          icon: item.icon,
          title: item.title || item.name,
          subtitle: item.subtitle || item.description,
          text: item.text || item.value,
          display_order: item.display_order || 0,
        };
      }
      return { text: String(item) };
    }).filter(item => item.text || item.title);
  } else if (typeof parsed === 'object' && parsed !== null) {
    // If it's an object, try to extract items
    if (Array.isArray((parsed as any).items)) {
      items = (parsed as any).items;
    } else {
      // Convert object to array
      items = Object.entries(parsed).map(([key, value]) => ({
        title: key,
        text: typeof value === 'string' ? value : String(value),
      }));
    }
  }

  if (items.length === 0) return null;

  // Sort by display_order if available
  items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      home: CheckCircle2,
      star: Star,
      award: Award,
      trending: TrendingUp,
    };
    const Icon = iconName ? iconMap[iconName.toLowerCase()] : CheckCircle2;
    return Icon || CheckCircle2;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card"
              >
                <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {item.title && (
                    <div className="font-semibold text-foreground mb-1">
                      {item.title}
                    </div>
                  )}
                  {item.subtitle && (
                    <div className="text-sm text-muted-foreground mb-1">
                      {item.subtitle}
                    </div>
                  )}
                  {item.text && (
                    <div className="text-sm text-foreground">
                      {item.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
