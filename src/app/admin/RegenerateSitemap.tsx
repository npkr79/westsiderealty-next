"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegenerateSitemap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regenerate Sitemap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Trigger sitemap regeneration after making SEO or URL changes. This is a placeholder
          component and should be wired to your actual sitemap generation script.
        </p>
        <Button size="sm" disabled>
          Regenerate Sitemap
        </Button>
      </CardContent>
    </Card>
  );
}



