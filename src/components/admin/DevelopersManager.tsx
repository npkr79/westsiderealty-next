"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DevelopersManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developers Manager</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        View and manage developer records connected to projects and landing pages.
      </CardContent>
    </Card>
  );
}


