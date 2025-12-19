"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProjectBulkImageUploader() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Bulk Image Uploader</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Upload and map multiple project images in one go. This is a placeholder component and
          should be connected to your actual bulk upload workflow.
        </p>
        <Button size="sm" disabled>
          Upload Images (placeholder)
        </Button>
      </CardContent>
    </Card>
  );
}



