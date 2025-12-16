"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ArticleAuthorCardProps {
  author?: string;
  date?: string;
  readTime?: string;
  authorName?: string;
  authorTitle?: string;
}

export default function ArticleAuthorCard({
  authorName = "RE/MAX Westside Realty",
  authorTitle,
}: ArticleAuthorCardProps) {
  return (
    <Card className="mt-6">
      <CardContent className="py-4">
        <p className="text-sm font-semibold">{authorName}</p>
        {authorTitle && (
          <p className="text-xs text-muted-foreground">{authorTitle}</p>
        )}
      </CardContent>
    </Card>
  );
}


