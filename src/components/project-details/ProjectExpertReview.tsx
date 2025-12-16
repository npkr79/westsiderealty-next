import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface ProjectExpertReviewProps {
  review?: string | null;
  projectName: string;
}

export default function ProjectExpertReview({
  review,
  projectName,
}: ProjectExpertReviewProps) {
  if (!review) return null;

  return (
    <section className="mt-10">
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Quote className="h-6 w-6 text-primary" />
          <CardTitle>Westside Realty Expert Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{review}</p>
          <p className="text-xs">
            Our in-house experts have assessed {projectName} based on location, developer
            track record, design efficiency, and long-term appreciation potential.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}


