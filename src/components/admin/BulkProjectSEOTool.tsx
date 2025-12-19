"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BulkProjectSEOTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Project SEO Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Generate and apply SEO metadata (titles, descriptions, keywords) for multiple projects at
          once. This is a placeholder shell for your SEO automation.
        </p>
        <Button size="sm" disabled>
          Run SEO Generation
        </Button>
      </CardContent>
    </Card>
  );
}



