"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BulkImageUpdater() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Image Updater</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Update images for multiple listings or projects in a single operation. This is a
          placeholder interface for your existing bulk update scripts.
        </p>
        <Button size="sm" disabled>
          Run Bulk Update
        </Button>
      </CardContent>
    </Card>
  );
}


