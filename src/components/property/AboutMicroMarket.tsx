"use client";

import Link from "next/link";
import { TrendingUp, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutMicroMarketProps {
  microMarketName: string;
  microMarketSlug?: string;
  citySlug: string;
  description?: string;
  pricePerSqftMin?: number;
  pricePerSqftMax?: number;
  appreciationRate?: number;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function AboutMicroMarket({ 
  microMarketName, 
  microMarketSlug,
  citySlug,
  description,
  pricePerSqftMin,
  pricePerSqftMax,
  appreciationRate 
}: AboutMicroMarketProps) {
  if (!microMarketName) return null;

  // Extract first 3-4 lines (roughly 400 chars)
  const shortDescription = description 
    ? (stripHtml(description).slice(0, 400) + (description.length > 400 ? "..." : ""))
    : `${microMarketName} is a prime micro-market offering excellent connectivity and infrastructure.`;

  const microMarketUrl = microMarketSlug 
    ? `/${citySlug}/${microMarketSlug}`
    : `/${citySlug}/micro-markets`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          About {microMarketName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {shortDescription}
        </p>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricePerSqftMin && pricePerSqftMax && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Building className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Price/sqft</p>
                <p className="text-sm font-semibold">
                  ₹{pricePerSqftMin.toLocaleString()} - ₹{pricePerSqftMax.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {appreciationRate && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">YoY Growth</p>
                <p className="text-sm font-semibold">+{appreciationRate}%</p>
              </div>
            </div>
          )}
        </div>

        <Link href={microMarketUrl}>
          <Button variant="outline" className="w-full">
            Know more about {microMarketName}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

