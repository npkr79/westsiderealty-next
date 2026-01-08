"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Home, Key, Building2 } from "lucide-react";
import { format } from "date-fns";

interface ProjectStickyCardProps {
  projectName: string;
  address?: string;
  bhkConfig?: string | null;
  carpetArea?: string | number | null;
  possessionDate?: string | null;
  propertyType?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceRangeText?: string | null;
  reraNumber?: string | null;
  developerName?: string | null;
  onCallBack?: () => void;
  onBrochure?: () => void;
}

export default function ProjectStickyCard({
  projectName,
  address,
  bhkConfig,
  carpetArea,
  possessionDate,
  propertyType,
  priceMin,
  priceMax,
  priceRangeText,
  reraNumber,
  developerName,
  onCallBack,
  onBrochure,
}: ProjectStickyCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const displayPrice = priceRangeText || 
    (priceMin && priceMax ? `₹${(priceMin / 10000000).toFixed(1)} - ${(priceMax / 10000000).toFixed(1)} Cr` : null) ||
    (priceMin ? `From ₹${(priceMin / 10000000).toFixed(1)} Cr` : null);

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 space-y-6">
        {/* Project Name */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">{projectName}</h2>
          {address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
          )}
        </div>

        {/* Price */}
        {displayPrice && (
          <div className="pb-4 border-b">
            <div className="text-2xl font-bold text-primary">{displayPrice}</div>
            <div className="text-xs text-muted-foreground mt-1">Prices are subject to change</div>
          </div>
        )}

        {/* Key Details */}
        <div className="space-y-3 pb-4 border-b">
          {bhkConfig && (
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">BHK Configuration</div>
                <div className="font-semibold text-foreground">{bhkConfig}</div>
              </div>
            </div>
          )}

          {carpetArea && (
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Carpet Area</div>
                <div className="font-semibold text-foreground">
                  {typeof carpetArea === 'number' ? `${carpetArea} sq.ft.` : carpetArea}
                </div>
              </div>
            </div>
          )}

          {possessionDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Possession Date</div>
                <div className="font-semibold text-foreground">{formatDate(possessionDate) || possessionDate}</div>
              </div>
            </div>
          )}

          {propertyType && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Property Type</div>
                <div className="font-semibold text-foreground">{propertyType}</div>
              </div>
            </div>
          )}
        </div>

        {/* Developer & RERA */}
        {(developerName || reraNumber) && (
          <div className="space-y-2 pb-4 border-b text-sm">
            {developerName && (
              <div>
                <span className="text-muted-foreground">Developer: </span>
                <span className="font-semibold text-foreground">{developerName}</span>
              </div>
            )}
            {reraNumber && (
              <div>
                <span className="text-muted-foreground">RERA: </span>
                <span className="font-semibold text-foreground">{reraNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onBrochure}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            Get Brochure
          </Button>
          <Button
            onClick={onCallBack}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Request Call Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
