"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GeneratePagesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate City & Project Pages</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Use this tab to generate static pages for cities, micro-markets, and projects from your
        Supabase data. This is a placeholder for your existing automation UI.
      </CardContent>
    </Card>
  );
}




