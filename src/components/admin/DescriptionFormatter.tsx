"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function DescriptionFormatter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Description Formatter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Paste raw descriptions here to clean up whitespace and apply basic formatting before
          saving to Supabase. This is a placeholder UI.
        </p>
        <Textarea rows={4} placeholder="Paste description to format..." />
      </CardContent>
    </Card>
  );
}




