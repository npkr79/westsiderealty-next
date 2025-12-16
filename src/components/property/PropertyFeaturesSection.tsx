"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PropertyFeaturesSectionProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export default function PropertyFeaturesSection({
  formData,
  onInputChange,
}: PropertyFeaturesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Property Features</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bhk-config">BHK Configuration</Label>
          <Input
            id="bhk-config"
            value={formData.bhkConfig ?? ""}
            onChange={(e) => onInputChange("bhkConfig", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area-sqft">Area (sq.ft)</Label>
          <Input
            id="area-sqft"
            type="number"
            value={formData.areaSqft ?? ""}
            onChange={(e) => onInputChange("areaSqft", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            value={formData.bedrooms ?? ""}
            onChange={(e) => onInputChange("bedrooms", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            value={formData.bathrooms ?? ""}
            onChange={(e) => onInputChange("bathrooms", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}


