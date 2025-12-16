"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CitiesManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cities Manager</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Manage city records, visibility, and ordering used across the site. Placeholder UI for your
        existing admin tools.
      </CardContent>
    </Card>
  );
}


