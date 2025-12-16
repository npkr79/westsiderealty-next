"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AmenitiesSelectorProps {
  options?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  selectedAmenities?: string[];
  onAmenitiesChange?: (amenities: string[]) => void;
}

export default function AmenitiesSelector({
  options = [],
  value = [],
  onChange,
  selectedAmenities,
  onAmenitiesChange,
}: AmenitiesSelectorProps) {
  const currentValue = selectedAmenities || value;
  const handleChange = (amenities: string[]) => {
    onAmenitiesChange?.(amenities);
    onChange?.(amenities);
  };
  const toggle = (amenity: string) => {
    const next = currentValue.includes(amenity)
      ? currentValue.filter((a) => a !== amenity)
      : [...currentValue, amenity];
    handleChange(next);
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Amenities</Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((amenity) => (
          <label key={amenity} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={currentValue.includes(amenity)}
              onCheckedChange={() => toggle(amenity)}
            />
            <span>{amenity}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


