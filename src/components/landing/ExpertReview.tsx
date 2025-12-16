"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface ExpertReviewProps {
  expertName?: string;
  designation?: string;
  review?: string;
  projectName?: string;
}

export default function ExpertReview({
  expertName = "Real Estate Expert",
  designation,
  review = "This project stands out for its strategic location, thoughtful planning, and long-term value potential.",
}: ExpertReviewProps) {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto max-w-4xl px-4">
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Quote className="h-6 w-6 text-primary" />
            <CardTitle>Expert Verdict</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{review}</p>
            <p className="font-semibold text-foreground">
              {expertName}
              {designation ? ` • ${designation}` : null}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


