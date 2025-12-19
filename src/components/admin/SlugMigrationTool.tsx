"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SlugMigrationTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Slug Migration Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          This utility helps you migrate legacy project and micro-market slugs to the new unified
          format while preserving redirects.
        </p>
        <Button size="sm" disabled>
          Run Migration (placeholder)
        </Button>
      </CardContent>
    </Card>
  );
}



