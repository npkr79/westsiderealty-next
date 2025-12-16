"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AmenitiesSelectorProps {
  options?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

export default function AmenitiesSelector({
  options = [],
  value = [],
  onChange,
}: AmenitiesSelectorProps) {
  const toggle = (amenity: string) => {
    const next = value.includes(amenity)
      ? value.filter((a) => a !== amenity)
      : [...value, amenity];
    onChange?.(next);
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Amenities</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((amenity) => (
          <label key={amenity} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.includes(amenity)}
              onCheckedChange={() => toggle(amenity)}
            />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


