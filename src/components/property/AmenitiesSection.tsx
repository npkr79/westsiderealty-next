"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AmenitiesSectionProps {
  formData: any;
  handleAmenityToggle: (amenity: string) => void;
}

const DEFAULT_AMENITIES = [
  "Clubhouse",
  "Swimming Pool",
  "Gym",
  "Children's Play Area",
  "24x7 Security",
  "Power Backup",
];

export default function AmenitiesSection({
  formData,
  handleAmenityToggle,
}: AmenitiesSectionProps) {
  const customAmenity = formData?.customAmenity || "";
  const amenities: string[] = formData?.amenities || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DEFAULT_AMENITIES.map((amenity) => {
            const checked = amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => handleAmenityToggle(amenity)}
                className={`rounded-full border px-3 py-1 text-xs text-left ${
                  checked ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground"
                }`}
              >
                {amenity}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="custom-amenity">Add Custom Amenity</Label>
          <Input
            id="custom-amenity"
            value={customAmenity}
            placeholder="e.g. Sky Lounge, Golf Simulator"
            onChange={(e) => {
              const value = e.target.value;
              if (formData) {
                formData.customAmenity = value;
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}


