"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImagesManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Images Manager</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Manage global assets and marketing images used across the website.
      </CardContent>
    </Card>
  );
}




