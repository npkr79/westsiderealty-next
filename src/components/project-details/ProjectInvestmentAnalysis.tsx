import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectInvestmentAnalysisProps {
  headline?: string;
  bulletPoints?: string[];
}

export default function ProjectInvestmentAnalysis({
  headline,
  bulletPoints,
}: ProjectInvestmentAnalysisProps) {
  if (!headline && (!bulletPoints || bulletPoints.length === 0)) return null;

  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Investment Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {headline && <p className="font-semibold text-foreground">{headline}</p>}
          {bulletPoints && bulletPoints.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {bulletPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}


