import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface WestsideVerdictSectionProps {
  review?: string | null;
}

export default function WestsideVerdictSection({ review }: WestsideVerdictSectionProps) {
  if (!review) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary fill-primary" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold text-sm">
                Westside Realty Verdict
              </div>
              <span className="text-sm text-muted-foreground">Expert Review</span>
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              {typeof review === 'string' ? (
                <div className="whitespace-pre-line leading-relaxed">{review}</div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: String(review) }} />
              )}
            </div>
            <div className="mt-4 text-sm font-semibold text-primary">
              — RE/MAX Westside Realty
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
