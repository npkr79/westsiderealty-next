"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProjectMigrationRunner() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Migration Runner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Trigger background migrations for project data such as normalizing configurations,
          amenities, or SEO metadata. This is a placeholder component.
        </p>
        <Button size="sm" disabled>
          Run Migrations
        </Button>
      </CardContent>
    </Card>
  );
}



