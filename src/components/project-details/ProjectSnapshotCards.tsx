"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ProjectSnapshotCardsProps {
  totalLandArea?: number | string | null;
  totalTowers?: number | string | null;
  totalFloors?: number | string | null;
  totalUnits?: number | string | null;
  bhkConfig?: string | null;
  sizeRange?: string | null;
}

export default function ProjectSnapshotCards({
  totalLandArea,
  totalTowers,
  totalFloors,
  totalUnits,
  bhkConfig,
  sizeRange,
}: ProjectSnapshotCardsProps) {
  const items = [
    totalLandArea && {
      label: "Land Area",
      value: `${totalLandArea} acres`,
    },
    totalTowers && {
      label: "Towers",
      value: String(totalTowers),
    },
    totalFloors && {
      label: "Floors",
      value: String(totalFloors),
    },
    totalUnits && {
      label: "Units",
      value: String(totalUnits),
    },
    bhkConfig && {
      label: "Configuration",
      value: bhkConfig,
    },
    sizeRange && {
      label: "Size Range",
      value: sizeRange,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  if (!items.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


