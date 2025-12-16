"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AIDescriptionPreviewProps {
  formData: any;
  setFormData: (updater: (prev: any) => any) => void;
  isEditMode?: boolean;
}

/**
 * Simple preview block for the current property description.
 * In the original app this was AI-powered; here we just render the text nicely.
 */
export default function AIDescriptionPreview({
  formData,
}: AIDescriptionPreviewProps) {
  const description = formData?.description || "";

  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`Description Preview${""}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}


