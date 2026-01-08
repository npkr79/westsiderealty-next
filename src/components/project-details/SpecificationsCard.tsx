import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Specification {
  label: string;
  value: string | number;
}

interface SpecificationsCardProps {
  specifications?: any;
}

export default function SpecificationsCard({ specifications }: SpecificationsCardProps) {
  if (!specifications) return null;

  let entries: Specification[] = [];

  if (Array.isArray(specifications)) {
    entries = specifications.map((item: any) => ({
      label: item.label || item.name || item.key || "",
      value: item.value || item.text || item,
    })).filter((item: Specification) => item.label && item.value);
  } else if (typeof specifications === 'object') {
    entries = Object.entries(specifications)
      .map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' '),
        value: String(value),
      }))
      .filter((item: Specification) => item.value && item.value !== 'null' && item.value !== 'undefined');
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
