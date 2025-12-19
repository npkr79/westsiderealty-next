"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProjectNameMigration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Name Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Standardize project names and ensure consistency with Supabase records. This is a
          placeholder component to be wired to your migration script.
        </p>
        <Button size="sm" disabled>
          Normalize Project Names
        </Button>
      </CardContent>
    </Card>
  );
}



