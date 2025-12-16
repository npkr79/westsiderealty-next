import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectInvestmentAnalysisProps {
  investmentData: any;
  projectName: string;
}

export default function ProjectInvestmentAnalysis({
  investmentData,
  projectName,
}: ProjectInvestmentAnalysisProps) {
  if (!investmentData) return null;

  // Handle different data formats
  const headline = investmentData.headline || investmentData.title || `Investment Analysis for ${projectName}`;
  const bulletPoints = investmentData.bulletPoints || 
                       investmentData.points || 
                       investmentData.highlights ||
                       (Array.isArray(investmentData) ? investmentData : []);

  const hasContent = headline || (Array.isArray(bulletPoints) && bulletPoints.length > 0);

  if (!hasContent) return null;

  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Investment Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {headline && <p className="font-semibold text-foreground">{headline}</p>}
          {Array.isArray(bulletPoints) && bulletPoints.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {bulletPoints.map((point: any, idx: number) => (
                <li key={idx}>{typeof point === 'string' ? point : point?.text || point?.label || String(point)}</li>
              ))}
            </ul>
          )}
          {typeof investmentData === 'object' && !Array.isArray(investmentData) && investmentData.description && (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: investmentData.description }}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}


