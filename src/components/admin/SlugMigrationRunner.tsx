"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SlugMigrationRunner() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Slug Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Execute stored slug migration tasks. This is a placeholder component and should be wired
          to your actual migration logic.
        </p>
        <Button size="sm" disabled>
          Run Pending Jobs
        </Button>
      </CardContent>
    </Card>
  );
}



