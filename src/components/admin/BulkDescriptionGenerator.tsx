"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function BulkDescriptionGenerator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Description Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Generate property or project descriptions in bulk using your AI configuration. This is a
          placeholder UI that should be wired to your description generation pipeline.
        </p>
        <Textarea rows={3} placeholder="Optional instructions or notes..." />
        <Button size="sm" disabled>
          Generate Descriptions
        </Button>
      </CardContent>
    </Card>
  );
}


