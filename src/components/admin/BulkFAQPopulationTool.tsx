"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function BulkFAQPopulationTool() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk FAQ Population Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Generate and attach FAQs to multiple projects or city pages in bulk. This is a placeholder
          UI for your FAQ automation.
        </p>
        <Button size="sm" disabled>
          Populate FAQs
        </Button>
      </CardContent>
    </Card>
  );
}



