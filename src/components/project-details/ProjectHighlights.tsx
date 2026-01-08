import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeJsonParse } from "@/lib/safeJson";

interface ProjectHighlightsProps {
  highlights?: any;
}

interface HighlightItem {
  icon?: string;
  emoji?: string;
  title?: string;
  subtitle?: string;
  text?: string;
  display_order?: number;
}

// Emoji mapping for common highlight keywords
const getHighlightEmoji = (text: string): string => {
  const lower = text.toLowerCase();
  
  // Area/Size related
  if (lower.includes('acre') || lower.includes('sqft') || lower.includes('sq.ft') || lower.includes('square')) return '📐';
  if (lower.includes('tower') || lower.includes('building')) return '🏢';
  if (lower.includes('floor') || lower.includes('storey')) return '🏗️';
  
  // Quality/Status related
  if (lower.includes('star') || lower.includes('luxury') || lower.includes('premium')) return '⭐';
  if (lower.includes('rera') || lower.includes('registered') || lower.includes('approved')) return '✅';
  if (lower.includes('trusted') || lower.includes('reputed') || lower.includes('developer')) return '🏆';
  
  // Location related
  if (lower.includes('location') || lower.includes('prime') || lower.includes('strategic')) return '📍';
  if (lower.includes('connectivity') || lower.includes('access')) return '🚗';
  
  // Amenities related
  if (lower.includes('amenit')) return '🏛️';
  if (lower.includes('club') || lower.includes('lounge')) return '🎯';
  if (lower.includes('pool') || lower.includes('swim')) return '🏊';
  if (lower.includes('gym') || lower.includes('fitness')) return '💪';
  if (lower.includes('park') || lower.includes('garden')) return '🌳';
  if (lower.includes('security') || lower.includes('safety')) return '🔒';
  if (lower.includes('parking')) return '🅿️';
  
  // Default
  return '✅';
};

export default function ProjectHighlights({ highlights }: ProjectHighlightsProps) {
  if (!highlights) return null;

  // Parse highlights - can be array or object (JSONB from Supabase is already parsed)
  const parsed = typeof highlights === 'string' ? safeJsonParse(highlights, highlights) : highlights;
  
  let items: HighlightItem[] = [];

  if (Array.isArray(parsed)) {
    items = parsed.map((item: any) => {
      if (typeof item === 'string') {
        return { text: item, emoji: getHighlightEmoji(item) };
      } else if (typeof item === 'object' && item !== null) {
        const text = item.text || item.value || item.title || item.name || '';
        return {
          icon: item.icon,
          emoji: item.emoji || getHighlightEmoji(text),
          title: item.title || item.name,
          subtitle: item.subtitle || item.description,
          text: text,
          display_order: item.display_order || 0,
        };
      }
      const text = String(item);
      return { text, emoji: getHighlightEmoji(text) };
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const displayText = item.title || item.text || '';
            const emoji = item.emoji || getHighlightEmoji(displayText);
            
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card"
              >
                <span className="text-2xl flex-shrink-0">{emoji}</span>
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
