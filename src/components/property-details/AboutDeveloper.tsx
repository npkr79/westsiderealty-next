"use client";

import Link from "next/link";
import { Calendar, Building2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface AboutDeveloperProps {
  developerName: string;
  developerSlug?: string;
  description?: string;
  yearsInBusiness?: number;
  totalProjects?: number;
  totalSftDelivered?: string;
  logoUrl?: string;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function AboutDeveloper({ 
  developerName, 
  developerSlug,
  description,
  yearsInBusiness,
  totalProjects,
  totalSftDelivered,
  logoUrl
}: AboutDeveloperProps) {
  if (!developerName) return null;

  const shortDescription = description 
    ? (stripHtml(description).slice(0, 400) + (description.length > 400 ? "..." : ""))
    : `${developerName} is a reputed developer associated with premium projects in this micro-market.`;

  const developerUrl = developerSlug 
    ? `/developers/${developerSlug}`
    : "/developers";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          {logoUrl && (
            <div className="relative w-8 h-8">
              <Image
                src={logoUrl}
                alt={developerName}
                fill
                className="object-contain"
              />
            </div>
          )}
          About {developerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {shortDescription}
        </p>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {yearsInBusiness && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Years Experience</p>
                <p className="text-sm font-semibold">{yearsInBusiness}+</p>
              </div>
            </div>
          )}
          {totalProjects && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Projects Delivered</p>
                <p className="text-sm font-semibold">{totalProjects}+</p>
              </div>
            </div>
          )}
          {totalSftDelivered && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Maximize className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Mn Sft Delivered</p>
                <p className="text-sm font-semibold">{totalSftDelivered}</p>
              </div>
            </div>
          )}
        </div>

        <Link href={developerUrl}>
          <Button variant="outline" className="w-full">
            Know more about {developerName}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}


