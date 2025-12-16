"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertySpecificationsSectionProps {
  formData: any;
  setFormData: (updater: (prev: any) => any) => void;
}

export default function PropertySpecificationsSection({
  formData,
  setFormData,
}: PropertySpecificationsSectionProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Specifications</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="floor-number">Floor Number</Label>
          <Input
            id="floor-number"
            type="number"
            value={formData.floorNumber ?? ""}
            onChange={(e) => handleChange("floorNumber", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="total-floors">Total Floors</Label>
          <Input
            id="total-floors"
            type="number"
            value={formData.totalFloors ?? ""}
            onChange={(e) => handleChange("totalFloors", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="parking-spaces">Parking Spaces</Label>
          <Input
            id="parking-spaces"
            type="number"
            value={formData.parkingSpaces ?? ""}
            onChange={(e) => handleChange("parkingSpaces", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="facing">Facing</Label>
          <Input
            id="facing"
            value={formData.facing ?? ""}
            onChange={(e) => handleChange("facing", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}


