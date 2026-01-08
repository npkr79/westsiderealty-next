import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeJsonParse } from "@/lib/safeJson";

interface Specification {
  label: string;
  value: string | number;
}

interface SpecificationsCardProps {
  specifications?: any;
}

export default function SpecificationsCard({ specifications }: SpecificationsCardProps) {
  if (!specifications) return null;

  // Parse if it's a string (JSONB from Supabase is already parsed)
  const parsed = typeof specifications === 'string' ? safeJsonParse(specifications, specifications) : specifications;
  
  let entries: Specification[] = [];

  if (Array.isArray(parsed)) {
    entries = parsed.map((item: any) => {
      // Handle both object format {label, value} and simple values
      if (typeof item === 'object' && item !== null) {
        return {
          label: item.label || item.name || item.key || item.title || "",
          value: item.value !== undefined && item.value !== null ? String(item.value) : item.text || "",
        };
      } else {
        return {
          label: "",
          value: String(item),
        };
      }
    }).filter((item: Specification) => item.label || item.value);
  } else if (typeof parsed === 'object' && parsed !== null) {
    entries = Object.entries(parsed)
      .map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' '),
        value: value !== null && value !== undefined ? String(value) : "",
      }))
      .filter((item: Specification) => item.value && item.value !== 'null' && item.value !== 'undefined' && item.value !== '');
  }

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex flex-col gap-1 pb-4 border-b last:border-0">
              <dt className="text-sm font-medium text-muted-foreground">{entry.label}</dt>
              <dd className="text-base font-semibold text-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
