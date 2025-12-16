"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LocationDetails } from "@/types/locationDetails";

interface LocationDetailsEditorProps {
  value?: LocationDetails;
  onChange?: (value: LocationDetails) => void;
  locationDetails?: LocationDetails | any;
}

export default function LocationDetailsEditor({
  value,
  onChange,
  locationDetails,
}: LocationDetailsEditorProps) {
  const initialValue = locationDetails || value || { address: "", latitude: "", longitude: "", landmarks: "" };
  const [state, setState] = useState<LocationDetails>(
    initialValue as any
  );

  const update = (field: keyof LocationDetails, val: any) => {
    const next = { ...state, [field]: val };
    setState(next);
    onChange?.(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            rows={3}
            value={(state as any).address || ""}
            onChange={(e) => update("address" as any, e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              value={(state as any).latitude || ""}
              onChange={(e) => update("latitude" as any, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              value={(state as any).longitude || ""}
              onChange={(e) => update("longitude" as any, e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="landmarks">Nearby Landmarks</Label>
          <Textarea
            id="landmarks"
            rows={3}
            value={(state as any).landmarks || ""}
            onChange={(e) => update("landmarks" as any, e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}


