"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BulkSEOOptimizer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk SEO Optimizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Optimize SEO metadata in bulk across selected pages or projects. This is a placeholder
          component and should be wired to your actual optimization routines.
        </p>
        <Button size="sm" disabled>
          Run Optimization
        </Button>
      </CardContent>
    </Card>
  );
}


