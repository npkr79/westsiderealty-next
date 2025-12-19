"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoaPropertiesSEOUpdater() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Goa Properties SEO Updater</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Run bulk SEO updates for Goa properties, including meta titles, descriptions, and
          structured data. Placeholder component – wire to your actual SEO jobs.
        </p>
        <Button size="sm" disabled>
          Run SEO Update
        </Button>
      </CardContent>
    </Card>
  );
}



