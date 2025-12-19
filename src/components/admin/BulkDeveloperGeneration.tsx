"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BulkDeveloperGeneration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Developer Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Generate developer pages and SEO metadata in bulk from your Supabase developer records.
          This is a placeholder shell to keep admin dashboard compiling.
        </p>
        <Button size="sm" disabled>
          Generate Developer Pages
        </Button>
      </CardContent>
    </Card>
  );
}



