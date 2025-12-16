"use client";

import { Card, CardContent } from "@/components/ui/card";

interface PropertyHighlightsProps {
  bhk_config?: string;
  area_sqft?: number;
  facing?: string;
  possession_status?: string;
  furnished_status?: string;
  floor_number?: string | number;
  micro_market?: string;
}

export default function PropertyHighlights(props: PropertyHighlightsProps) {
  const items = [
    props.bhk_config && { label: "Configuration", value: props.bhk_config },
    props.area_sqft && { label: "Area (sq.ft)", value: props.area_sqft.toString() },
    props.facing && { label: "Facing", value: props.facing },
    props.possession_status && { label: "Possession Status", value: props.possession_status },
    props.furnished_status && { label: "Furnishing", value: props.furnished_status },
    props.floor_number !== undefined && { label: "Floor", value: String(props.floor_number) },
    props.micro_market && { label: "Micro-Market", value: props.micro_market },
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="grid gap-4 py-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="text-sm font-medium text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


