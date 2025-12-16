"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PropertyDetailsSectionProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export default function PropertyDetailsSection({
  formData,
  onInputChange,
}: PropertyDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location ?? ""}
            onChange={(e) => onInputChange("location", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="micro-market">Micro-Market</Label>
          <Input
            id="micro-market"
            value={formData.microMarket ?? ""}
            onChange={(e) => onInputChange("microMarket", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Project / Community</Label>
          <Input
            id="project-name"
            value={formData.projectName ?? ""}
            onChange={(e) => onInputChange("projectName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="google-maps-url">Google Maps URL</Label>
          <Input
            id="google-maps-url"
            value={formData.googleMapsUrl ?? ""}
            onChange={(e) => onInputChange("googleMapsUrl", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}


