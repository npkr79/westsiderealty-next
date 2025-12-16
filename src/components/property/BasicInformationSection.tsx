"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BasicInformationSectionProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

export default function BasicInformationSection({
  formData,
  onInputChange,
}: BasicInformationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Property Title</Label>
          <Input
            id="title"
            value={formData.title ?? ""}
            onChange={(e) => onInputChange("title", e.target.value)}
            placeholder="3 BHK in Neopolis, Kokapet with Skydeck"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (numeric)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price ?? ""}
            onChange={(e) => onInputChange("price", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price-display">Price Display (optional)</Label>
          <Input
            id="price-display"
            value={formData.priceDisplay ?? ""}
            onChange={(e) => onInputChange("priceDisplay", e.target.value)}
            placeholder="₹2.75 Cr all-inclusive"
          />
        </div>
      </CardContent>
    </Card>
  );
}


