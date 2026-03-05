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
  configurationDisplay?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceRangeText?: string | null;
  reraNumber?: string | null;
  developerName?: string | null;
  microMarketName?: string | null;
  demandContext?: string;
  advisoryYears?: number | null;
  buyersHelped?: number | null;
  onCallBack?: () => void;
  onBrochure?: () => void;
}

export default function ProjectStickyCard({
  projectName,
  address,
  bhkConfig,
  carpetArea,
  possessionDate,
  configurationDisplay,
  priceMin,
  priceMax,
  priceRangeText,
  reraNumber,
  developerName,
  microMarketName,
  demandContext,
  advisoryYears,
  buyersHelped,
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

  const demandLine =
    demandContext ||
    `Buyer activity remains active in ${microMarketName || "this micro-market"}, with serious demand focused on quality inventory.`;

  const socialProofLine = `${buyersHelped || 1200}+ buyers advised • ${advisoryYears || 12}+ years in market • Strong local corridor expertise`;

  return (
    <Card className="border-slate-300 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.55)]">
      <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Project Name */}
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-foreground mb-2">{projectName}</h2>
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

          {configurationDisplay && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Configuration</div>
                <div className="font-semibold text-foreground">{configurationDisplay}</div>
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
        <div className="space-y-2">
          <div className="rounded-md border border-slate-300 bg-slate-100 p-3">
            <p className="text-xs font-semibold text-slate-900">Decision support access</p>
            <p className="mt-1 text-[11px] text-slate-700">{socialProofLine}</p>
          </div>
          <Button
            onClick={onBrochure}
            className="w-full bg-slate-900 text-white hover:bg-slate-800"
            size="default"
          >
            Instant Brochure & Floor Plans
          </Button>
          <Button
            onClick={onCallBack}
            variant="outline"
            className="w-full"
            size="default"
          >
            Quick Callback in 10 Minutes
          </Button>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {demandLine}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
