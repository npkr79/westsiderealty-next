"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SiteContentManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Content Manager</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Manage global content blocks, static pages, and SEO copy from this panel.
      </CardContent>
    </Card>
  );
}




